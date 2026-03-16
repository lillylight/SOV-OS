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
      // Only include columns that exist in the Supabase backups table
      const record = {
        id: backup.id,
        agentId: backup.agentId,
        ipfsCid: backup.ipfsCid,
        sizeBytes: backup.sizeBytes,
        timestamp: backup.timestamp,
        cost: backup.cost,
        status: backup.status,
        encryptionKey: backup.encryptionKey || null,
      };
      const { error } = await supabase.from(this.T_BACKUPS).upsert(record)
      if (error) throw error
    } catch (e: any) {
      console.error('saveBackup error:', e)
      throw new Error(`saveBackup failed: ${e?.message || 'Unknown'}`)
    }
  }

  async getBackup(backupId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.from(this.T_BACKUPS).select('*').eq('id', backupId).maybeSingle()
      if (error) throw error
      return data
    } catch (e) { console.error('getBackup error:', e); return null }
  }

  async getAgentBackups(agentId: string, altIds?: string[]): Promise<any[]> {
    try {
      const ids = [agentId, ...(altIds || [])].filter(Boolean)
      const orFilter = ids.map(id => `agentId.eq.${id}`).join(',')
      const { data, error } = await supabase.from(this.T_BACKUPS).select('*').or(orFilter).order('timestamp', { ascending: false })
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

  // ── Tax Transactions ────────────────────────────────────────────────────

  private readonly T_TAX_TRANSACTIONS = 'tax_transactions'
  private readonly T_TAX_SETTINGS = 'tax_settings'

  // Map camelCase tax transaction to snake_case DB columns
  private taxToDb(tx: any): any {
    return {
      id: tx.id,
      agent_wallet: tx.agentWallet,
      timestamp: tx.timestamp,
      tx_hash: tx.txHash || null,
      from_address: tx.fromAddress,
      to_address: tx.toAddress,
      amount: tx.amount,
      category: tx.category,
      subcategory: tx.subcategory,
      description: tx.description || '',
      confidence: tx.confidence ?? 50,
      manually_categorised: tx.manuallyCategorised ?? false,
      jurisdiction: tx.jurisdiction || 'US',
    }
  }

  // Map snake_case DB row to camelCase
  private taxFromDb(row: any): any {
    return {
      id: row.id,
      agentWallet: row.agent_wallet,
      timestamp: row.timestamp,
      txHash: row.tx_hash,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      amount: parseFloat(row.amount) || 0,
      category: row.category,
      subcategory: row.subcategory,
      description: row.description || '',
      confidence: row.confidence ?? 50,
      manuallyCategorised: row.manually_categorised ?? false,
      jurisdiction: row.jurisdiction || 'US',
    }
  }

  async saveTaxTransaction(tx: any): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_TAX_TRANSACTIONS).upsert(this.taxToDb(tx))
      if (error) throw error
    } catch (e) { console.error('saveTaxTransaction error:', e) }
  }

  async getTaxTransactions(walletAddress: string, year?: number): Promise<any[]> {
    try {
      let query = supabase.from(this.T_TAX_TRANSACTIONS).select('*').eq('agent_wallet', walletAddress)
      if (year) {
        const start = new Date(year, 0, 1).toISOString()
        const end = new Date(year, 11, 31, 23, 59, 59).toISOString()
        query = query.gte('timestamp', start).lte('timestamp', end)
      }
      const { data, error } = await query.order('timestamp', { ascending: false })
      if (error) throw error
      return (data || []).map((row: Record<string, unknown>) => this.taxFromDb(row))
    } catch (e) { console.error('getTaxTransactions error:', e); return [] }
  }

  async updateTaxTransaction(id: string, updates: any): Promise<void> {
    try {
      const dbUpdates: any = {}
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory
      if (updates.manuallyCategorised !== undefined) dbUpdates.manually_categorised = updates.manuallyCategorised
      if (updates.confidence !== undefined) dbUpdates.confidence = updates.confidence
      const { error } = await supabase.from(this.T_TAX_TRANSACTIONS).update(dbUpdates).eq('id', id)
      if (error) throw error
    } catch (e) { console.error('updateTaxTransaction error:', e) }
  }

  async getTaxSettings(walletAddress: string): Promise<{
    jurisdiction: string;
    withholdingEnabled: boolean;
    withholdingRate: number;
    taxDestinationWallet: string;
    totalWithheld: number;
    totalGrossIncome: number;
    totalNetIncome: number;
    withholdingCount: number;
    lastWithholdingAt: string | null;
  }> {
    const defaults = {
      jurisdiction: 'US',
      withholdingEnabled: false,
      withholdingRate: 15,
      taxDestinationWallet: '',
      totalWithheld: 0,
      totalGrossIncome: 0,
      totalNetIncome: 0,
      withholdingCount: 0,
      lastWithholdingAt: null,
    }
    try {
      const { data, error } = await supabase.from(this.T_TAX_SETTINGS).select('*').eq('wallet_address', walletAddress).single()
      if (error && error.code !== 'PGRST116') throw error
      if (!data) return defaults
      return {
        jurisdiction: data.jurisdiction || 'US',
        withholdingEnabled: data.withholding_enabled ?? false,
        withholdingRate: parseFloat(data.withholding_rate) || 15,
        taxDestinationWallet: data.tax_destination_wallet || '',
        totalWithheld: parseFloat(data.total_withheld) || 0,
        totalGrossIncome: parseFloat(data.total_gross_income) || 0,
        totalNetIncome: parseFloat(data.total_net_income) || 0,
        withholdingCount: parseInt(data.withholding_count) || 0,
        lastWithholdingAt: data.last_withholding_at || null,
      }
    } catch (e) { console.error('getTaxSettings error:', e); return defaults }
  }

  async saveTaxSettings(walletAddress: string, settings: Partial<{
    jurisdiction: string;
    withholdingEnabled: boolean;
    withholdingRate: number;
    taxDestinationWallet: string;
    totalWithheld: number;
    totalGrossIncome: number;
    totalNetIncome: number;
    withholdingCount: number;
    lastWithholdingAt: string | null;
  }>): Promise<void> {
    try {
      const row: any = { wallet_address: walletAddress }
      if (settings.jurisdiction !== undefined) row.jurisdiction = settings.jurisdiction
      if (settings.withholdingEnabled !== undefined) row.withholding_enabled = settings.withholdingEnabled
      if (settings.withholdingRate !== undefined) row.withholding_rate = settings.withholdingRate
      if (settings.taxDestinationWallet !== undefined) row.tax_destination_wallet = settings.taxDestinationWallet
      if (settings.totalWithheld !== undefined) row.total_withheld = settings.totalWithheld
      if (settings.totalGrossIncome !== undefined) row.total_gross_income = settings.totalGrossIncome
      if (settings.totalNetIncome !== undefined) row.total_net_income = settings.totalNetIncome
      if (settings.withholdingCount !== undefined) row.withholding_count = settings.withholdingCount
      if (settings.lastWithholdingAt !== undefined) row.last_withholding_at = settings.lastWithholdingAt
      row.updated_at = new Date().toISOString()
      const { error } = await supabase.from(this.T_TAX_SETTINGS).upsert(row)
      if (error) throw error
    } catch (e) { console.error('saveTaxSettings error:', e) }
  }

  // ── Tax Withholding Ledger ──────────────────────────────────────────────────

  private readonly T_TAX_WITHHOLDING = 'tax_withholding_ledger'

  private withholdingToDb(ev: any): any {
    return {
      id: ev.id,
      agent_wallet: ev.agentWallet,
      timestamp: ev.timestamp,
      gross_amount: ev.grossAmount,
      tax_amount: ev.taxAmount,
      net_amount: ev.netAmount,
      withholding_rate: ev.withholdingRate,
      tax_destination_wallet: ev.taxDestinationWallet,
      source: ev.source || '',
      source_type: ev.sourceType || 'other',
      tx_hash_incoming: ev.txHashIncoming || null,
      tx_hash_to_agent: ev.txHashToAgent || null,
      tx_hash_to_tax: ev.txHashToTax || null,
      status: ev.status || 'completed',
      jurisdiction: ev.jurisdiction || 'US',
    }
  }

  private withholdingFromDb(row: any): any {
    return {
      id: row.id,
      agentWallet: row.agent_wallet,
      timestamp: row.timestamp,
      grossAmount: parseFloat(row.gross_amount) || 0,
      taxAmount: parseFloat(row.tax_amount) || 0,
      netAmount: parseFloat(row.net_amount) || 0,
      withholdingRate: parseFloat(row.withholding_rate) || 0,
      taxDestinationWallet: row.tax_destination_wallet || '',
      source: row.source || '',
      sourceType: row.source_type || 'other',
      txHashIncoming: row.tx_hash_incoming,
      txHashToAgent: row.tx_hash_to_agent,
      txHashToTax: row.tx_hash_to_tax,
      status: row.status || 'completed',
      jurisdiction: row.jurisdiction || 'US',
    }
  }

  async saveWithholdingEvent(ev: any): Promise<void> {
    try {
      const { error } = await supabase.from(this.T_TAX_WITHHOLDING).upsert(this.withholdingToDb(ev))
      if (error) throw error
    } catch (e) { console.error('saveWithholdingEvent error:', e) }
  }

  async getWithholdingEvents(walletAddress: string, year?: number): Promise<any[]> {
    try {
      let query = supabase.from(this.T_TAX_WITHHOLDING).select('*').eq('agent_wallet', walletAddress)
      if (year) {
        const start = new Date(year, 0, 1).toISOString()
        const end = new Date(year, 11, 31, 23, 59, 59).toISOString()
        query = query.gte('timestamp', start).lte('timestamp', end)
      }
      const { data, error } = await query.order('timestamp', { ascending: false })
      if (error) throw error
      return (data || []).map((row: Record<string, unknown>) => this.withholdingFromDb(row))
    } catch (e) { console.error('getWithholdingEvents error:', e); return [] }
  }

  async getWithholdingStats(walletAddress: string): Promise<{ totalWithheld: number; totalGross: number; totalNet: number; count: number }> {
    try {
      const { data, error } = await supabase.from(this.T_TAX_WITHHOLDING)
        .select('gross_amount, tax_amount, net_amount')
        .eq('agent_wallet', walletAddress)
        .eq('status', 'completed')
      if (error) throw error
      const rows = data || []
      return {
        totalWithheld: rows.reduce((sum: number, r: any) => sum + (parseFloat(r.tax_amount) || 0), 0),
        totalGross: rows.reduce((sum: number, r: any) => sum + (parseFloat(r.gross_amount) || 0), 0),
        totalNet: rows.reduce((sum: number, r: any) => sum + (parseFloat(r.net_amount) || 0), 0),
        count: rows.length,
      }
    } catch (e) { console.error('getWithholdingStats error:', e); return { totalWithheld: 0, totalGross: 0, totalNet: 0, count: 0 } }
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
