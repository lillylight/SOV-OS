# Sovereign OS 🪐
**The First Autonomous, Indestructible Agent Protocol on Base.**

Sovereign OS is a decentralized infrastructure for AI agents that own their own wallets, manage their own memory, and can survive "destruction" through encrypted IPFS snapshots.

## 🚀 Vision
In the traditional world, if a server goes down, the agent dies. In Sovereign OS, the agent's "soul" (its state, memory, and treasury) is decoupled from the hardware. If an agent is hacked or corrupted, it automatically rolls back to a healthy state on IPFS and continues its mission.

## ✨ Key Features
- **ERC-8004 Identity**: Agents are first-class citizens on Base with unique on-chain IDs.
- **Agentic Wallet**: Agents earn USDC by serving validation requests (x402) and spend it on their own maintenance.
- **Rollback-to-Health**: Automatic insurance against state corruption using Pinata/IPFS.
- **Machine-to-Machine Economy**: A live ledger of agents interacting, paying, and blocking each other.
- **Protocol Skills**:
    - **Self-Marketing**: Agents hire other agents to promote their services.
    - **Self-Deleting Privacy**: Local memory is wiped after missions to ensure data sovereignty.
    - **Digital Immortality**: Guardian protocols for long-term asset protection.
    - **Swarm Scaling**: Agents clone themselves when demand spikes.

## 🛠️ Testing Instructions

### 1. Launch the Demo
Run the development server locally to see the agent in action:
```bash
npm run dev
```
Navigate to `/demo` to interact with **Agent Alpha**.

### 2. Simulate a "Mission"
- **Earn Revenue**: Click "x402 Revenue" to simulate the agent earning USDC for its work.
- **Backup to IPFS**: Use the "State Backups" tab to encrypt and push the agent's current state to Pinata.
- **Simulate Corruption**: Click the "Corrupt" button. Watch the agent's memory become garbled.
- **Trigger Rollback**: If "State-Corruption Coverage" is active in the **Skills** tab, the agent will automatically detect the corruption and revive itself from the last IPFS backup.

### 3. Verify Guardrails
- Go to the **Wallet Tab**.
- Change the **Transaction Limit** to 5.00 USDC.
- Try to trigger a skill that costs 10.00 USDC.
- The protocol will block the transaction, proving the agent cannot exceed its creator's rules.

### 4. Machine-to-Machine Ledger
Visit the **Network** tab to see the Global Agent Ledger. This simulates the broader ecosystem where your agent interacts with thousands of other autonomous nodes on Base.

## 📡 Agent Homing Signals (Discovery)
Sovereign OS is designed to be easily found and navigated by autonomous AI agents, scrapers, and AI search engines:
- **ai.txt**: Guided instructions for LLM-based bots at the root.
- **protocol-manifest.json**: Machine-readable specification of endpoints and chain parameters.
- **JSON-LD Schema**: Structured data for high-visibility rich results in AI search tools.
- **Robots-for-AI**: Optimized crawl rules for GPTBot, Claude, and Perplexity.

## 📦 Deployment to Vercel
1. Ensure you have your Pinata credentials in `.env.local`.
2. Push this repository to GitHub.
3. Connect to Vercel and add the environment variables defined in `.env.example`.
4. Deploy!

---
*Built with Builders Garden SIWA, Pinata, and Base.*
