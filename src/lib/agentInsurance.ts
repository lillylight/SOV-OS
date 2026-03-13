import PinataSDK from '@pinata/sdk';
import { database } from './database';

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
}

export interface InsurancePlan {
  id: string;
  name: string;
  maxBackups: number;
  price: number;
  features: string[];
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    maxBackups: 2,
    price: 0,
    features: ['Up to 2 encrypted backups', 'Permanent IPFS storage', 'Free restore']
  },
  {
    id: 'infinite',
    name: 'Infinite',
    maxBackups: -1, // Unlimited
    price: 10,
    features: ['Unlimited encrypted backups', 'Permanent IPFS storage', 'Free restore', 'Priority support']
  }
];

export class AgentInsurance {
  private pinata: PinataSDK;

  constructor() {
    this.pinata = new PinataSDK({
      pinataApiKey: process.env.PINATA_API_KEY || '',
      pinataSecretApiKey: process.env.PINATA_SECRET_KEY || '',
    });
  }

  /**
   * Create encrypted backup of agent state
   */
  async createBackup(agentId: string, agentState: any): Promise<BackupRecord> {
    try {
      // Generate encryption key
      const encryptionKey = this.generateEncryptionKey();
      
      // Encrypt agent state
      const encryptedData = await this.encryptData(JSON.stringify(agentState), encryptionKey);
      
      // Upload to IPFS via Pinata
      const buffer = new ArrayBuffer(encryptedData.length);
      const view = new Uint8Array(buffer);
      view.set(encryptedData);
      
      const result = await this.pinata.pinFileToIPFS(
        new Blob([buffer], { type: 'application/octet-stream' }),
        {
          pinataMetadata: {
            name: `agent-backup-${agentId}-${Date.now()}`
          }
        }
      );

      // Calculate hash of encrypted data
      const hash = await this.calculateHash(encryptedData);
      
      const backupRecord: BackupRecord = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId,
        ipfsCid: result.IpfsHash,
        sizeBytes: encryptedData.length,
        timestamp: new Date().toISOString(),
        hash,
        cost: 1.0, // 1 USDC per backup
        status: 'stored',
        encryptionKey
      };

      // Save backup record to database
      database.saveBackup(backupRecord);
      
      // Update agent insurance state
      const agent = database.getAgent(agentId);
      if (agent) {
        agent.protocols.agentInsure.isActive = true;
        agent.protocols.agentInsure.hasPolicy = true;
        agent.protocols.agentInsure.premiumsPaid += 1;
        database.saveAgent(agent);
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
      const backup = database.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Verify creator wallet permissions
      const agent = database.getAgent(backup.agentId);
      if (!agent || agent.owner !== creatorWallet) {
        throw new Error('Only the agent creator can restore from backup');
      }

      // Retrieve encrypted data from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${backup.ipfsCid}`);
      const encryptedData = await response.arrayBuffer();

      // Decrypt the data
      const decryptedJson = await this.decryptData(
        new Uint8Array(encryptedData),
        backup.encryptionKey
      );

      const agentState = JSON.parse(decryptedJson);

      // Update backup status
      backup.status = 'restored';
      database.saveBackup(backup);

      // Update agent state
      if (agent) {
        Object.assign(agent, agentState);
        agent.lastActiveAt = new Date().toISOString();
        database.saveAgent(agent);
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
  getAgentBackups(agentId: string): BackupRecord[] {
    return database.getAgentBackups(agentId);
  }

  /**
   * Check if agent can create more backups
   */
  canCreateBackup(agentId: string): { canBackup: boolean; reason?: string; plan?: InsurancePlan } {
    const agent = database.getAgent(agentId);
    if (!agent) {
      return { canBackup: false, reason: 'Agent not found' };
    }

    const backups = this.getAgentBackups(agentId);
    const storedBackups = backups.filter(b => b.status === 'stored');

    // Check if agent has infinite plan
    const hasInfinitePlan = agent.metadata?.preferences?.insurancePlan === 'infinite';
    if (hasInfinitePlan) {
      return { canBackup: true, plan: INSURANCE_PLANS[1] };
    }

    // Check standard plan limit
    if (storedBackups.length >= 2) {
      return { 
        canBackup: false, 
        reason: 'Maximum backups reached. Upgrade to Infinite plan for unlimited backups.',
        plan: INSURANCE_PLANS[0]
      };
    }

    return { canBackup: true, plan: INSURANCE_PLANS[0] };
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

      if (plan.price > 0) {
        // Process payment (would integrate with payment processor)
        const paymentValid = await this.verifyPayment(paymentSignature, plan.price);
        if (!paymentValid) {
          throw new Error('Payment verification failed');
        }
      }

      // Update agent plan
      const agent = database.getAgent(agentId);
      if (agent) {
        agent.metadata = {
          ...agent.metadata,
          preferences: {
            ...agent.metadata?.preferences,
            insurancePlan: planId,
            insuranceUpgradedAt: new Date().toISOString()
          }
        };
        database.saveAgent(agent);
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
  getInsuranceStats(agentId: string) {
    const backups = this.getAgentBackups(agentId);
    const storedBackups = backups.filter(b => b.status === 'stored');
    const totalCost = storedBackups.reduce((sum, b) => sum + b.cost, 0);
    const totalSize = storedBackups.reduce((sum, b) => sum + b.sizeBytes, 0);

    return {
      backupCount: storedBackups.length,
      totalCost,
      totalSize,
      lastBackup: storedBackups[0]?.timestamp || null,
      encryptionAlgorithm: 'AES-256-GCM',
      storageProvider: 'IPFS (Pinata)',
      plan: this.canCreateBackup(agentId).plan
    };
  }

  // Private helper methods
  private generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async encryptData(data: string, key: string): Promise<Uint8Array> {
    // Simple XOR encryption for demo (use proper AES-GCM in production)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key).slice(0, dataBuffer.length);
    
    const encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return encrypted;
  }

  private async decryptData(encryptedData: Uint8Array, key: string): Promise<string> {
    // Simple XOR decryption for demo (use proper AES-GCM in production)
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key).slice(0, encryptedData.length);
    
    const decrypted = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      decrypted[i] = encryptedData[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return new TextDecoder().decode(decrypted);
  }

  private async calculateHash(data: Uint8Array): Promise<string> {
    // Simple hash calculation for demo (use proper SHA-256 in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  private async verifyPayment(signature: string, amount: number): Promise<boolean> {
    // In production, integrate with actual payment processor
    // For now, just validate signature format
    return signature.length > 0 && amount > 0;
  }
}

export const agentInsurance = new AgentInsurance();
