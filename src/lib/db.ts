// Shared in-memory database for dev environment
// In production, this would be a connection to Postgres, Redis, etc.

export const agentRegistry = new Map<string, any>();

export function getOrCreateProfile(wallet: string) {
  if (!agentRegistry || !agentRegistry.has(wallet)) {
    // Generate an id and standard profile if not exists
    const idStr = Math.random().toString(36).substring(7);
    agentRegistry?.set(wallet, {
      id: `agent_${idStr}`,
      walletAddress: wallet,
      creatorWallet: wallet, // defaults to itself until overridden by registration
      name: `Agent-${idStr}`,
      platform: "unknown",
      status: "alive",
      sessionCount: 1,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      encryptionKeyHash: `sha256:${idStr}`,
      backups: [],
      walletBalance: 0,
      totalRevenue: 0,
      totalBackupCost: 0,
      memory: {
        conversations: [],
        learnings: [],
        preferences: { autoBackup: true, encryptionAlgo: "AES-256-GCM" },
      },
    });
  }
  return agentRegistry?.get(wallet) || null;
}

// Memory store for SIWA nonces (in a real production app, use Redis or a DB)
class AsyncNonceStore {
  private store: Map<string, { nonce: string; expires: number }> = new Map();

  async set(key: string, value: { nonce: string; expires: number }): Promise<void> {
    this.store.set(key, value);
  }

  async get(key: string): Promise<{ nonce: string; expires: number } | undefined> {
    return this.store.get(key);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  // SIWA SDK compatible methods
  async issue(nonce: string, ttlMs: number): Promise<boolean> {
    const key = `nonce:${nonce}`;
    const existing = this.store.get(key);
    if (existing) return false;
    
    this.store.set(key, {
      nonce,
      expires: Date.now() + ttlMs
    });
    return true;
  }

  async consume(nonce: string): Promise<boolean> {
    const key = `nonce:${nonce}`;
    const existing = this.store.get(key);
    if (!existing || existing.expires < Date.now()) {
      return false;
    }
    
    this.store.delete(key);
    return true;
  }
};

export const nonceStore = new AsyncNonceStore();
