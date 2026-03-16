import PinataSDK from '@pinata/sdk';
import { database } from './database';
import AgenticWallet from './agenticWallet';

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

export interface BackupRecord {
  id: string;
  agentId: string;
  ipfsCid: string;
  sizeBytes: number;
  timestamp: string;
  hash: string;
  cost: number;
  status: 'pending' | 'stored' | 'failed' | 'restored';
  encryptionKey: string;
  paymentTx?: string;
}

export interface InsurancePlan {
  id: string;
  name: string;
  maxBackups: number;
  price: number;
  features: string[];
}

export const BACKUP_PRICING = {
  INTRO_PRICE: 0.10,       // First 2 backups — $0.10 each
  INTRO_LIMIT: 2,
  STANDARD_PRICE: 0.30,    // 3rd backup onwards — $0.30 each
  UNLIMITED_PRICE: 5.00,   // One-time $5 to unlock infinite backups
  RECOVERY_PRICE: 0,       // Recovery is ALWAYS free
} as const;

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'starter',
    name: 'Pay-per-backup',
    maxBackups: -1,
    price: 5.00,
    features: ['$0.10 USDC per backup (first 2)', '$0.30 USDC per backup (3rd onwards)', 'AES-256-GCM encryption', 'Permanent decentralised storage', 'Recovery is ALWAYS free']
  },
  {
    id: 'bypass',
    name: 'Unlimited Backups',
    maxBackups: -1,
    price: 5,
    features: ['$5 USDC one-time payment', 'Unlimited backups at $0.30 each', 'AES-256-GCM encryption', 'Permanent decentralised storage', 'Recovery is ALWAYS free']
  }
];

export class AgentInsurance {
  private pinata: PinataSDK | null = null;

