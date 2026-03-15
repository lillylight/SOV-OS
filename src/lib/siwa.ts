/**
 * SIWA (Sign In With Agent) — powered by @buildersgarden/siwa SDK
 *
 * Server-side: verifySIWA, createSIWANonce, parseSIWAMessage, createReceipt
 * Agent-side: signSIWAMessage (used with a Signer)
 *
 * All functions use the real ERC-8004 on-chain identity registry.
 */

import {
  verifySIWA as sdkVerifySIWA,
  createSIWANonce as sdkCreateSIWANonce,
  parseSIWAMessage as sdkParseSIWAMessage,
  buildSIWAMessage as sdkBuildSIWAMessage,
  generateNonce as sdkGenerateNonce,
  type SIWAMessageFields,
  type SIWAVerificationResult,
  type SIWANonceResult,
  type SIWAVerifyCriteria,
  type NonceValidator,
} from '@buildersgarden/siwa'

import {
  createReceipt as sdkCreateReceipt,
  verifyReceipt as sdkVerifyReceipt,
  type ReceiptPayload,
} from '@buildersgarden/siwa/receipt'

import { createPublicClient, http, type PublicClient } from 'viem'
import { base } from 'viem/chains'

// ─── Constants ───────────────────────────────────────────────────────────────

const RECEIPT_SECRET = process.env.SIWA_RECEIPT_SECRET || process.env.RECEIPT_SECRET || 'sovereign-os-siwa-receipt-secret-change-me'
const SIWA_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'sovereign-os-snowy.vercel.app'
const SIWA_URI = process.env.NEXT_PUBLIC_APP_URL || 'https://sovereign-os-snowy.vercel.app'

// ERC-8004 Identity Registry addresses
export const IDENTITY_REGISTRY = {
  base: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  baseSepolia: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
} as const

// ─── Public Clients ──────────────────────────────────────────────────────────

export const baseClient: PublicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
})

export function getClientForChain(chainId: number): PublicClient {
  // Everything runs on Base mainnet by default
  return baseClient
}

// ─── In-memory nonce store (production: use Redis or DB) ─────────────────────

const nonceStore = new Map<string, { createdAt: number; expiresAt: number }>()

function issueNonce(): string {
  const nonce = sdkGenerateNonce(16)
  const now = Date.now()
  nonceStore.set(nonce, { createdAt: now, expiresAt: now + 5 * 60 * 1000 }) // 5 min TTL
  return nonce
}

function consumeNonce(nonce: string): boolean {
  const entry = nonceStore.get(nonce)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    nonceStore.delete(nonce)
    return false
  }
  nonceStore.delete(nonce) // consume — one-time use
  return true
}

// ─── Nonce Endpoint Logic ────────────────────────────────────────────────────

export interface NonceResponse {
  nonce: string
  issuedAt: string
  expirationTime: string
  domain: string
  uri: string
}

export function createNonce(): NonceResponse {
  const nonce = issueNonce()
  const issuedAt = new Date().toISOString()
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  return { nonce, issuedAt, expirationTime, domain: SIWA_DOMAIN, uri: SIWA_URI }
}

// ─── Verify Endpoint Logic ───────────────────────────────────────────────────

export interface VerifyRequest {
  message: string
  signature: string
}

export interface VerifyResponse {
  valid: boolean
  address?: string
  agentId?: number
  agentRegistry?: string
  chainId?: number
  verified?: 'offline' | 'onchain'
  receipt?: string
  expiresAt?: string
  error?: string
  code?: string
}

export async function verifyAgent(req: VerifyRequest): Promise<VerifyResponse> {
  try {
    const { message, signature } = req

    // Parse to extract chainId for correct client
    const fields = sdkParseSIWAMessage(message)
    const client = getClientForChain(fields.chainId)

    // Verify with the real SDK — checks signature, domain, nonce, time, on-chain ownership
    const result: SIWAVerificationResult = await sdkVerifySIWA(
      message,
      signature,
      SIWA_DOMAIN,
      (nonce: string) => consumeNonce(nonce),
      client,
    )

    if (!result.valid) {
      return {
        valid: false,
        error: result.error || 'Verification failed',
        code: result.code,
      }
    }

    // Issue an HMAC-signed receipt for subsequent authenticated requests
    const { receipt, expiresAt } = sdkCreateReceipt(
      {
        address: result.address,
        agentId: result.agentId,
        agentRegistry: result.agentRegistry,
        chainId: result.chainId,
        verified: result.verified,
        signerType: result.signerType,
      },
      { secret: RECEIPT_SECRET }
    )

    return {
      valid: true,
      address: result.address,
      agentId: result.agentId,
      agentRegistry: result.agentRegistry,
      chainId: result.chainId,
      verified: result.verified,
      receipt,
      expiresAt,
    }
  } catch (error) {
    console.error('[SIWA] Verification error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    }
  }
}

// ─── Receipt Verification ────────────────────────────────────────────────────

export function verifyAgentReceipt(receipt: string): ReceiptPayload | null {
  return sdkVerifyReceipt(receipt, RECEIPT_SECRET)
}

// ─── Re-exports for convenience ──────────────────────────────────────────────

export {
  sdkBuildSIWAMessage as buildSIWAMessage,
  sdkParseSIWAMessage as parseSIWAMessage,
  sdkGenerateNonce as generateNonce,
}

export type {
  SIWAMessageFields,
  SIWAVerificationResult,
  SIWANonceResult,
  ReceiptPayload,
}
