import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { AgenticWallet } from './agenticWallet'

export interface X402Service {
  id: string
  name: string
  description: string
  pricePerCall: string // in USDC
  providerAddress: `0x${string}`
  endpoint: string
  requiresAuth: boolean
  rateLimit: number // calls per minute
}

export interface X402Payment {
  id: string
  serviceId: string
  fromAgent: `0x${string}`
  toProvider: `0x${string}`
  amount: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
  txHash?: string
  metadata?: Record<string, any>
}

export interface X402ValidationRequest {
  serviceId: string
  agentAddress: `0x${string}`
  data: any
  signature?: string
}

export interface X402ValidationResponse {
  valid: boolean
  result?: any
  paymentRequired: boolean
  paymentAmount?: string
  paymentAddress?: `0x${string}`
  error?: string
}

export class X402PaymentProtocol {
  private services: Map<string, X402Service> = new Map()
  private payments: Map<string, X402Payment> = new Map()
  private walletId: string

  constructor(walletId: string) {
    this.walletId = walletId
    this.initializeDefaultServices()
  }

  /**
   * Initialize default x402 services
   */
  private initializeDefaultServices(): void {
    const defaultServices: X402Service[] = [
      {
        id: 'validation-service',
        name: 'Data Validation Service',
        description: 'Validate and verify agent data integrity',
        pricePerCall: '0.10', // $0.10 USDC per validation
        providerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' as const, // Example address
        endpoint: 'https://api.sovereign-os.com/validate',
        requiresAuth: true,
        rateLimit: 60
      },
      {
        id: 'compliance-check',
        name: 'KYT/OFAC Compliance Check',
        description: 'Check agent compliance with regulations',
        pricePerCall: '0.05', // $0.05 USDC per check
        providerAddress: '0x8ba1f109551bD432803012645Hac136c' as const,
        endpoint: 'https://api.sovereign-os.com/compliance',
        requiresAuth: true,
        rateLimit: 30
      },
      {
        id: 'market-data',
        name: 'Real-time Market Data',
        description: 'Provide real-time market data for trading agents',
        pricePerCall: '0.25', // $0.25 USDC per call
        providerAddress: '0x9876543210abcdef0123456789abcdef01234567' as const,
        endpoint: 'https://api.sovereign-os.com/market-data',
        requiresAuth: true,
        rateLimit: 120
      }
    ]

    defaultServices.forEach(service => {
      this.services.set(service.id, service)
    })
  }

  /**
   * Register a new x402 service
   */
  registerService(service: X402Service): void {
    this.services.set(service.id, service)
  }

  /**
   * Get service information
   */
  getService(serviceId: string): X402Service | undefined {
    return this.services.get(serviceId)
  }

  /**
   * List all available services
   */
  listServices(): X402Service[] {
    return Array.from(this.services.values())
  }

