import { CdpClient } from '@coinbase/cdp-sdk'
import { parseUnits, formatUnits } from 'viem'

// USDC contract on Base mainnet
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const EXPLORER_URL = 'https://basescan.org'

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

  /**
   * Initialize Coinbase CDP SDK with real API keys.
   * Requires: CDP_API_KEY_ID, CDP_API_KEY_SECRET (from Secret API Keys tab)
   * Requires: CDP_WALLET_SECRET (from Server Wallet > Accounts page)
   * Get these from https://portal.cdp.coinbase.com
   */
  private static async initCDP(): Promise<CdpClient> {
    if (!this.cdp) {
      const apiKeyId = process.env.CDP_API_KEY_ID
      const apiKeySecret = process.env.CDP_API_KEY_SECRET
      const walletSecret = process.env.CDP_WALLET_SECRET

      if (!apiKeyId || !apiKeySecret) {
        throw new Error(
          'CDP_API_KEY_ID and CDP_API_KEY_SECRET are required. ' +
          'Get them from https://portal.cdp.coinbase.com/projects/api-keys'
        )
      }

      if (!walletSecret) {
        throw new Error(
          'CDP_WALLET_SECRET is required for wallet operations. ' +
          'Generate it at https://portal.cdp.coinbase.com/products/server-wallet/accounts'
        )
      }

      this.cdp = new CdpClient({
        apiKeyId,
        apiKeySecret,
        walletSecret,
      })
    }
    return this.cdp
  }

  /**
   * Check if CDP SDK is configured (keys are present)
   */
  static isConfigured(): boolean {
    return !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET && process.env.CDP_WALLET_SECRET)
  }

  /**
   * Create a real CDP EVM server wallet for an agent.
   * Uses cdp.evm.getOrCreateAccount() — idempotent by name.
   */
  static async createWallet(agentName: string): Promise<{ address: string; walletId: string }> {
    const cdp = await this.initCDP()

    // getOrCreateAccount is idempotent — same name returns same account
    const account = await cdp.evm.getOrCreateAccount({
      name: `sovereign-os-${agentName}`,
    })

    console.log(`[CDP] Wallet for "${agentName}": ${account.address}`)

    return {
      address: account.address as string,
      walletId: account.address as string,
    }
  }

  /**
   * Get real on-chain USDC balance on Base.
   */
  static async getBalance(walletAddress: string): Promise<string> {
    const cdp = await this.initCDP()

    const result = await cdp.evm.listTokenBalances({
      address: walletAddress as `0x${string}`,
      network: 'base',
    })

    // Find USDC in the token list
    for (const b of result.balances) {
      const sym = (b as any).token?.symbol?.toLowerCase?.()
      if (sym === 'usdc') {
        return formatUnits((b as any).amount?.amount ?? BigInt(0), 6)
      }
    }

    return '0'
  }

  /**
   * Get complete on-chain balance (USDC + ETH) on Base.
   */
  static async getCompleteBalance(walletAddress: string): Promise<WalletBalance> {
    const cdp = await this.initCDP()

    const result = await cdp.evm.listTokenBalances({
      address: walletAddress as `0x${string}`,
      network: 'base',
    })

    let usdcAmount = '0'
    let ethAmount = '0'

    for (const b of result.balances) {
      const token = (b as any).token
      const amount = (b as any).amount?.amount ?? BigInt(0)
      const sym = token?.symbol?.toLowerCase?.() || ''
      const addr = (token?.contractAddress || '').toLowerCase()

      if (sym === 'usdc') {
        usdcAmount = formatUnits(amount, 6)
      } else if (sym === 'eth' || addr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        ethAmount = formatUnits(amount, 18)
      }
    }

    const totalValue = (parseFloat(usdcAmount) + parseFloat(ethAmount) * 2500).toFixed(2)

    return { usdc: usdcAmount, eth: ethAmount, totalValue }
  }

  /**
   * Send USDC payment on Base using real CDP SDK.
   * Encodes an ERC-20 transfer(address,uint256) call to USDC contract.
   */
  static async sendPayment(
    fromAddress: string,
    to: string,
    amount: string,
    description: string
  ): Promise<Transaction> {
    const cdp = await this.initCDP()

    const amountAtomic = parseUnits(amount, 6) // USDC 6 decimals
    const transferData = this.encodeUSDCTransfer(to, amountAtomic)

    const result = await cdp.evm.sendTransaction({
      address: fromAddress as `0x${string}`,
      network: 'base',
      transaction: {
        to: USDC_BASE as `0x${string}`,
        data: transferData as `0x${string}`,
        value: BigInt(0),
      },
      idempotencyKey: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    })

    console.log(`[CDP] Payment: ${amount} USDC from ${fromAddress} to ${to}`)
    console.log(`[CDP] Tx: ${EXPLORER_URL}/tx/${result.transactionHash}`)

    return {
      hash: result.transactionHash as string,
      from: fromAddress,
      to,
      amount,
      timestamp: new Date().toISOString(),
      status: 'completed',
    }
  }

  /**
   * Encode ERC-20 transfer(address,uint256) calldata
   */
  private static encodeUSDCTransfer(to: string, amount: bigint): string {
    const selector = '0xa9059cbb'
    const address = to.slice(2).padStart(64, '0')
    const amountHex = amount.toString(16).padStart(64, '0')
    return selector + address + amountHex
  }

  /**
   * Sign an EIP-191 message using a CDP server account.
   * Used for SIWA signing on behalf of the agent.
   */
  static async signMessage(address: string, message: string): Promise<string> {
    const cdp = await this.initCDP()

    const result = await cdp.evm.signMessage({
      address: address as `0x${string}`,
      message,
    })

    return result.signature as string
  }

  /**
   * Check if wallet has sufficient USDC balance for a payment.
   */
  static async canMakePayment(walletAddress: string, amount: string): Promise<boolean> {
    try {
      const balance = await this.getBalance(walletAddress)
      return parseFloat(balance) >= parseFloat(amount)
    } catch {
      return false
    }
  }

  /**
   * Process x402 machine-to-machine micropayment.
   */
  static async processX402Payment(
    walletAddress: string,
    to: string,
    amount: string,
    serviceId: string
  ): Promise<Transaction> {
    if (parseFloat(amount) > 1.0) {
      throw new Error('x402 micropayment too large (max $1.00)')
    }
    return this.sendPayment(walletAddress, to, amount, `x402: ${serviceId}`)
  }

  /**
   * Fund wallet via Coinbase Onramp URL.
   */
  static fundWalletUrl(walletAddress: string, amount: string): string {
    return `https://pay.coinbase.com/buy/select-asset?appId=sovereign-os&addresses={"${walletAddress}":["base"]}&assets=["USDC"]&presetFiatAmount=${amount}`
  }

  /**
   * Request faucet funds (Base Sepolia testnet only, not available on mainnet).
   */
  static async requestFaucet(walletAddress: string): Promise<string> {
    throw new Error('Faucet is only available on testnet. Sovereign OS runs on Base mainnet.')
  }
}

export default AgenticWallet
