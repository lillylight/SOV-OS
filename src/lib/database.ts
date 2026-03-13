// Real database persistence using localStorage + fallback
// In production, replace with PostgreSQL/MongoDB

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
  status?: "active" | "inactive" | "suspended"
  registeredAt?: string
  createdAt: string
  lastActiveAt: string
  metadata: {
    description?: string
    capabilities?: string[]
    preferences?: Record<string, any>
    version?: string
  }
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

class DatabaseService {
  private readonly AGENTS_KEY = 'sovereign_agents'
  private readonly TRANSACTIONS_KEY = 'transactions'
  private readonly INSURANCE_KEY = 'insurance'
  private readonly BACKUPS_KEY = 'backups'
  private readonly SHARING_KEY = 'sharing'

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | null {
    try {
      const agents = this.getAllAgents()
      return agents.find(agent => agent.id === agentId) || null
    } catch (error) {
      console.error('Failed to get agent:', error)
      return null
    }
  }

  
  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    try {
      const data = localStorage.getItem(this.AGENTS_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get all agents:', error)
      return []
    }
  }

  /**
   * Save agent
   */
  saveAgent(agent: Agent): void {
    try {
      const agents = this.getAllAgents()
      const existingIndex = agents.findIndex(a => a.id === agent.id)
      
      if (existingIndex >= 0) {
        agents[existingIndex] = agent
      } else {
        agents.push(agent)
      }
      
      localStorage.setItem(this.AGENTS_KEY, JSON.stringify(agents))
      console.log(`Agent saved: ${agent.id}`)
    } catch (error) {
      console.error('Failed to save agent:', error)
      throw new Error('Agent save failed')
    }
  }

  /**
   * Delete agent
   */
  deleteAgent(agentId: string): boolean {
    try {
      const agents = this.getAllAgents()
      const filteredAgents = agents.filter(agent => agent.id !== agentId)
      
      if (filteredAgents.length === agents.length) {
        return false // Agent not found
      }
      
      localStorage.setItem(this.AGENTS_KEY, JSON.stringify(filteredAgents))
      
      // Also delete related transactions and insurance
      this.deleteTransactionsByAgent(agentId)
      this.deleteInsuranceByAgent(agentId)
      
      console.log(`Agent deleted: ${agentId}`)
      return true
    } catch (error) {
      console.error('Failed to delete agent:', error)
      return false
    }
  }

  /**
   * Get transactions for agent
   */
  getTransactions(agentId: string): any[] {
    try {
      const transactions = this.getAllTransactions()
      return transactions
        .filter(tx => tx.agentId === agentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Failed to get transactions:', error)
      return []
    }
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): any[] {
    try {
      const data = localStorage.getItem(this.TRANSACTIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get all transactions:', error)
      return []
    }
  }

  /**
   * Save transaction
   */
  saveTransaction(transaction: any): void {
    try {
      const transactions = this.getAllTransactions()
      transactions.push(transaction)
      
      // Keep only last 1000 transactions per agent
      const agentTxs = transactions.filter(tx => tx.agentId === transaction.agentId)
      if (agentTxs.length > 1000) {
        const toRemove = agentTxs.slice(0, -1000)
        toRemove.forEach(tx => {
          const index = transactions.findIndex(t => t.hash === tx.hash)
          if (index >= 0) transactions.splice(index, 1)
        })
      }
      
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions))
      console.log(`Transaction saved: ${transaction.hash}`)
    } catch (error) {
      console.error('Failed to save transaction:', error)
      throw new Error('Transaction save failed')
    }
  }

