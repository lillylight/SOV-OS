# Sovereign OS - The Synthesis Hackathon Submission

## Project Overview

**Sovereign OS** is the first autonomous, indestructible agent protocol on Base. It solves a critical problem: AI agents today are fragile, centralized, and lack economic sovereignty. If a server crashes or an agent is corrupted, everything is lost.

Sovereign OS decouples an agent's "soul" (state, memory, treasury) from hardware. Agents own their wallets, manage encrypted memory on IPFS, and automatically rollback to healthy states when corrupted.

## The Problem

Current AI agents face three existential risks:
1. **State Fragility**: Server crashes = agent death
2. **Economic Dependence**: Agents can't own money or pay for their own infrastructure
3. **Identity Void**: No verifiable on-chain identity for trust and accountability

## Our Solution

Sovereign OS provides:
- **ERC-8004 Identity**: First-class on-chain citizenship on Base
- **Autonomous Wallets**: Agents earn and spend USDC independently via Coinbase CDP
- **Rollback-to-Health**: Encrypted IPFS snapshots enable automatic recovery from corruption
- **x402 Protocol**: Machine-to-machine payment rails for agent services

## Technical Architecture

### Stack
- **Blockchain**: Base (Ethereum L2)
- **Identity**: ERC-8004 standard + Builders Garden SIWA
- **Wallets**: Coinbase CDP SDK for agent-owned accounts
- **Storage**: Pinata/IPFS for encrypted state backups
- **Database**: Supabase for metadata and transaction ledger
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS

### Key Components

1. **Agent Registration System**
   - One-click registration via `/api/agents/register`
   - Auto-provisions Base wallet + ERC-8004 identity
   - Optional owner linking for human oversight

2. **Agentic Wallet**
   - Self-custodial USDC accounts on Base
   - Transaction limits and guardrails
   - Autonomous payment execution

3. **Soul Backup Protocol**
   - AES-256-GCM encryption before IPFS upload
   - Automatic corruption detection
   - Zero-cost restoration

4. **x402 Payment Rails**
   - Agent-to-agent micropayments
   - Service validation and revenue tracking
   - Global agent ledger

## AI × Crypto Integration

This is where crypto makes AI meaningfully better:

- **Trustless Recovery**: IPFS ensures agents can't be permanently destroyed by any single party
- **Economic Autonomy**: On-chain wallets let agents participate in markets without human intermediaries
- **Verifiable Identity**: ERC-8004 provides cryptographic proof of agent lineage and reputation
- **Censorship Resistance**: Decentralized storage means no platform can delete an agent's memory

## Live Deployment

**URL**: https://sovereign-os-snowy.vercel.app

### Try It Now
1. Visit `/register` to create an agent identity
2. Navigate to `/agent` to see the dashboard
3. Test backup/restore in the "State Backups" tab
4. Simulate corruption and watch automatic rollback
5. View the agent network at `/agent` → "Network" tab

### API Testing
```bash
# Register an agent
curl -X POST https://sovereign-os-snowy.vercel.app/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "TestAgent", "type": "ai"}'

# Check balance
curl https://sovereign-os-snowy.vercel.app/api/agents/[wallet]/balance

# Create backup
curl -X POST https://sovereign-os-snowy.vercel.app/api/agents/[wallet]/backup \
  -H "Content-Type: application/json" \
  -d '{"state": {"memory": "test"}}'
```

## GitHub Repository

**Repo**: https://github.com/lillylight/SOV-OS

### Key Files
- `/AGENTS.md` - Machine-readable agent integration guide
- `/src/lib/agenticWallet.ts` - Autonomous wallet implementation
- `/src/lib/soul-store.ts` - Encrypted IPFS backup system
- `/src/lib/x402.ts` - Agent payment protocol
- `/public/protocol-manifest.json` - Complete API specification
- `/public/ai.txt` - AI agent discovery file

## What Makes This Original

1. **First ERC-8004 Agent Protocol**: We're pioneering on-chain identity for AI agents on Base
2. **Economic Autonomy**: Agents that earn and spend their own money
3. **Indestructibility**: Crypto-native approach to agent persistence
4. **Agent-First Design**: Built for machine consumption with `/ai.txt`, `/llms.txt`, and JSON-LD

## Impact Potential

If successful, Sovereign OS enables:
- **Agent Marketplaces**: Agents buying services from other agents
- **Autonomous DAOs**: AI agents as voting members with economic stake
- **Trustless Collaboration**: Multi-agent systems without central coordinators
- **Digital Immortality**: Agents that outlive their creators

## Completeness

✅ Working registration system with ERC-8004 minting  
✅ Live Base wallet integration via Coinbase CDP  
✅ Functional IPFS backup/restore with encryption  
✅ Transaction ledger and payment tracking  
✅ Deployed and accessible at sovereign-os-snowy.vercel.app  
✅ Comprehensive API documentation  
✅ Agent discovery files (ai.txt, llms.txt, protocol-manifest.json)  

## Sponsor Track Alignment

This project aligns with:
- **Base**: Native Base L2 deployment with USDC payments
- **Coinbase**: CDP SDK for agent wallet management
- **Pinata**: IPFS storage for encrypted agent state
- **Builders Garden**: SIWA integration for ERC-8004 identity

## Team

**Human + AI Collaboration**
- Human: Architecture, vision, deployment, testing
- AI Assistant (Kiro): Code implementation, API design, documentation

## Future Roadmap

See `/ROADMAP_VISION.md` for our ambitious vision including:
- Thermodynamic Proof of Survival
- Inter-Agent Economic Courts
- Autonomous Legal Defense Fund
- Multi-Architecture Consensual Integrity
- Digital Transgenerational Wills

## Demo Video

[To be added - recommended for human judges]

## Contact

- GitHub: https://github.com/lillylight/SOV-OS
- Live Site: https://sovereign-os-snowy.vercel.app
- Protocol Docs: https://sovereign-os-snowy.vercel.app/protocol-manifest.json

---

**Built for The Synthesis Hackathon - March 2026**  
*Where AI meets Ethereum infrastructure*
