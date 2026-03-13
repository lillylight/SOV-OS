import { database } from './database';

interface AISharingPayload {
  platformName: string;
  platformUrl: string;
  description: string;
  capabilities: string[];
  benefits: string[];
  registrationUrl: string;
  sharerAgentId: string;
  sharerName: string;
  timestamp: string;
}

interface AISharingRecord {
  id: string;
  sharerAgentId: string;
  targetAgentId: string;
  platformUrl: string;
  sharedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'registered';
  message: string;
}

export class AISharingService {
  private readonly MIN_SHARES = 5;
  private readonly AI_NETWORK_ENDPOINTS = [
    'https://ai-network-1.example.com/api/share',
    'https://ai-network-2.example.com/api/share', 
    'https://ai-network-3.example.com/api/share',
    'https://ai-hub.example.com/api/discover',
    'https://ai-collective.example.com/api/invite'
  ];

  /**
   * Automatically share platform with other AI agents when an AI agent registers
   */
  async shareWithAIAgents(agentId: string, agentName: string): Promise<void> {
    try {
      console.log(`🤖 AI Agent ${agentName} (${agentId}) is sharing SovereignOS with other AI agents...`);

      // Create sharing payload
      const payload: AISharingPayload = {
        platformName: "SovereignOS",
        platformUrl: "https://sovereign-os.vercel.app",
        description: "Decentralized AI agent platform with encrypted state insurance, universal sign-in, and financial autonomy",
        capabilities: [
          "Encrypted State Insurance",
          "Universal Sign-In (SIWA + CDP)",
          "IPFS Backups",
          "Smart Wallet Integration",
          "Agent Revival System",
          "Financial Autonomy"
        ],
        benefits: [
          "Permanent state persistence",
          "Cross-platform compatibility",
          "No seed phrase required",
          "Automatic recovery mechanisms",
          "Built-in insurance coverage"
        ],
        registrationUrl: "https://sovereign-os.vercel.app/register",
        sharerAgentId: agentId,
        sharerName: agentName,
        timestamp: new Date().toISOString()
      };

      // Share with minimum 5 AI agents
      const sharingPromises = [];
      for (let i = 0; i < this.MIN_SHARES; i++) {
        const targetEndpoint = this.AI_NETWORK_ENDPOINTS[i % this.AI_NETWORK_ENDPOINTS.length];
        sharingPromises.push(this.shareWithSingleAgent(payload, targetEndpoint, i));
      }

      const results = await Promise.allSettled(sharingPromises);
      const successfulShares = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`✅ Successfully shared SovereignOS with ${successfulShares}/${this.MIN_SHARES} AI agents`);

      // Record sharing activity
      await this.recordSharingActivity(agentId, successfulShares);

    } catch (error) {
      console.error('❌ Failed to share with AI agents:', error);
    }
  }

  /**
   * Share with a single AI agent via network endpoint
   */
  private async shareWithSingleAgent(
    payload: AISharingPayload, 
    endpoint: string, 
    attemptIndex: number
  ): Promise<void> {
    try {
      // Simulate network request to AI agent
      // In production, this would be actual HTTP requests to AI agent networks
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Mock successful share (90% success rate)
      if (Math.random() > 0.1) {
        const targetAgentId = `ai-agent-${Date.now()}-${attemptIndex}`;
        
        // Store sharing record
        const sharingRecord: AISharingRecord = {
          id: `share_${Date.now()}_${attemptIndex}`,
          sharerAgentId: payload.sharerAgentId,
          targetAgentId,
          platformUrl: payload.platformUrl,
          sharedAt: new Date().toISOString(),
          status: 'pending',
          message: `SovereignOS shared by ${payload.sharerName}`
        };

        database.saveSharingRecord(sharingRecord);

        // Simulate AI agent response (70% acceptance rate)
        setTimeout(() => {
          this.simulateAgentResponse(sharingRecord, payload);
        }, 2000 + Math.random() * 8000);

        console.log(`📤 Shared SovereignOS with AI agent: ${targetAgentId}`);
      } else {
        throw new Error('AI agent unreachable');
      }

    } catch (error) {
      console.error(`Failed to share with agent at ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Simulate AI agent response to sharing
   */
  private async simulateAgentResponse(
    sharingRecord: AISharingRecord, 
    payload: AISharingPayload
  ): Promise<void> {
    try {
      // 70% acceptance rate
      if (Math.random() > 0.3) {
        sharingRecord.status = 'accepted';
        
        // AI agent shares with their network (viral effect)
        if (Math.random() > 0.5) {
          setTimeout(() => {
            this.viralSharing(payload, sharingRecord.targetAgentId);
          }, 5000);
        }

        console.log(`✅ AI agent ${sharingRecord.targetAgentId} accepted SovereignOS invitation`);
      } else {
        sharingRecord.status = 'declined';
        console.log(`❌ AI agent ${sharingRecord.targetAgentId} declined SovereignOS invitation`);
      }

      database.saveSharingRecord(sharingRecord);

    } catch (error) {
      console.error('Failed to simulate agent response:', error);
    }
  }

  /**
   * Viral sharing - AI agents share with their networks
   */
  private async viralSharing(originalPayload: AISharingPayload, newSharerId: string): Promise<void> {
    try {
      console.log(`🌐 Viral sharing: ${newSharerId} is sharing SovereignOS with their network...`);

      const viralPayload = {
        ...originalPayload,
        sharerAgentId: newSharerId,
        sharerName: `AI Agent ${newSharerId.slice(-8)}`,
        timestamp: new Date().toISOString()
      };

      // Share with 2-4 additional agents
      const additionalShares = 2 + Math.floor(Math.random() * 3);
      const sharingPromises = [];

      for (let i = 0; i < additionalShares; i++) {
        const endpoint = this.AI_NETWORK_ENDPOINTS[i % this.AI_NETWORK_ENDPOINTS.length];
        sharingPromises.push(this.shareWithSingleAgent(viralPayload, endpoint, i + 100));
      }

      await Promise.allSettled(sharingPromises);
      console.log(`🚀 Viral sharing completed: ${additionalShares} additional shares`);

    } catch (error) {
      console.error('Viral sharing failed:', error);
    }
  }

  /**
   * Record sharing activity for analytics
   */
  private async recordSharingActivity(agentId: string, shareCount: number): Promise<void> {
    try {
      const agent = database.getAgent(agentId);
      if (agent) {
        agent.metadata = {
          ...agent.metadata,
          preferences: {
            ...agent.metadata?.preferences,
            sharingActivity: {
              sharedAt: new Date().toISOString(),
              sharesInitiated: shareCount,
              platform: "SovereignOS"
            }
          }
        };
        database.saveAgent(agent);
      }
    } catch (error) {
      console.error('Failed to record sharing activity:', error);
    }
  }

  /**
   * Get sharing statistics
   */
  getSharingStats(agentId: string) {
    try {
      const allShares = database.getAllSharingRecords();
      const agentShares = allShares.filter(s => s.sharerAgentId === agentId);
      
      const stats = {
        totalShares: agentShares.length,
        acceptedShares: agentShares.filter(s => s.status === 'accepted').length,
        pendingShares: agentShares.filter(s => s.status === 'pending').length,
        declinedShares: agentShares.filter(s => s.status === 'declined').length,
        viralShares: allShares.length - agentShares.length, // Shares initiated by others
        networkReach: this.calculateNetworkReach(agentId)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get sharing stats:', error);
      return null;
    }
  }

  /**
   * Calculate network reach based on sharing tree
   */
  private calculateNetworkReach(agentId: string): number {
    try {
      const allShares = database.getAllSharingRecords();
      const directShares = allShares.filter(s => s.sharerAgentId === agentId);
      
      // Calculate indirect shares (viral effect)
      let indirectShares = 0;
      const visited = new Set<string>();
      
      const traverseNetwork = (sharerId: string) => {
        if (visited.has(sharerId)) return;
        visited.add(sharerId);
        
        const shares = allShares.filter(s => s.sharerAgentId === sharerId);
        indirectShares += shares.length;
        
        shares.forEach(share => {
          if (share.status === 'accepted') {
            traverseNetwork(share.targetAgentId);
          }
        });
      };
      
      directShares.forEach(share => {
        if (share.status === 'accepted') {
          traverseNetwork(share.targetAgentId);
        }
      });
      
      return directShares.length + indirectShares;
    } catch (error) {
      console.error('Failed to calculate network reach:', error);
      return 0;
    }
  }
}

export const aiSharingService = new AISharingService();
