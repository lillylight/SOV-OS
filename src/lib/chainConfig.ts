// Real Base L2 contract addresses and on-chain references
// Extracted from agentStore so client components can import without pulling in zustand

export const CHAIN_CONFIG = {
  chainId: 8453,
  chainName: "Base",
  rpcUrl: "https://mainnet.base.org",
  blockExplorer: "https://basescan.org",
  usdcContract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  agentRegistryContract: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  ipfsGateway: "https://gateway.pinata.cloud/ipfs",
  platformOwnerWallet: "0xd81037D3Bde4d1861748379edb4A5E68D6d874fB",
  platformBaseName: "aiancestry.base.eth",
} as const;

export const IPFS_STATE_CIDS = [
  "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
  "QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V",
  "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
] as const;
