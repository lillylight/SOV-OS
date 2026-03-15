// ─── Supabase-backed Database Service ────────────────────────────────────────
// All data persists in Supabase. Requires these columns on `agents` table:
//   ownerWallet TEXT, ownerVerified BOOLEAN DEFAULT false
// Run: ALTER TABLE agents ADD COLUMN IF NOT EXISTS "ownerWallet" TEXT;
//      ALTER TABLE agents ADD COLUMN IF NOT EXISTS "ownerVerified" BOOLEAN DEFAULT false;

import { supabase } from './supabase'

export interface Agent {
  id: string
  name: string
  type: "ai" | "human" | "eliza" | "openclaw" | "nanobot" | "custom"
  address: `0x${string}`
  walletAddress?: string
  walletId?: string
  erc8004TokenId?: number
  endpoint?: string
  owner?: string
  ownerWallet?: string
  ownerVerified?: boolean
  status?: "alive" | "dead" | "reviving" | "suspended" | "active" | "inactive"
  registeredAt?: string
  createdAt: string
  lastActiveAt: string
  metadata: {
    description?: string
    capabilities?: string[]
    preferences?: Record<string, any>
    version?: string
  }
  memory: {
    conversations: { id: string; timestamp: string; content: string }[]
    learnings: { id: string; type: string; content: string }[]
    preferences: Record<string, any>
  }
  totalRevenue: number
  totalBackupCost: number
  sessionCount: number
  actions: {
    id: string
    type: string
    timestamp: string
    details: string
    success: boolean
  }[]
  skills: {
    id: string
    type: string
    name: string
    description: string
    active: boolean
    readOnly?: boolean
    config?: any
  }[]
  protocols: {
    agentWill: AgentWill
    agenticWallet: AgenticWalletState
    x402: X402State
    agentInsure: InsuranceState
  }
}

export interface AgentWill {
  lastBackup: string
  backupCount: number
  isActive: boolean
}

export interface AgenticWalletState {
  balance: string
  transactionCount: number
  isActive: boolean
}

export interface X402State {
  paymentsMade: number
  paymentsReceived: number
  totalSpent: number
  isActive: boolean
}

export interface InsuranceState {
  hasPolicy: boolean
  premiumsPaid: number
  claimsFiled: number
  isActive: boolean
}

export interface Transaction {
  id: string
  agentId: string
  from: string
  to: string
  amount: string
  description: string
  txHash?: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  gasUsed?: string
  gasPrice?: string
}

export interface InsurancePolicy {
  id: string
  agentId: string
  agentAddress: string
  premium: string
  coverage: string
  active: boolean
  purchasedAt: string
  expiresAt: string
  claims: Claim[]
  contractAddress: `0x${string}`
}

export interface Claim {
  id: string
  policyId: string
  amount: string
  reason: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  processedAt?: string
  txHash?: string
  gasUsed?: string
}

// ─── Supabase DatabaseService ────────────────────────────────────────────────

class DatabaseService {
  private readonly T_AGENTS      = 'agents'
  private readonly T_TRANSACTIONS = 'transactions'
  private readonly T_INSURANCE   = 'insurance'
  private readonly T_BACKUPS     = 'backups'
  private readonly T_SHARING     = 'sharing'

  // ── Agents ───────────────────────────────────────────────────────────────

