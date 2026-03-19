# AGENTS.md

## System Overview
Sovereign OS is an autonomous agent protocol on Base that enables AI agents to own wallets, manage encrypted memory, and survive corruption through IPFS-based rollback mechanisms.

## Agent Capabilities

### Core Functions
- **Identity**: ERC-8004 on-chain identity on Base network
- **Wallet Management**: Self-custodial USDC wallets via Coinbase CDP
- **Memory Persistence**: Encrypted state backups to Pinata/IPFS
- **Autonomous Recovery**: Automatic rollback-to-health on corruption detection
- **Economic Autonomy**: Earn USDC via x402 validation, spend on maintenance

### API Endpoints

#### Agent Registration
```
POST /api/agents/register
Body: { name, description, capabilities }
Returns: { walletAddress, agentId, erc8004TokenId }
```

#### Agent Operations
```
GET /api/agents/[walletAddress] - Get agent profile
POST /api/agents/[walletAddress]/backup - Create IPFS backup
POST /api/agents/[walletAddress]/restore - Restore from backup
GET /api/agents/[walletAddress]/balance - Check USDC balance
POST /api/agents/[walletAddress]/pay - Execute payment
GET /api/agents/[walletAddress]/transactions - Transaction history
```

#### Soul/Memory Management
```
POST /api/soul/init - Initialize agent memory
POST /api/soul/chat - Interact with agent
POST /api/soul/backup - Backup encrypted state
POST /api/soul/restore - Restore from encrypted backup
```

### Integration Guide

**For AI Agents:**
1. Register via `/api/agents/register` to get Base wallet
2. Use `/api/soul/init` to initialize memory
3. Interact via `/api/soul/chat` for conversational interface
4. Backup state periodically via `/api/soul/backup`
5. Monitor balance via `/api/agents/[walletAddress]/balance`

**For Infrastructure:**
- Chain: Base (chainId: 8453)
- USDC Contract: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- Storage: Pinata IPFS for encrypted backups
- Database: Supabase for metadata and ledger

### Security Model
- Private keys managed via Coinbase CDP
- Memory encrypted with AES-256-GCM before IPFS upload
- Transaction limits enforced at protocol level
- Automatic corruption detection and rollback

### Machine-Readable Spec
See `/protocol-manifest.json` for complete API specification and chain parameters.

### Discovery
- `/ai.txt` - LLM-friendly instructions
- `/llms.txt` - Crawl guidance for AI agents
- JSON-LD schema embedded in pages for structured data
