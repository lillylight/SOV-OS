import { CdpClient } from '@coinbase/cdp-sdk'
import { parseUnits, formatUnits } from 'viem'
import { EXPLORER_URL } from './web3'

export interface WalletBalance {
  usdc: string
  eth: string
  totalValue: string
}

export interface Transaction {
  hash: string
  from: string
  to: string
  amount: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  gasUsed?: string
  gasPrice?: string
}

export class AgenticWallet {
  private static cdp: CdpClient | null = null
  private static readonly CDP_API_KEY_ID = process.env.CDP_API_KEY_ID || ''
  private static readonly CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET || ''

  /**
   * Initialize Coinbase CDP SDK
   */
  private static async initCDP(): Promise<CdpClient> {
    if (!this.cdp) {
      if (!this.CDP_API_KEY_ID || !this.CDP_API_KEY_SECRET) {
        throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables are required')
      }
      
      this.cdp = new CdpClient({
        apiKeyId: this.CDP_API_KEY_ID,
        apiKeySecret: this.CDP_API_KEY_SECRET
      })
    }
    return this.cdp
  }

  /**
   * Create or get an agentic wallet for an agent
   */
  static async createWallet(email: string): Promise<{ address: string; walletId: string }> {
    try {
      const cdp = await this.initCDP()
      
      // Create EVM account for the agent
      const account = await cdp.evm.createAccount({
        name: email
      })
      
      console.log(`Created agentic wallet: ${account.address}`)
      
      return {
        address: account.address,
        walletId: account.address // Using address as ID for now
      }
    } catch (error) {
      console.error('Failed to create agentic wallet:', error)
      throw new Error(`Wallet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get USDC balance using real CDP SDK
   */
  static async getBalance(walletId: string): Promise<string> {
    try {
      const cdp = await this.initCDP()
      
      // Get token balances on Base
      const tokenBalances = await cdp.evm.listTokenBalances({
        address: walletId as `0x${string}`,
        network: 'base-sepolia'
      })
      
      // Find USDC balance
      const usdcBalance = tokenBalances.balances.find(
        token => token.token.symbol?.toLowerCase() === 'usdc'
      )
      
      if (!usdcBalance) {
        return '0'
      }
      
      return formatUnits(usdcBalance.amount.amount, 6) // USDC has 6 decimals
    } catch (error) {
      console.error('Failed to get USDC balance:', error)
      throw new Error(`Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send USDC payment using real CDP SDK (gasless)
   */
  static async sendPayment(
    walletId: string,
    to: string,
    amount: string,
    description: string
  ): Promise<Transaction> {
    try {
      const cdp = await this.initCDP()
      
      const amountSmallest = parseUnits(amount, 6) // USDC has 6 decimals
      
      // Send USDC using CDP SDK (gasless on Base)
      const result = await cdp.evm.sendTransaction({
        address: walletId as `0x${string}`,
        network: 'base-sepolia',
        transaction: {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC contract on Base Sepolia
          data: this.encodeUSDCTransfer(to, amountSmallest) as `0x${string}`,
          value: BigInt(0) // For ERC-20 transfers
        },
        idempotencyKey: `payment_${Date.now()}`
      })

      const transaction: Transaction = {
        hash: result.transactionHash,
        from: walletId,
        to,
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }

      console.log(`USDC payment sent: ${amount} to ${to}`)
      console.log(`Transaction: ${EXPLORER_URL}/tx/${result.transactionHash}`)

      return transaction

    } catch (error) {
      console.error('Payment failed:', error)
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Helper function to encode USDC transfer
   */
  private static encodeUSDCTransfer(to: string, amount: bigint): string {
    // USDC transfer function selector: transfer(address,uint256)
    const selector = '0xa9059cbb'
    const address = to.slice(2).padStart(64, '0')
    const amountHex = amount.toString(16).padStart(64, '0')
    return selector + address + amountHex
  }

  /**
   * Trade tokens using real CDP SDK
   */
  static async tradeTokens(
    walletId: string,
    amount: string,
    fromToken: string,
    toToken: string
  ): Promise<Transaction> {
    try {
      const cdp = await this.initCDP()
      
      // For now, trading is not implemented in the basic CDP SDK
      // This would require additional integration
      throw new Error('Token trading not yet implemented in CDP SDK')
    } catch (error) {
      console.error('Token trade failed:', error)
      throw new Error(`Trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fund wallet using Coinbase Onramp (real CDP SDK)
   */
  static async fundWallet(walletId: string, amount: string): Promise<{ fundingUrl: string }> {
    try {
      // For now, return a mock funding URL
      // In production, integrate with Coinbase Onramp API
      const fundingUrl = `https://pay.coinbase.com/buy/select-asset?appId=sovereign-os&address=${walletId}&amount=${amount}`
      
      console.log(`Funding link created: ${fundingUrl}`)
      
      return { fundingUrl }
    } catch (error) {
      console.error('Wallet funding failed:', error)
      throw new Error(`Funding failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get wallet address
   */
  static async getWalletAddress(walletId: string): Promise<string> {
    return walletId // For now, walletId is the address
  }

  /**
   * Process x402 machine-to-machine payment
   */
  static async processX402Payment(
    walletId: string,
    to: string,
    amount: string,
    serviceId: string
  ): Promise<Transaction> {
    try {
      const description = `x402 payment for service: ${serviceId}`
      
      // x402 payments are typically small ($0.10)
      if (parseFloat(amount) > 1.0) {
        throw new Error('x402 payment amount too large')
      }
      
      return await this.sendPayment(walletId, to, amount, description)
    } catch (error) {
      console.error('x402 payment failed:', error)
      throw new Error(`x402 payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Pay insurance premium
   */
  static async payInsurancePremium(
    walletId: string,
    insuranceContract: string,
    premium: string
  ): Promise<Transaction> {
    try {
      const description = `Insurance premium payment: ${premium} USDC`
      
      return await this.sendPayment(walletId, insuranceContract, premium, description)
    } catch (error) {
      console.error('Premium payment failed:', error)
      throw new Error(`Premium payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Receive insurance claim payout
   */
  static async receiveClaimPayout(
    from: string,
    amount: string,
    claimId: string
  ): Promise<Transaction> {
    try {
      const description = `Insurance claim payout: ${claimId}`
      
      // This would typically be called by the insurance contract
      // For now, we'll track it as a received transaction
      const transaction: Transaction = {
        hash: `claim_${claimId}_${Date.now()}`,
        from,
        to: 'agent_wallet',
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }

      console.log(`Claim payout received: ${amount} from ${from}`)
      return transaction
    } catch (error) {
      console.error('Claim payout failed:', error)
      throw new Error(`Claim payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Pay for IPFS storage
   */
  static async payStorageCost(
    walletId: string,
    storageProvider: string,
    cost: string,
    cid: string
  ): Promise<Transaction> {
    try {
      const description = `IPFS storage payment: ${cid}`
      
      return await this.sendPayment(walletId, storageProvider, cost, description)
    } catch (error) {
      console.error('Storage payment failed:', error)
      throw new Error(`Storage payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get complete wallet balance including ETH
   */
  static async getCompleteBalance(walletId: string): Promise<WalletBalance> {
    try {
      const cdp = await this.initCDP()
      
      // Get token balances on Base
      const tokenBalances = await cdp.evm.listTokenBalances({
        address: walletId as `0x${string}`,
        network: 'base-sepolia'
      })
      
      // Find USDC balance
      const usdcBalance = tokenBalances.balances.find(
        token => token.token.symbol?.toLowerCase() === 'usdc'
      )
      
      // Find ETH balance
      const ethBalance = tokenBalances.balances.find(
        token => token.token.contractAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      )
      
      const usdcAmount = usdcBalance ? formatUnits(usdcBalance.amount.amount, 6) : '0'
      const ethAmount = ethBalance ? formatUnits(ethBalance.amount.amount, 18) : '0'
      
      // For total value, we'll use USDC as the base (in production, get real ETH price)
      const totalValue = parseFloat(usdcAmount) + (parseFloat(ethAmount) * 2000) // Assuming ETH = $2000
      
      return {
        usdc: usdcAmount,
        eth: ethAmount,
        totalValue: totalValue.toString()
      }
    } catch (error) {
      console.error('Failed to get complete balance:', error)
      throw new Error(`Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if wallet can make a payment
   */
  static async canMakePayment(walletId: string, amount: string): Promise<boolean> {
    try {
      const balance = await this.getBalance(walletId)
      const balanceNum = parseFloat(balance)
      const amountNum = parseFloat(amount)
      
      return balanceNum >= amountNum
    } catch (error) {
      console.error('Failed to check payment capability:', error)
      return false
    }
  }
}

export default AgenticWallet