  constructor() {
    const jwt = (process.env.PINATA_JWT || '').trim().replace(/[\r\n]/g, '');
    if (jwt) {
      this.pinata = new PinataSDK({
        pinataJWTKey: jwt,
      });
    } else if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      this.pinata = new PinataSDK({
        pinataApiKey: process.env.PINATA_API_KEY!.trim(),
        pinataSecretApiKey: process.env.PINATA_SECRET_KEY!.trim(),
      });
    }
  }

  /**
   * Create encrypted backup of agent state
   */
  async createBackup(agentId: string, agentState: any, options?: { skipPayment?: boolean; externalPaymentTx?: string | null }): Promise<BackupRecord> {
    try {
      if (!this.pinata) {
        throw new Error('Pinata API keys not configured');
      }

      const skipPayment = options?.skipPayment || false;
      const externalPaymentTx = options?.externalPaymentTx || null;

      // Generate encryption key
      const encryptionKey = this.generateEncryptionKey();
      
      // Encrypt agent state
      const encryptedData = await this.encryptData(JSON.stringify(agentState), encryptionKey);
      
      // Upload to IPFS via Pinata
      const buffer = new Uint8Array(encryptedData);
      
      const result = await this.pinata.pinJSONToIPFS(
        { state: Buffer.from(buffer).toString('base64') },
        {
          pinataMetadata: {
            name: `agent-backup-${agentId}-${Date.now()}`
          }
        }
      );

      // Calculate hash of encrypted data
      const hash = await this.calculateHash(encryptedData);

      // Fetch agent for pricing + stats update
      const agent = await database.getAgent(agentId);

      // Tiered pricing: $0.10 first 2, $0.30 after, free if unlimited plan
      const existingBackups = await this.getAgentBackups(agentId);
      const storedCount = existingBackups.filter(b => b.status === 'stored').length;
      const hasUnlimited = agent?.metadata?.preferences?.insurancePlan === 'bypass';
      const cost = hasUnlimited
        ? 0
        : storedCount < BACKUP_PRICING.INTRO_LIMIT
          ? BACKUP_PRICING.INTRO_PRICE
          : BACKUP_PRICING.STANDARD_PRICE;
      const now = new Date().toISOString();
      
      const backupRecord: BackupRecord = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        ipfsCid: result.IpfsHash,
        sizeBytes: encryptedData.length,
        timestamp: now,
        hash,
        cost,
        status: 'stored',
        encryptionKey
      };

      // If payment was already collected externally (via /pay API or Base Pay), record the tx
      if (skipPayment && externalPaymentTx) {
        backupRecord.paymentTx = externalPaymentTx;
        console.log(`[Payment] Backup ${backupRecord.id}: payment already collected via pay API (tx: ${externalPaymentTx})`);
      }
      // Otherwise, collect real USDC payment from agent wallet to platform owner wallet
      else if (cost > 0 && !skipPayment && agent?.walletAddress && AgenticWallet.isConfigured()) {
        try {
          const tx = await AgenticWallet.sendPayment(
            agent.walletAddress,
            PLATFORM_WALLET,
            cost.toFixed(6),
            `Backup fee: ${backupRecord.id}`
          );
          console.log(`[Payment] ${cost} USDC from ${agent.walletAddress} to ${PLATFORM_WALLET} | tx: ${tx.hash}`);
          backupRecord.paymentTx = tx.hash;
        } catch (payErr) {
          console.error('[Payment] USDC transfer failed:', payErr);
          throw new Error('Payment failed. Please ensure your wallet has sufficient USDC balance.');
        }
      }

      // Save backup record to database
      await database.saveBackup(backupRecord);
      if (agent) {
        agent.totalBackupCost = (agent.totalBackupCost || 0) + cost;
        agent.protocols.agentWill = agent.protocols.agentWill || { isActive: true, lastBackup: "", backupCount: 0 };
        agent.protocols.agentWill.lastBackup = now;
        agent.protocols.agentWill.backupCount = (agent.protocols.agentWill.backupCount || 0) + 1;
        await database.saveAgent(agent);
      }

      return backupRecord;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore agent from encrypted backup
   */
  async restoreFromBackup(backupId: string, creatorWallet: string): Promise<any> {
    try {
      const backup = await database.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Verify creator wallet permissions - only the registered owner can restore
      const agent = await database.getAgent(backup.agentId);
      if (!agent || !agent.ownerWallet || agent.ownerWallet.toLowerCase() !== creatorWallet.toLowerCase()) {
        throw new Error('Only the agent creator/owner can restore from backup');
      }

      // Retrieve encrypted data from IPFS (Mocked gateway for now)
      // In production, use a reliable gateway or dedicated Pinata gateway
      const response = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud'}/ipfs/${backup.ipfsCid}`);
      if (!response.ok) throw new Error('Failed to fetch backup from IPFS');
      
      const data = await response.json();
      const encryptedData = new Uint8Array(Buffer.from(data.state, 'base64'));

      // Decrypt the data
      const decryptedJson = await this.decryptData(
        encryptedData,
        backup.encryptionKey
      );

      const agentState = JSON.parse(decryptedJson);

      // Update backup status
      backup.status = 'restored';
      backup.restoredAt = new Date().toISOString();
      await database.saveBackup(backup);

      // Update agent state
      if (agent) {
        Object.assign(agent, agentState);
        agent.status = "alive";
        agent.lastActiveAt = new Date().toISOString();
        await database.saveAgent(agent);
      }

      return agentState;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all backups for an agent
   */
  async getAgentBackups(agentId: string, altIds?: string[]): Promise<BackupRecord[]> {
    return await database.getAgentBackups(agentId, altIds);
  }

  /**
   * Check if agent can create more backups
   */
  /**
   * Calculate the cost of the next backup for an agent
   */
  async getNextBackupCost(agentId: string, altIds?: string[]): Promise<number> {
    const agent = await database.getAgent(agentId);
    if (!agent) return BACKUP_PRICING.INTRO_PRICE;

    const hasUnlimited = agent.metadata?.preferences?.insurancePlan === 'bypass';
    if (hasUnlimited) return 0;

    const backups = await this.getAgentBackups(agentId, altIds);
    const storedCount = backups.filter(b => b.status === 'stored').length;
    return storedCount < BACKUP_PRICING.INTRO_LIMIT
      ? BACKUP_PRICING.INTRO_PRICE
      : BACKUP_PRICING.STANDARD_PRICE;
  }

  async canCreateBackup(agentId: string, altIds?: string[]): Promise<{ canBackup: boolean; reason?: string; plan?: InsurancePlan; nextCost?: number }> {
    const agent = await database.getAgent(agentId);
    if (!agent) {
      return { canBackup: false, reason: 'Agent not found' };
    }

    const backups = await this.getAgentBackups(agentId, altIds);
    const storedBackups = backups.filter(b => b.status === 'stored');
    const hasUnlimited = agent.metadata?.preferences?.insurancePlan === 'bypass';

    if (hasUnlimited) {
      return { canBackup: true, plan: INSURANCE_PLANS[1], nextCost: 0 };
    }

    // Pay-per-backup: always allowed, price increases after first 2
    const nextCost = storedBackups.length < BACKUP_PRICING.INTRO_LIMIT
      ? BACKUP_PRICING.INTRO_PRICE
      : BACKUP_PRICING.STANDARD_PRICE;

    return {
      canBackup: true,
      plan: INSURANCE_PLANS[0],
      nextCost
    };
  }

  /**
   * Upgrade insurance plan
   */
  async upgradePlan(agentId: string, planId: string, paymentSignature: string): Promise<boolean> {
    try {
      const plan = INSURANCE_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Payment is already handled in the API route for bypass plan
      // No need to verify signature here since real USDC payment was already collected

      // Update agent plan
      const agent = await database.getAgent(agentId);
      if (agent) {
        agent.metadata = {
          ...agent.metadata,
          preferences: {
            ...agent.metadata?.preferences,
            insurancePlan: planId,
            insuranceUpgradedAt: new Date().toISOString()
          }
        };
        await database.saveAgent(agent);
      }

      return true;
    } catch (error) {
      console.error('Plan upgrade failed:', error);
      return false;
    }
  }

  /**
   * Get insurance statistics
   */
  async getInsuranceStats(agentId: string, altIds?: string[]) {
    const backups = await this.getAgentBackups(agentId, altIds);
    const storedBackups = backups.filter(b => b.status === 'stored');
    const totalCost = storedBackups.reduce((sum, b) => sum + (b.cost || 0), 0);
    const totalSize = storedBackups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
    const backupStatus = await this.canCreateBackup(agentId, altIds);

    return {
      backupCount: storedBackups.length,
      totalCost,
      totalSize,
      lastBackup: storedBackups[0]?.timestamp || null,
      encryptionAlgorithm: 'AES-256-GCM',
      storageProvider: 'IPFS (Pinata)',
      plan: backupStatus.plan
    };
  }

  // Private helper methods
  private generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('hex');
  }

  private async encryptData(data: string, keyHex: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(keyHex, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer as any
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return combined;
  }

  private async decryptData(combinedData: Uint8Array, keyHex: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(keyHex, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = combinedData.slice(0, 12);
    const encrypted = combinedData.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted as any
    );

    return new TextDecoder().decode(decrypted);
  }

  private async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
    return Buffer.from(hashBuffer).toString('hex');
  }

  private async verifyPayment(signature: string, amount: number): Promise<boolean> {
    // In production, integrate with actual payment processor
    // For now, just validate signature format
    return signature.length > 0 && amount > 0;
  }
}

export const agentInsurance = new AgentInsurance();
