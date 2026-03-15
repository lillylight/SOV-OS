import { http, createConfig, fallback, webSocket } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Base network configuration
export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
  ],
  transports: {
    [base.id]: fallback([
      http('https://mainnet.base.org'),
      http('https://base.gateway.tenderly.co'),
      webSocket('wss://mainnet.base.org'),
    ]),
  },
})

// USDC contract on Base
export const USDC_CONTRACT = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  abi: [
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'from', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'owner', type: 'address' },
        { internalType: 'address', name: 'spender', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const,
}

// x402 Payment Protocol Contract (simplified for demo)
export const X402_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000' as const, // Will be deployed
  abi: [
    {
      inputs: [
        { internalType: 'address', name: 'agent', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'string', name: 'serviceId', type: 'string' },
      ],
      name: 'payForValidation',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'agent', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'receivePayment',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'payable',
      type: 'function',
    },
  ] as const,
}

// Insurance Contract (simplified for demo)
export const INSURANCE_CONTRACT = {
  address: '0x0000000000000000000000000000000000000000' as const, // Will be deployed
  abi: [
    {
      inputs: [
        { internalType: 'uint256', name: 'premium', type: 'uint256' },
        { internalType: 'uint256', name: 'coverage', type: 'uint256' },
      ],
      name: 'purchasePolicy',
      outputs: [{ internalType: 'uint256', name: 'policyId', type: 'uint256' }],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'policyId', type: 'uint256' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'string', name: 'reason', type: 'string' },
      ],
      name: 'fileClaim',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'policyId', type: 'uint256' },
        { internalType: 'bool', name: 'approved', type: 'bool' },
      ],
      name: 'processClaim',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const,
}

export const CHAIN_ID = base.id
export const CHAIN_NAME = 'Base'
export const EXPLORER_URL = 'https://basescan.org'
