import { verifyMessage, recoverMessageAddress } from 'viem';
import { z } from 'zod';

// SIWA Message Schema
const siwaMessageSchema = z.object({
  domain: z.string(),
  uri: z.string().url(),
  agentId: z.number(),
  agentRegistry: z.string(),
  chainId: z.number(),
  nonce: z.string(),
  issuedAt: z.string(),
  expirationTime: z.string().optional(),
  notBefore: z.string().optional()
});

export interface SIWAMessage {
  domain: string;
  uri: string;
  agentId: number;
  agentRegistry: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
}

export interface SIWAVerification {
  valid: boolean;
  error?: string;
  address?: string;
}

export async function verifySIWASignature(
  message: SIWAMessage,
  signature: string,
  expectedAddress: string
): Promise<SIWAVerification> {
  try {
    // Create the SIWA message string
    const messageString = `${message.domain} wants you to sign in with your Ethereum account:
${expectedAddress}

URI: ${message.uri}
Version: 1
Chain ID: ${message.chainId}
Nonce: ${message.nonce}
Issued At: ${message.issuedAt}${message.expirationTime ? `\nExpiration Time: ${message.expirationTime}` : ''}${message.notBefore ? `\nNot Before: ${message.notBefore}` : ''}`;

    // Recover the address from the signature
    const recoveredAddress = await recoverMessageAddress({
      message: messageString,
      signature: signature as `0x${string}`,
    });

    // Check if the recovered address matches the expected address
    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      return {
        valid: false,
        error: 'Signature verification failed: Address mismatch'
      };
    }

    // Validate the message structure
    const validationResult = siwaMessageSchema.safeParse(message);
    if (!validationResult.success) {
      return {
        valid: false,
        error: `Invalid SIWA message format: ${validationResult.error.message}`
      };
    }

    // Check if the message is expired
    if (message.expirationTime) {
      const expirationTime = new Date(message.expirationTime);
      if (expirationTime < new Date()) {
        return {
          valid: false,
          error: 'SIWA message has expired'
        };
      }
    }

    // Check if the message is not yet valid
    if (message.notBefore) {
      const notBefore = new Date(message.notBefore);
      if (notBefore > new Date()) {
        return {
          valid: false,
          error: 'SIWA message is not yet valid'
        };
      }
    }

    return {
      valid: true,
      address: recoveredAddress
    };

  } catch (error) {
    return {
      valid: false,
      error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export function createSIWAMessage(params: {
  domain: string;
  uri: string;
  agentId: number;
  agentRegistry: string;
  chainId: number;
  nonce: string;
  expirationTime?: string;
  notBefore?: string;
}): SIWAMessage {
  return {
    domain: params.domain,
    uri: params.uri,
    agentId: params.agentId,
    agentRegistry: params.agentRegistry,
    chainId: params.chainId,
    nonce: params.nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: params.expirationTime,
    notBefore: params.notBefore
  };
}

export function formatSIWAMessage(message: SIWAMessage, address: string): string {
  return `${message.domain} wants you to sign in with your Ethereum account:
${address}

URI: ${message.uri}
Version: 1
Chain ID: ${message.chainId}
Nonce: ${message.nonce}
Issued At: ${message.issuedAt}${message.expirationTime ? `\nExpiration Time: ${message.expirationTime}` : ''}${message.notBefore ? `\nNot Before: ${message.notBefore}` : ''}`;
}
