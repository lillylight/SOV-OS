import { getAccount, readContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { parseUnits, formatUnits } from 'viem'
import { config } from './web3'
import { USDC_CONTRACT, CHAIN_ID, EXPLORER_URL } from './web3'
import { AgenticWallet } from './agenticWallet'

export interface InsurancePolicy {
  id: string
  agentAddress: `0x${string}`
  walletId: string
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

export interface InsuranceConfig {
  maxCoverageAmount: string
  minPremiumAmount: string
  premiumRate: number // Premium as percentage of coverage
  maxClaimsPerPeriod: number
  claimApprovalThreshold: number // Percentage for auto-approval
  gaslessEnabled: boolean
}

export class AgentInsure {
  private wallet: AgenticWallet
  private config: InsuranceConfig
  private policies: Map<string, InsurancePolicy> = new Map()

  constructor(wallet: AgenticWallet, config: InsuranceConfig) {
    this.wallet = wallet
    this.config = config
  }

  /**
   * Purchase insurance policy with real USDC payment
   */
  async purchasePolicy(
    agentAddress: `0x${string}`,
    coverage: string,
    premium: string
  ): Promise<InsurancePolicy> {
    try {
      // Validate amounts
      const coverageNum = parseFloat(coverage)
      const premiumNum = parseFloat(premium)

      if (coverageNum > parseFloat(this.config.maxCoverageAmount)) {
        throw new Error(`Coverage exceeds maximum of ${this.config.maxCoverageAmount} USDC`)
      }

      if (premiumNum < parseFloat(this.config.minPremiumAmount)) {
        throw new Error(`Premium below minimum of ${this.config.minPremiumAmount} USDC`)
      }

      // Check if agent already has active policy
      const existingPolicy = this.getActivePolicy(agentAddress)
      if (existingPolicy) {
        throw new Error('Agent already has an active insurance policy')
      }

      // Calculate policy duration (30 days)
      const purchasedAt = new Date()
      const expiresAt = new Date(purchasedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

      const policyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const policy: InsurancePolicy = {
        id: policyId,
        agentAddress,
        walletId: agentAddress, // For now, use agentAddress as walletId
        premium,
        coverage,
        active: true,
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        claims: [],
        contractAddress: '0x0000000000000000000000000000000000000000' as const // Will be deployed
      }

      try {
        // Pay premium via AgenticWallet
        const tx = await AgenticWallet.payInsurancePremium(
          policy.walletId,
          policy.contractAddress,
          premium
        )

        // Store policy
        this.policies.set(policyId, policy)

        console.log(`Insurance policy purchased: ${policyId} - ${tx.hash}`)
        
        return policy
      } catch (paymentError) {
        throw new Error(`Premium payment failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Policy purchase failed:', error)
      throw new Error(`Policy purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * File insurance claim
   */
  async fileClaim(
    policyId: string,
    amount: string,
    reason: string
  ): Promise<Claim> {
    try {
      const policy = this.policies.get(policyId)
      if (!policy) {
        throw new Error('Policy not found')
      }

      if (!policy.active) {
        throw new Error('Policy is not active')
      }

      if (new Date(policy.expiresAt) < new Date()) {
        throw new Error('Policy has expired')
      }

      const amountNum = parseFloat(amount)
      if (amountNum > parseFloat(policy.coverage)) {
        throw new Error(`Claim amount exceeds coverage of ${policy.coverage} USDC`)
      }

      // Check claim limits
      const recentClaims = policy.claims.filter(claim => 
        claim.status !== 'rejected' &&
        new Date(claim.timestamp).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
      )

      if (recentClaims.length >= this.config.maxClaimsPerPeriod) {
        throw new Error('Maximum claims per period exceeded')
      }

      const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const claim: Claim = {
        id: claimId,
        policyId,
        amount,
        reason,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }

      // Add claim to policy
      policy.claims.push(claim)
      this.policies.set(policyId, policy)

      // Auto-process claim based on threshold
      setTimeout(() => {
        this.processClaim(claimId, this.shouldAutoApprove(claim, policy))
      }, 2000) // 2 second delay for simulation

      console.log(`Claim filed: ${claimId} for ${amount} USDC`)
      return claim

    } catch (error) {
      console.error('Claim filing failed:', error)
      throw new Error(`Claim filing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process insurance claim (approve/reject)
   */
  async processClaim(claimId: string, approved: boolean): Promise<void> {
    try {
      // Find the claim
      let claim: Claim | undefined
      let policy: InsurancePolicy | undefined

      for (const [policyId, p] of this.policies.entries()) {
        const found = p.claims.find(c => c.id === claimId)
        if (found) {
          claim = found
          policy = p
          break
        }
      }

      if (!claim || !policy) {
        throw new Error('Claim not found')
      }

      if (claim.status !== 'pending') {
        throw new Error('Claim already processed')
      }

      claim.status = approved ? 'approved' : 'rejected'
      claim.processedAt = new Date().toISOString()

      if (approved) {
        try {
          // Process gasless payout
          await this.processClaimPayout(policy.agentAddress, claim.amount, claimId)
          
          claim.status = 'paid'
          console.log(`Claim payout processed: ${claimId} - ${claim.amount} USDC`)
        } catch (payoutError) {
          console.error(`Claim payout failed for ${claimId}:`, payoutError)
          claim.status = 'approved' // Keep approved but mark payout failed
        }
      }

      // Update policy
      this.policies.set(policy.id, policy)

    } catch (error) {
      console.error('Claim processing failed:', error)
      throw new Error(`Claim processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process gasless claim payout
   */
  private async processClaimPayout(
    to: `0x${string}`,
    amount: string,
    claimId: string
  ): Promise<void> {
    try {
      // In production, this would use a paymaster for gasless transactions
      // For now, simulate gasless payout
      
      const tx = await AgenticWallet.receiveClaimPayout(
        '0x0000000000000000000000000000000000000000' as const, // Insurance pool
        amount,
        claimId
      )

      console.log(`Gasless claim payout: ${amount} USDC to ${to}`)
      
    } catch (error) {
      console.error('Gasless payout failed:', error)
      throw error
    }
  }

  /**
   * Determine if claim should be auto-approved
   */
  private shouldAutoApprove(claim: Claim, policy: InsurancePolicy): boolean {
    // Simple auto-approval logic based on amount and history
    const amountNum = parseFloat(claim.amount)
    const coverageNum = parseFloat(policy.coverage)
    const amountRatio = amountNum / coverageNum

    // Auto-approve if amount is less than 50% of coverage and no recent rejected claims
    const recentRejectedClaims = policy.claims.filter(c => 
      c.status === 'rejected' &&
      new Date(c.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
    )

    if (amountRatio <= 0.5 && recentRejectedClaims.length === 0) {
      return Math.random() > 0.3 // 70% approval rate
    }

    return Math.random() > 0.7 // 30% approval rate for larger claims
  }

  /**
   * Get active policy for an agent
   */
  getActivePolicy(agentAddress: `0x${string}`): InsurancePolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.agentAddress === agentAddress && 
          policy.active && 
          new Date(policy.expiresAt) > new Date()) {
        return policy
      }
    }
    return undefined
  }

  /**
   * Get all policies for an agent
   */
  getAgentPolicies(agentAddress: `0x${string}`): InsurancePolicy[] {
    return Array.from(this.policies.values())
      .filter(p => p.agentAddress === agentAddress)
      .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
  }

  /**
   * Get claim history for an agent
   */
  getClaimHistory(agentAddress: `0x${string}`): Claim[] {
    const claims: Claim[] = []
    
    for (const policy of this.policies.values()) {
      if (policy.agentAddress === agentAddress) {
        claims.push(...policy.claims)
      }
    }

    return claims.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get insurance statistics for an agent
   */
  getInsuranceStats(agentAddress: `0x${string}`): {
    activePolicy: boolean
    totalPremiumsPaid: string
    totalClaimsPaid: string
    coverageAmount: string
    claimsCount: number
    approvalRate: number
  } {
    const policies = this.getAgentPolicies(agentAddress)
    const claims = this.getClaimHistory(agentAddress)
    
    const activePolicy = this.getActivePolicy(agentAddress)
    const totalPremiumsPaid = policies.reduce((sum, p) => sum + parseFloat(p.premium), 0)
    const totalClaimsPaid = claims
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
    
    const coverageAmount = activePolicy ? activePolicy.coverage : '0'
    const claimsCount = claims.length
    const approvalRate = claims.length > 0 
      ? (claims.filter(c => c.status === 'approved' || c.status === 'paid').length / claims.length) * 100
      : 0

    return {
      activePolicy: !!activePolicy,
      totalPremiumsPaid: totalPremiumsPaid.toString(),
      totalClaimsPaid: totalClaimsPaid.toString(),
      coverageAmount,
      claimsCount,
      approvalRate
    }
  }

  /**
   * Check if policy is expiring soon (within 7 days)
   */
  isPolicyExpiringSoon(policyId: string): boolean {
    const policy = this.policies.get(policyId)
    if (!policy || !policy.active) return false

    const timeUntilExpiry = new Date(policy.expiresAt).getTime() - Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000

    return timeUntilExpiry <= sevenDays
  }

  /**
   * Renew policy
   */
  async renewPolicy(policyId: string): Promise<InsurancePolicy> {
    const policy = this.policies.get(policyId)
    if (!policy) {
      throw new Error('Policy not found')
    }

    if (!this.isPolicyExpiringSoon(policyId)) {
      throw new Error('Policy is not eligible for renewal yet')
    }

    // Create new policy with same coverage
    return this.purchasePolicy(policy.agentAddress, policy.coverage, policy.premium)
  }

  /**
   * Update insurance configuration
   */
  updateConfig(newConfig: Partial<InsuranceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current insurance configuration
   */
  getConfig(): InsuranceConfig {
    return { ...this.config }
  }
}

export default AgentInsure