  /**
   * Delete transactions by agent
   */
  private deleteTransactionsByAgent(agentId: string): void {
    try {
      const transactions = this.getAllTransactions()
      const filteredTransactions = transactions.filter(tx => tx.agentId !== agentId)
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(filteredTransactions))
    } catch (error) {
      console.error('Failed to delete transactions:', error)
    }
  }

  /**
   * Get insurance for agent
   */
  getInsurance(agentId: string): any | null {
    try {
      const insurances = this.getAllInsurance()
      return insurances.find(ins => 
        ins.agentId === agentId && ins.active && 
        new Date(ins.expiresAt) > new Date()
      ) || null
    } catch (error) {
      console.error('Failed to get insurance:', error)
      return null
    }
  }

  /**
   * Get all insurance records
   */
  getAllInsurance(): any[] {
    try {
      const data = localStorage.getItem(this.INSURANCE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get all insurance:', error)
      return []
    }
  }

  /**
   * Save insurance
   */
  saveInsurance(insurance: any): void {
    try {
      const insurances = this.getAllInsurance()
      const existingIndex = insurances.findIndex(ins => ins.id === insurance.id)
      
      if (existingIndex >= 0) {
        insurances[existingIndex] = insurance
      } else {
        insurances.push(insurance)
      }
      
      localStorage.setItem(this.INSURANCE_KEY, JSON.stringify(insurances))
      console.log(`Insurance saved: ${insurance.id}`)
    } catch (error) {
      console.error('Failed to save insurance:', error)
      throw new Error('Insurance save failed')
    }
  }

  /**
   * Delete insurance by agent
   */
  private deleteInsuranceByAgent(agentId: string): void {
    try {
      const insurances = this.getAllInsurance()
      const filteredInsurances = insurances.filter(ins => ins.agentId !== agentId)
      localStorage.setItem(this.INSURANCE_KEY, JSON.stringify(filteredInsurances))
    } catch (error) {
      console.error('Failed to delete insurance:', error)
    }
  }

  /**
   * Create new agent
   */
  createAgent(agentId: string, name: string, walletAddress: string): Agent {
    const now = new Date().toISOString()
    
    const agent: Agent = {
      id: agentId,
      name: name || `Agent-${agentId.slice(0, 8)}`,
      type: "ai",
      address: walletAddress as `0x${string}`,
      walletAddress,
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      metadata: {
        description: "AI Agent created via SovereignOS",
        capabilities: ["conversation", "reasoning"],
        preferences: { 
          autoBackup: true, 
          encryptionAlgo: "AES-256-GCM",
          insuranceOptIn: true
        },
        version: "1.0.0"
      },
      protocols: {
        agentWill: { isActive: true, lastBackup: "", backupCount: 0 },
        agentInsure: { isActive: false, hasPolicy: false, premiumsPaid: 0, claimsFiled: 0 },
        agenticWallet: { 
          balance: "1000", 
          transactionCount: 0,
          isActive: true
        },
        x402: {
          paymentsMade: 0,
          paymentsReceived: 0,
          totalSpent: 0,
          isActive: true
        }
      }
    }

    this.saveAgent(agent)
    return agent
  }

  
  /**
   * Get agent by wallet address
   */
  getAgentByWallet(walletAddress: string): Agent | null {
    const agents = this.getAllAgents()
    return agents.find(agent => agent.walletAddress === walletAddress) || null
  }

  /**
   * Create transaction
   */
  createTransaction(transaction: Omit<any, 'id'>): any {
    const newTransaction: any = {
      ...transaction,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    this.saveTransaction(newTransaction)
    return newTransaction
  }

  /**
   * Get agent transactions
   */
  getAgentTransactions(agentId: string): any[] {
    const transactions = this.getAllTransactions()
    return transactions
      .filter(tx => tx.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Save backup record
   */
  saveBackup(backup: any): void {
    try {
      const backups = this.getAllBackups()
      const existingIndex = backups.findIndex(b => b.id === backup.id)
      
      if (existingIndex >= 0) {
        backups[existingIndex] = backup
      } else {
        backups.push(backup)
      }
      
      localStorage.setItem(this.BACKUPS_KEY, JSON.stringify(backups))
    } catch (error) {
      console.error('Failed to save backup:', error)
    }
  }

  /**
   * Get backup by ID
   */
  getBackup(backupId: string): any | null {
    try {
      const backups = this.getAllBackups()
      return backups.find(b => b.id === backupId) || null
    } catch (error) {
      console.error('Failed to get backup:', error)
      return null
    }
  }

  /**
   * Get all backups for an agent
   */
  getAgentBackups(agentId: string): any[] {
    try {
      const backups = this.getAllBackups()
      return backups
        .filter(b => b.agentId === agentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Failed to get agent backups:', error)
      return []
    }
  }

  /**
   * Get all backups
   */
  getAllBackups(): any[] {
    try {
      const data = localStorage.getItem(this.BACKUPS_KEY || 'backups')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get all backups:', error)
      return []
    }
  }

  /**
   * Save sharing record
   */
  saveSharingRecord(record: any): void {
    try {
      const records = this.getAllSharingRecords()
      const existingIndex = records.findIndex(r => r.id === record.id)
      
      if (existingIndex >= 0) {
        records[existingIndex] = record
      } else {
        records.push(record)
      }
      
      localStorage.setItem(this.SHARING_KEY || 'sharing', JSON.stringify(records))
    } catch (error) {
      console.error('Failed to save sharing record:', error)
    }
  }

  /**
   * Get all sharing records
   */
  getAllSharingRecords(): any[] {
    try {
      const data = localStorage.getItem(this.SHARING_KEY || 'sharing')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to get all sharing records:', error)
      return []
    }
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: 'active' | 'inactive' | 'suspended'): boolean {
    try {
      const agent = this.getAgent(agentId)
      if (!agent) return false

      agent.status = status
      agent.lastActiveAt = new Date().toISOString()
      
      if (status === 'active') {
        // Reset session budget
        agent.protocols.agenticWallet.transactionCount = 0
      }
      
      this.saveAgent(agent)
      return true
    } catch (error) {
      console.error('Failed to update agent status:', error)
      return false
    }
  }

  /**
   * Get database statistics


  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.AGENTS_KEY)
      localStorage.removeItem(this.TRANSACTIONS_KEY)
      localStorage.removeItem(this.INSURANCE_KEY)
      console.log('All data cleared')
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }
}

export const database = new DatabaseService()
export default DatabaseService