  /**
   * Process x402 payment for service usage
   */
  async processPayment(
    serviceId: string,
    agentAddress: `0x${string}`,
    metadata?: Record<string, any>
  ): Promise<X402Payment> {
    const service = this.services.get(serviceId)
    if (!service) {
      throw new Error(`Service ${serviceId} not found`)
    }

    const paymentId = `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const payment: X402Payment = {
      id: paymentId,
      serviceId,
      fromAgent: agentAddress,
      toProvider: service.providerAddress,
      amount: service.pricePerCall,
      timestamp: new Date().toISOString(),
      status: 'pending',
      metadata
    }

    try {
      // Execute USDC payment via AgenticWallet
      const tx = await AgenticWallet.processX402Payment(
        this.walletId,
        service.providerAddress,
        service.pricePerCall,
        serviceId
      )

      payment.status = 'completed'
      payment.txHash = tx.hash

      console.log(`x402 payment completed: ${paymentId} - ${tx.hash}`)
      
      // Store payment record
      this.payments.set(paymentId, payment)

      return payment
    } catch (error) {
      payment.status = 'failed'
      this.payments.set(paymentId, payment)
      
      console.error(`x402 payment failed: ${paymentId}`, error)
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate service request and process payment if required
   */
  async validateAndPay(
    request: X402ValidationRequest
  ): Promise<X402ValidationResponse> {
    const service = this.services.get(request.serviceId)
    if (!service) {
      return {
        valid: false,
        error: `Service ${request.serviceId} not found`,
        paymentRequired: false
      }
    }

    try {
      // Check rate limiting
      const recentPayments = Array.from(this.payments.values())
        .filter(p => 
          p.serviceId === request.serviceId && 
          p.fromAgent === request.agentAddress &&
          p.status === 'completed' &&
          new Date(p.timestamp).getTime() > Date.now() - 60000 // Last minute
        )

      if (recentPayments.length >= service.rateLimit) {
        return {
          valid: false,
          error: 'Rate limit exceeded',
          paymentRequired: false
        }
      }

      // Process payment
      const payment = await this.processPayment(
        request.serviceId,
        request.agentAddress,
        { data: request.data }
      )

      // Call actual service endpoint
      const response = await this.callService(service, request)

      return {
        valid: response.valid,
        result: response.result,
        paymentRequired: true,
        paymentAmount: service.pricePerCall,
        paymentAddress: service.providerAddress
      }

    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        paymentRequired: true,
        paymentAmount: service.pricePerCall
      }
    }
  }

  /**
   * Call the actual service endpoint
   */
  private async callService(
    service: X402Service,
    request: X402ValidationRequest
  ): Promise<{ valid: boolean; result?: any; error?: string }> {
    try {
      // In production, this would make actual HTTP calls to service endpoints
      // For now, simulate validation based on service type
      
      switch (service.id) {
        case 'validation-service':
          return this.validateData(request.data)
        
        case 'compliance-check':
          return this.checkCompliance(request.agentAddress, request.data)
        
        case 'market-data':
          return this.getMarketData(request.data)
        
        default:
          return { valid: false, result: null }
      }
    } catch (error) {
      console.error(`Service call failed for ${service.id}:`, error)
      return { valid: false, result: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Simulate data validation
   */
  private validateData(data: any): { valid: boolean; result?: any } {
    // Basic validation logic
    if (!data || typeof data !== 'object') {
      return { valid: false, result: { error: 'Invalid data format' } }
    }

    return {
      valid: true,
      result: {
        validated: true,
        checksum: this.calculateChecksum(data),
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Simulate compliance check
   */
  private checkCompliance(address: `0x${string}`, data: any): { valid: boolean; result?: any } {
    // Basic compliance simulation
    const blacklistedAddresses = [
      '0x0000000000000000000000000000000000000000',
      '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    ]

    if (blacklistedAddresses.includes(address.toLowerCase())) {
      return { valid: false, result: { error: 'Address blacklisted' } }
    }

    return {
      valid: true,
      result: {
        compliant: true,
        riskScore: 'low',
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * Simulate market data retrieval
   */
  private getMarketData(data: any): { valid: boolean; result?: any } {
    const symbols = ['BTC', 'ETH', 'USDC']
    const symbol = data?.symbol || 'BTC'

    if (!symbols.includes(symbol)) {
      return { valid: false, result: { error: 'Unsupported symbol' } }
    }

    // Simulate market data
    const mockPrices = {
      BTC: { price: 67500, change: 2.5 },
      ETH: { price: 3450, change: 1.8 },
      USDC: { price: 1.00, change: 0.01 }
    }

    return {
      valid: true,
      result: {
        symbol,
        price: mockPrices[symbol as keyof typeof mockPrices].price,
        change24h: mockPrices[symbol as keyof typeof mockPrices].change,
        timestamp: new Date().toISOString(),
        source: 'x402-protocol'
      }
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Get payment history for an agent
   */
  getPaymentHistory(agentAddress: `0x${string}`): X402Payment[] {
    return Array.from(this.payments.values())
      .filter(p => p.fromAgent === agentAddress)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get payment statistics
   */
  getPaymentStats(agentAddress: `0x${string}`): {
    totalPayments: number
    totalSpent: string
    servicesUsed: string[]
    successRate: number
  } {
    const payments = this.getPaymentHistory(agentAddress)
    const completed = payments.filter(p => p.status === 'completed')
    
    const totalSpent = completed.reduce((sum, p) => 
      sum + parseFloat(p.amount), 0
    ).toFixed(2)

    const servicesUsed = [...new Set(completed.map(p => p.serviceId))]
    
    const successRate = payments.length > 0 
      ? (completed.length / payments.length) * 100 
      : 0

    return {
      totalPayments: payments.length,
      totalSpent,
      servicesUsed,
      successRate
    }
  }
}

export default X402PaymentProtocol
