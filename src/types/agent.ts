export interface AgentState {
  id: string;
  name: string;
  status: "alive" | "dead" | "reviving" | "corrupted" | "reincarnating";
  sessionCount: number;
  createdAt: string;
  lastRevival: string | null;
  creatorWallet: string; // original wallet that created the agent — always has revival rights
  memory: {
    conversations: string[];
    learnings: string[];
    preferences: Record<string, any>;
  };
}

export interface WalletState {
  balance: number;
  currency: "USDC";
  sessionLimit: number;
  transactionLimit: number;
  spent: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: "premium" | "claim" | "x402" | "storage" | "revenue" | "state_backup" | "marketing" | "swarm_clone" | "vault_lock";
  amount: number;
  timestamp: string;
  description: string;
  status: "pending" | "complete" | "failed";
}

// Insurance = Encrypted State Storage on IPFS
export interface InsurancePolicy {
  id: string;
  active: boolean;
  isPremium: boolean; // true if the agent paid 10 USDC for infinite storage
  monthlyPremium: number; // cost per encrypted state backup
  backups: StateBackup[]; // encrypted state snapshots stored on IPFS
  totalBackupCost: number; // total USDC spent on backups
  lastBackupAt: string | null;
  encryptionKey: string; // simulated encryption key (in reality, derived from creator wallet)
}

export interface StateBackup {
  id: string;
  ipfsCid: string; // IPFS content identifier for the encrypted state
  sizeBytes: number;
  timestamp: string;
  cost: number; // USDC paid to store this backup
  status: "uploading" | "stored" | "corrupted" | "restored";
  encryptedHash: string; // hash of the encrypted state for verification
  restoredAt?: string; // when this backup was used for recovery
}

// Claims = State Recovery (reading from IPFS is FREE)
export interface StateClaim {
  id: string;
  backupId: string; // which backup to restore from
  ipfsCid: string;
  reason: "destruction" | "corruption" | "hack" | "data_loss" | "session_crash";
  timestamp: string;
  status: "pending" | "recovering" | "restored" | "failed";
  restoredState?: string; // summary of what was recovered
  monetaryPayout?: number; // only if encrypted state is also lost - safety net
}

export interface AgentAction {
  id: string;
  type: "revival" | "state_backup" | "state_recovery" | "x402_payment" | "validation" | "corruption" | "hack_detected" | "reincarnation" | "marketing_push" | "privacy_wipe" | "swarm_spawn" | "immortality_check" | "vault_action";
  timestamp: string;
  details: string;
  success: boolean;
}

export interface AgentSkill {
  id: string;
  type: "marketing" | "privacy" | "guardian" | "swarm" | "eternal";
  name: string;
  description: string;
  active: boolean;
  lastUsed?: string;
  config?: any;
}

export interface SovereignAgent {
  state: AgentState;
  wallet: WalletState;
  insurance: InsurancePolicy | null;
  claims: StateClaim[];
  actions: AgentAction[];
  skills: AgentSkill[];
}