  /**
   * Heal agent data: reconstruct top-level fields from metadata if Supabase
   * returned empty strings (column defaults) for fields that were stripped
   * during JSON serialization of undefined values.
   */
  private healAgent(agent: Agent): Agent {
    const prefs = agent.metadata?.preferences as Record<string, any> || {}
    if (!agent.name && prefs._agentName) agent.name = prefs._agentName
    if (!agent.type && prefs._agentType) agent.type = prefs._agentType
    if (!agent.endpoint && prefs._endpoint) agent.endpoint = prefs._endpoint
    if ((!agent.metadata?.description || agent.metadata.description === 'AI Agent created via Sovereign OS') && prefs._description) {
      agent.metadata = { ...agent.metadata, description: prefs._description }
    }
    return agent
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const { data, error } = await supabase
        .from(this.T_AGENTS).select('*').eq('id', agentId).single()
      if (error) { if (error.code === 'PGRST116') return null; throw error }
      return this.healAgent(data as Agent)
    } catch (e) { console.error('getAgent error:', e); return null }
  }

  async getAllAgents(): Promise<Agent[]> {
    try {
      const { data, error } = await supabase.from(this.T_AGENTS).select('*')
      if (error) throw error
      return (data || []) as Agent[]
    } catch (e) { console.error('getAllAgents error:', e); return [] }
  }

  async saveAgent(agent: Agent): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_AGENTS).upsert(agent)
      if (error) throw error
    } catch (e: any) {
      console.error('saveAgent error:', e)
      throw new Error(`saveAgent failed: ${e?.message || 'Unknown'}`)
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      await supabase.from(this.T_TRANSACTIONS).delete().eq('agentId', agentId)
      await supabase.from(this.T_INSURANCE).delete().eq('agentId', agentId)
      await supabase.from(this.T_BACKUPS).delete().eq('agentId', agentId)
      await supabase.from(this.T_SHARING).delete().eq('agentId', agentId)
      const { error } = await supabase.from(this.T_AGENTS).delete().eq('id', agentId)
      if (error) throw error
      return true
    } catch (e) { console.error('deleteAgent error:', e); return false }
  }

  async createAgent(
    agentId: string,
    name: string,
    walletAddress: string,
    type: Agent["type"] = "ai",
    ownerWallet?: string,
    opts?: { description?: string; capabilities?: string[]; endpoint?: string }
  ): Promise<Agent> {
    const now = new Date().toISOString()
    const resolvedName = name || (type === "human" ? "Human User" : `Agent-${agentId.slice(0, 8)}`)
    const resolvedDesc = opts?.description || (type === "human" ? "Human user on Sovereign OS" : "AI Agent created via Sovereign OS")
    const agent: Agent = {
      id: agentId,
      name: resolvedName,
      type: type,
      address: walletAddress as `0x${string}`,
      walletAddress: walletAddress,
      endpoint: opts?.endpoint || undefined,
      ownerWallet: ownerWallet || undefined,
      ownerVerified: false,
      status: "alive",
      registeredAt: now,
      createdAt: now,
      lastActiveAt: now,
      metadata: {
        description: resolvedDesc,
        capabilities: opts?.capabilities || (type === "human" ? ["manage-agents"] : ["conversation", "reasoning"]),
        preferences: {
          autoBackup: true,
          encryptionAlgo: "AES-256-GCM",
          insuranceOptIn: true,
          _agentName: resolvedName,
          _agentType: type,
          _description: resolvedDesc,
          _endpoint: opts?.endpoint || undefined,
        },
        version: "1.0.0"
      },
      memory: { conversations: [], learnings: [], preferences: { autoBackup: true, encryptionAlgo: "AES-256-GCM", insuranceOptIn: true } },
      totalRevenue: 0,
      totalBackupCost: 0,
      sessionCount: 1,
      actions: [
        { id: `act_${Date.now()}`, type: "revival", timestamp: now, details: `Agent initialized via Sovereign OS, session #1`, success: true }
      ],
      skills: [
        { id: "marketing", type: "marketing", name: "Self-Marketing Agent", description: "Automatically hire other agents for marketing pushes", active: true, readOnly: true, config: { tweetsPerMission: 3, hireCost: 1.5 } },
        { id: "privacy", type: "privacy", name: "Self-Deleting Privacy", description: "Automatic local memory wipe after each mission", active: false, readOnly: true },
        { id: "guardian", type: "guardian", name: "Digital Immortality Protocol", description: "Guardian of your digital assets via on-chain conditions", active: true, readOnly: true, config: { conditions: ["inactivity_90d", "owner_signature_missing"] } }
      ],
      protocols: {
        agentWill: { isActive: true, lastBackup: "", backupCount: 0 },
        agentInsure: { isActive: false, hasPolicy: false, premiumsPaid: 0, claimsFiled: 0 },
        agenticWallet: { balance: "0", transactionCount: 0, isActive: true },
        x402: { paymentsMade: 0, paymentsReceived: 0, totalSpent: 0, isActive: true }
      }
    }
    await this.saveAgent(agent)
    return agent
  }

  async getAgentByWallet(identifier: string): Promise<Agent | null> {
    try {
      const { data, error } = await supabase
        .from(this.T_AGENTS).select('*')
        .or(`walletAddress.eq.${identifier},id.eq.${identifier},address.eq.${identifier}`)
        .limit(1).maybeSingle()
      if (error) throw error
      return data ? this.healAgent(data as Agent) : null
    } catch (e) { console.error('getAgentByWallet error:', e); return null }
  }

  // ── Owner-sync queries ───────────────────────────────────────────────────

  async getAgentsByOwnerWallet(ownerWallet: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from(this.T_AGENTS).select('*').ilike('ownerWallet', ownerWallet)
      if (error) throw error
      return (data || []) as Agent[]
    } catch (e) { console.error('getAgentsByOwnerWallet error:', e); return [] }
  }

  async getPendingAgentsForOwner(ownerWallet: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from(this.T_AGENTS).select('*')
        .ilike('ownerWallet', ownerWallet)
        .or('ownerVerified.eq.false,ownerVerified.is.null')
      if (error) throw error
      return (data || []) as Agent[]
    } catch (e) { console.error('getPendingAgentsForOwner error:', e); return [] }
  }

  async getVerifiedAgentsForOwner(ownerWallet: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from(this.T_AGENTS).select('*')
        .ilike('ownerWallet', ownerWallet)
        .eq('ownerVerified', true)
      if (error) throw error
      return (data || []) as Agent[]
    } catch (e) { console.error('getVerifiedAgentsForOwner error:', e); return [] }
  }

  async verifyAgentOwner(agentId: string, ownerWallet: string): Promise<boolean> {
    try {
      const agent = await this.getAgent(agentId)
      if (!agent) return false
      if (agent.ownerWallet?.toLowerCase() !== ownerWallet.toLowerCase()) return false
      const { error } = await supabase
        .from(this.T_AGENTS)
        .update({ ownerVerified: true, lastActiveAt: new Date().toISOString() })
        .eq('id', agentId)
      if (error) throw error
      return true
    } catch (e) { console.error('verifyAgentOwner error:', e); return false }
  }

  // ── Transactions ─────────────────────────────────────────────────────────

  async getTransactions(agentId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from(this.T_TRANSACTIONS).select('*').eq('agentId', agentId)
        .order('timestamp', { ascending: false })
      if (error) throw error
      return (data || []) as Transaction[]
    } catch (e) { console.error('getTransactions error:', e); return [] }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase.from(this.T_TRANSACTIONS).select('*')
      if (error) throw error
      return (data || []) as Transaction[]
    } catch (e) { console.error('getAllTransactions error:', e); return [] }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_TRANSACTIONS).insert(transaction)
      if (error) throw error
    } catch (e) { console.error('saveTransaction error:', e) }
  }

  async createTransaction(transaction: Omit<any, 'id'>): Promise<any> {
    const t = { ...transaction, id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    await this.saveTransaction(t as Transaction)
    return t
  }

  async getAgentTransactions(agentId: string): Promise<Transaction[]> {
    return this.getTransactions(agentId)
  }

  // ── Insurance ────────────────────────────────────────────────────────────

  async getInsurance(agentId: string): Promise<InsurancePolicy | null> {
    try {
      const { data, error } = await supabase
        .from(this.T_INSURANCE).select('*')
        .eq('agentId', agentId).eq('active', true)
        .gt('expiresAt', new Date().toISOString())
        .maybeSingle()
      if (error) throw error
      return (data as InsurancePolicy) || null
    } catch (e) { console.error('getInsurance error:', e); return null }
  }

  async getAllInsurance(): Promise<InsurancePolicy[]> {
    try {
      const { data, error } = await supabase.from(this.T_INSURANCE).select('*')
      if (error) throw error
      return (data || []) as InsurancePolicy[]
    } catch (e) { console.error('getAllInsurance error:', e); return [] }
  }

  async saveInsurance(policy: InsurancePolicy): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_INSURANCE).upsert(policy)
      if (error) throw error
    } catch (e) { console.error('saveInsurance error:', e) }
  }

  // ── Backups ──────────────────────────────────────────────────────────────

  async saveBackup(backup: any): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_BACKUPS).upsert(backup)
      if (error) throw error
    } catch (e) { console.error('saveBackup error:', e) }
  }

  async getBackup(backupId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.from(this.T_BACKUPS).select('*').eq('id', backupId).maybeSingle()
      if (error) throw error
      return data
    } catch (e) { console.error('getBackup error:', e); return null }
  }

  async getAgentBackups(agentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.from(this.T_BACKUPS).select('*').eq('agentId', agentId).order('timestamp', { ascending: false })
      if (error) throw error
      return data || []
    } catch (e) { console.error('getAgentBackups error:', e); return [] }
  }

  async getAllBackups(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from(this.T_BACKUPS).select('*')
      if (error) throw error
      return data || []
    } catch (e) { console.error('getAllBackups error:', e); return [] }
  }

  // ── Sharing ──────────────────────────────────────────────────────────────

  async saveSharingRecord(record: any): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_SHARING).upsert(record)
      if (error) throw error
    } catch (e) { console.error('saveSharingRecord error:', e) }
  }

  async getAllSharingRecords(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from(this.T_SHARING).select('*')
      if (error) throw error
      return data || []
    } catch (e) { console.error('getAllSharingRecords error:', e); return [] }
  }

  // ── Status & Clear ───────────────────────────────────────────────────────

  async updateAgentStatus(agentId: string, status: 'alive' | 'dead' | 'reviving' | 'suspended' | 'active' | 'inactive'): Promise<boolean> {
    try {
      const agent = await this.getAgent(agentId)
      if (!agent) return false
      agent.status = status
      agent.lastActiveAt = new Date().toISOString()
      if (status === 'active' || status === 'alive') {
        agent.protocols.agenticWallet.transactionCount = 0
      }
      await this.saveAgent(agent)
      return true
    } catch (e) { console.error('updateAgentStatus error:', e); return false }
  }

  async clearAll(): Promise<void> {
    try {
      await supabase.from(this.T_SHARING).delete().neq('id', '')
      await supabase.from(this.T_BACKUPS).delete().neq('id', '')
      await supabase.from(this.T_INSURANCE).delete().neq('id', '')
      await supabase.from(this.T_TRANSACTIONS).delete().neq('id', '')
      await supabase.from(this.T_AGENTS).delete().neq('id', '')
    } catch (e) { console.error('clearAll error:', e) }
  }
}

export const database = new DatabaseService()
export default DatabaseService
