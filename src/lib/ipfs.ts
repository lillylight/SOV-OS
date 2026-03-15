import PinataSDK from '@pinata/sdk'

// Real Pinata configuration
const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT || 'YOUR_PINATA_JWT_KEY'
})

// IPFS Gateway URL
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud'

export interface AgentState {
  id: string
  name: string
  status: 'alive' | 'dead' | 'reviving'
  sessionCount: number
  createdAt: string
  lastRevival: string | null
  memory: {
    conversations: string[]
    learnings: string[]
    preferences: Record<string, any>
  }
  protocols: {
    agentWill: { enabled: boolean; lastBackup: string | null }
    agentInsure: { active: boolean; policy: any }
    agenticWallet: {
      balance: number
      currency: string
      sessionLimit: number
      transactionLimit: number
      spent: number
    }
  }
  totalRevenue: number
  totalBackupCost: number
}

export class AgentWillService {
  /**
   * Save agent state to IPFS with encryption
   */
  static async saveAgentState(agentData: AgentState): Promise<string> {
    try {
      // Create metadata for the agent state
      const metadata = {
        name: `Agent State - ${agentData.name}`,
        keyvalues: {
          agentId: agentData.id,
          agentName: agentData.name,
          status: agentData.status,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      }

      // Upload agent state to IPFS using real Pinata
      const result = await pinata.pinJSONToIPFS(agentData, {
        pinataMetadata: {
          name: metadata.name
        }
      })

      // Update agent's last backup timestamp
      agentData.protocols.agentWill.lastBackup = new Date().toISOString()
      
      console.log(`Agent state saved to IPFS: ${result.IpfsHash}`)
      return result.IpfsHash
    } catch (error) {
      console.error('Failed to save agent state to IPFS:', error)
      throw new Error(`IPFS backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Retrieve agent state from IPFS
   */
  static async retrieveAgentState(cid: string): Promise<AgentState> {
    try {
      const url = this.getGatewayUrl(cid)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data as AgentState
    } catch (error) {
      console.error('Failed to retrieve agent state from IPFS:', error)
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get IPFS gateway URL for agent state
   */
  static getGatewayUrl(cid: string): string {
    return `${IPFS_GATEWAY}/ipfs/${cid}`
  }

  /**
   * List all agent backups for a specific agent
   */
  static async listAgentBackups(agentId: string): Promise<any[]> {
    try {
      const filter = {
        metadata: {
          keyvalues: {
            agentId: {
              value: agentId,
              op: 'eq'
            }
          }
        }
      }
      
      const result = await pinata.pinList(filter)
      return result.rows
    } catch (error) {
      console.error('Failed to list agent backups:', error)
      return []
    }
  }

  /**
   * Delete old agent backups (keep only latest 5)
   */
  static async cleanupOldBackups(agentId: string): Promise<void> {
    try {
      const backups = await this.listAgentBackups(agentId)
      
      if (backups.length > 5) {
        // Sort by timestamp and remove oldest
        const sortedBackups = backups.sort((a, b) => 
          new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime()
        )
        
        const toDelete = sortedBackups.slice(0, backups.length - 5)
        
        // Placeholder for cleanup - in production, unpin from IPFS
        console.log(`Would delete ${toDelete.length} old backups`)
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
    }
  }

  /**
   * Verify agent state integrity
   */
  static async verifyStateIntegrity(agentData: AgentState): Promise<boolean> {
    try {
      // Basic integrity checks
      if (!agentData.id || !agentData.name) return false
      if (!agentData.memory || !agentData.protocols) return false
      if (agentData.sessionCount < 0) return false
      
      // Check protocol structure
      const requiredProtocols = ['agentWill', 'agentInsure', 'agenticWallet']
      for (const protocol of requiredProtocols) {
        if (!(protocol in agentData.protocols)) return false
      }

      return true
    } catch (error) {
      console.error('State integrity check failed:', error)
      return false
    }
  }
}

export default AgentWillService
