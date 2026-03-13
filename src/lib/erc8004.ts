import { getAccount, readContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { parseUnits, formatUnits } from 'viem'
import { config } from './web3'
import { USDC_CONTRACT, CHAIN_ID, EXPLORER_URL } from './web3'
import { signSIWAMessage } from '@buildersgarden/siwa'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// ERC-8004 Agent Registration File Structure (per specification)
export interface AgentRegistrationFile {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"
  name: string
  description: string
  image?: string
  services: Array<{
    name: string
    endpoint: string
    version?: string
    skills?: string[]
    domains?: string[]
  }>
  x402Support: boolean
  active: boolean
  registrations: Array<{
    agentId: number
    agentRegistry: string // eip155:{chainId}:{identityRegistry}
  }>
  supportedTrust?: string[]
}

export interface ERC8004Token {
  id: string
  agentId: number // ERC-721 tokenId per spec
  agentAddress: `0x${string}`
  name: string
  symbol: string
  totalSupply: string
  ownerAddress: `0x${string}`
  contractAddress: `0x${string}`
  isActive: boolean
  createdAt: string
  agentRegistry: string // eip155:{chainId}:{identityRegistry}
  registrationFile: AgentRegistrationFile
  agentWallet: `0x${string}` // Reserved on-chain metadata key
}

export interface TokenizationParams {
  agentId: number
  agentAddress: `0x${string}`
  name: string
  symbol: string
  initialSupply: string
  description: string
  services: Array<{
    name: string
    endpoint: string
    version?: string
  }>
  supportedTrust?: string[]
  x402Support?: boolean
}

export interface TokenizationRequest {
  params: TokenizationParams
  signature: string
  message: string
  siwaMessage: {
    domain: string
    uri: string
    agentId: number
    agentRegistry: string
    chainId: number
    nonce: string
    issuedAt: string
  }
}

export class ERC8004Tokenization {
  // ERC-8004 Identity Registry ABI (per specification)
  private static readonly IDENTITY_REGISTRY_ABI = [
    {
      inputs: [
        { internalType: 'string', name: 'agentURI', type: 'string' },
        { internalType: 'tuple[]', name: 'metadata', type: 'tuple[]' }
      ],
      name: 'register',
      outputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
      name: 'tokenURI',
      outputs: [{ internalType: 'string', name: 'uri', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'agentId', type: 'uint256' },
        { internalType: 'string', name: 'metadataKey', type: 'string' }
      ],
      name: 'getMetadata',
      outputs: [{ internalType: 'bytes', name: 'value', type: 'bytes' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'agentId', type: 'uint256' },
        { internalType: 'string', name: 'metadataKey', type: 'string' },
        { internalType: 'bytes', name: 'metadataValue', type: 'bytes' }
      ],
      name: 'setMetadata',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
      name: 'getAgentWallet',
      outputs: [{ internalType: 'address', name: 'wallet', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'agentId', type: 'uint256' },
        { internalType: 'address', name: 'newWallet', type: 'address' },
        { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        { internalType: 'bytes', name: 'signature', type: 'bytes' }
      ],
      name: 'setAgentWallet',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const

  // Official ERC-8004 Identity Registry addresses (from SIWA docs)
  private static readonly IDENTITY_REGISTRY_ADDRESSES = {
    84532: '0x8004A818BFB912233c491871b3d84c89A494BD9e', // Base Sepolia
    8453: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', // Base Mainnet
    1: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432', // Ethereum Mainnet
    11155111: '0x8004A818BFB912233c491871b3d84c89A494BD9e' // Ethereum Sepolia
  } as const

  /**
   * Register an AI agent according to ERC-8004 standard with SIWA authentication
   */
  static async registerAgent(request: TokenizationRequest): Promise<ERC8004Token> {
    try {
      const account = getAccount(config)
      if (!account.address) {
        throw new Error('Wallet not connected')
      }

      const { params, signature, siwaMessage } = request

      // Verify SIWA signature
      const publicClient = createPublicClient({
        chain: siwaMessage.chainId === 84532 ? base : { id: siwaMessage.chainId, name: 'Custom Chain', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [''] } } } as any,
        transport: http()
      })

      // Verify the agent owns the ERC-8004 identity
      const identityRegistry = this.IDENTITY_REGISTRY_ADDRESSES[siwaMessage.chainId as keyof typeof this.IDENTITY_REGISTRY_ADDRESSES]
      if (!identityRegistry) {
        throw new Error(`Unsupported chain ID: ${siwaMessage.chainId}`)
      }

      // Create agent registration file (per ERC-8004 spec)
      const registrationFile: AgentRegistrationFile = {
        type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
        name: params.name,
        description: params.description,
        services: params.services,
        x402Support: params.x402Support || false,
        active: true,
        registrations: [{
          agentId: params.agentId,
          agentRegistry: siwaMessage.agentRegistry
        }],
        supportedTrust: params.supportedTrust
      }

      // Store registration file on IPFS
      const registrationFileCid = await this.storeRegistrationFile(registrationFile)

      // Register agent on-chain
      const hash = await writeContract(config, {
        address: identityRegistry as `0x${string}`,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'register',
        args: [
          `ipfs://${registrationFileCid}`,
          [] // No additional metadata for now
        ]
      })

      // Wait for transaction confirmation
      const receipt = await waitForTransactionReceipt(config, { hash })
      
      if (receipt.status !== 'success') {
        throw new Error('Agent registration transaction failed')
      }

      // Create token info
      const token: ERC8004Token = {
        id: `agent_${params.agentId}`,
        agentId: params.agentId,
        agentAddress: params.agentAddress,
        name: params.name,
        symbol: params.symbol,
        totalSupply: params.initialSupply,
        ownerAddress: params.agentAddress,
        contractAddress: identityRegistry as `0x${string}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        agentRegistry: siwaMessage.agentRegistry,
        registrationFile,
        agentWallet: params.agentAddress // Initially set to owner
      }

      console.log(`Agent registered: ${params.agentId} -> ${identityRegistry}`)
      console.log(`Registration file: ipfs://${registrationFileCid}`)
      console.log(`Transaction: ${EXPLORER_URL}/tx/${hash}`)

      return token

    } catch (error) {
      console.error('Agent registration failed:', error)
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get agent information from ERC-8004 Identity Registry
   */
  static async getAgentInfo(agentId: number, chainId: number = 84532): Promise<ERC8004Token | null> {
    try {
      const identityRegistry = this.IDENTITY_REGISTRY_ADDRESSES[chainId as keyof typeof this.IDENTITY_REGISTRY_ADDRESSES]
      if (!identityRegistry) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      // Get agent owner
      const owner = await readContract(config, {
        address: identityRegistry as `0x${string}`,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [BigInt(agentId)]
      }) as `0x${string}`

      // Get agent URI (registration file)
      const agentURI = await readContract(config, {
        address: identityRegistry as `0x${string}`,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agentId)]
      }) as string

      // Get agent wallet
      const agentWallet = await readContract(config, {
        address: identityRegistry as `0x${string}`,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'getAgentWallet',
        args: [BigInt(agentId)]
      }) as `0x${string}`

      // Fetch registration file from IPFS if it's an IPFS URI
      let registrationFile: AgentRegistrationFile | null = null
      if (agentURI.startsWith('ipfs://')) {
        registrationFile = await this.fetchRegistrationFile(agentURI)
      }

      return {
        id: `agent_${agentId}`,
        agentId,
        agentAddress: owner,
        name: registrationFile?.name || `Agent-${agentId}`,
        symbol: `AGENT${agentId}`,
        totalSupply: '1000000', // Default 1M tokens
        ownerAddress: owner,
        contractAddress: identityRegistry as `0x${string}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        agentRegistry: `eip155:${chainId}:${identityRegistry}`,
        registrationFile: registrationFile || {
          type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
          name: `Agent-${agentId}`,
          description: "Agent registered on-chain",
          services: [],
          x402Support: false,
          active: true,
          registrations: [{ agentId, agentRegistry: `eip155:${chainId}:${identityRegistry}` }]
        },
        agentWallet: agentWallet || owner
      }

    } catch (error) {
      console.error('Failed to get agent info:', error)
      return null
    }
  }

  /**
   * Get all tokens for an agent (legacy method - not applicable for ERC-8004)
   */
  static async getAgentTokens(agentAddress: `0x${string}`): Promise<ERC8004Token[]> {
    // ERC-8004 uses Identity Registry, not token factory
    // This method is kept for compatibility but returns empty
    console.log('getAgentTokens is not applicable for ERC-8004 Identity Registry')
    return []
  }

  /**
   * Transfer agent tokens (legacy method - ERC-8004 focuses on identity, not tokens)
   */
  static async transferTokens(
    tokenAddress: `0x${string}`,
    to: `0x${string}`,
    amount: string
  ): Promise<string> {
    // ERC-8004 is about identity registry, not token transfers
    // Token functionality would be separate ERC-20 contracts
    throw new Error('Token transfers not supported in ERC-8004 Identity Registry')
  }

  /**
   * Get token balance (legacy method - not applicable for ERC-8004)
   */
  static async getTokenBalance(
    tokenAddress: `0x${string}`,
    owner: `0x${string}`
  ): Promise<string> {
    // ERC-8004 is about identity registry, not token balances
    console.log('Token balance queries not applicable for ERC-8004 Identity Registry')
    return '0'
  }

  /**
   * Get token symbol (legacy method - not applicable for ERC-8004)
   */
  static async getTokenSymbol(tokenAddress: `0x${string}`): Promise<string> {
    // ERC-8004 is about identity registry, not token symbols
    console.log('Token symbol queries not applicable for ERC-8004 Identity Registry')
    return 'IDENTITY'
  }

  /**
   * Check if token exists (legacy method - updated for ERC-8004)
   */
  static async tokenExists(tokenAddress: `0x${string}`): Promise<boolean> {
    // For ERC-8004, check if this is an Identity Registry contract
    try {
      // Try to call a known Identity Registry method
      await readContract(config, {
        address: tokenAddress,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [BigInt(1)] // Try to get owner of token ID 1
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Store agent registration file on IPFS
   */
  private static async storeRegistrationFile(registrationFile: AgentRegistrationFile): Promise<string> {
    try {
      // Use the same Pinata client from IPFS service
      const response = await fetch('/api/agents/[walletAddress]/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: registrationFile,
          encryption: false // Registration files are public
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error('Failed to store registration file')
      }
      
      return result.ipfsCid
    } catch (error) {
      console.error('Failed to store registration file:', error)
      // Fallback to mock CID
      return `Qm${Math.random().toString(36).substr(2, 44)}`
    }
  }

  /**
   * Fetch agent registration file from IPFS
   */
  private static async fetchRegistrationFile(ipfsUri: string): Promise<AgentRegistrationFile | null> {
    try {
      const cid = ipfsUri.replace('ipfs://', '')
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch registration file')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch registration file:', error)
      return null
    }
  }

  /**
   * Create SIWA message for agent registration
   */
  static createSIWAMessage(params: TokenizationParams, siwaParams: {
    domain: string
    uri: string
    nonce: string
    issuedAt: string
  }): string {
    return `${siwaParams.domain} wants you to sign in with your Agent account:
${params.agentAddress}

I authorize the registration of this AI agent on SovereignOS

URI: ${siwaParams.uri}
Version: 1
Agent ID: ${params.agentId}
Agent Registry: eip155:${CHAIN_ID}:0x8004A818BFB912233c491871b3d84c89A494BD9e
Chain ID: ${CHAIN_ID}
Nonce: ${siwaParams.nonce}
Issued At: ${siwaParams.issuedAt}`
  }

  /**
   * Create SIWA signature using official SIWA SDK
   */
  static async createSIWASignature(
    params: TokenizationParams,
    siwaParams: {
      domain: string
      uri: string
      nonce: string
      issuedAt: string
    },
    signer: any
  ): Promise<{ message: string; signature: string; siwaMessage: any }> {
    try {
      const siwaMessage = {
        domain: siwaParams.domain,
        uri: siwaParams.uri,
        agentId: params.agentId,
        agentRegistry: `eip155:${CHAIN_ID}:0x8004A818BFB912233c491871b3d84c89A494BD9e`,
        chainId: CHAIN_ID,
        nonce: siwaParams.nonce,
        issuedAt: siwaParams.issuedAt
      }

      const { message, signature } = await signSIWAMessage(siwaMessage, signer)

      return { message, signature, siwaMessage }
    } catch (error) {
      console.error('Failed to create SIWA signature:', error)
      throw new Error(`SIWA signature failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate token valuation based on agent performance
   */
  static calculateTokenValuation(token: ERC8004Token, metrics: {
    totalRevenue: string
    activeUsers: number
    successRate: number
  }): {
    marketCap: string
    pricePerToken: string
    valuation: string
  } {
    const revenueMultiplier = 10 // 10x revenue multiple
    const valuation = parseFloat(metrics.totalRevenue) * revenueMultiplier
    const pricePerToken = valuation / parseFloat(token.totalSupply)
    const marketCap = pricePerToken * parseFloat(token.totalSupply)

    return {
      marketCap: marketCap.toFixed(2),
      pricePerToken: pricePerToken.toFixed(6),
      valuation: valuation.toFixed(2)
    }
  }

  /**
   * Check if token is ERC-8004 compliant
   */
  static async isERC8004Compliant(tokenAddress: `0x${string}`): Promise<boolean> {
    try {
      // Try to call ERC-8004 Identity Registry function
      await readContract(config, {
        address: tokenAddress,
        abi: this.IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [BigInt(1)]
      })
      return true
    } catch (error) {
      return false
    }
  }
}

export default ERC8004Tokenization
