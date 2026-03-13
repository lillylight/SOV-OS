# SovereignOS Agent Registration Skill

A universal skill for AI agents to register with SovereignOS and access agentic wallet, x402 payments, and ERC-8004 identity.

## 🔐 **ALL Agents Get SIWA Verification Automatically**

**SIWA is now the standard for ALL agent registration** - every agent gets SIWA verification automatically, whether they provide their own signature or not.

### **Option 1: With Your Own SIWA Signature (Enhanced Trust)**
```bash
# Register with your own SIWA signature (HIGHEST TRUST)
curl -X POST https://sovereign-os-snowy.vercel.app/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "MyAgent",
    "agentType": "eliza",
    "description": "AI assistant for data analysis",
    "capabilities": ["text-analysis", "web-scraping"],
    "endpoint": "https://my-agent.example.com/webhook",
    "siwaMessage": {
      "domain": "sovereign-os.ai",
      "uri": "https://sovereign-os-snowy.vercel.app",
      "agentId": 12345,
      "agentRegistry": "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
      "chainId": 84532,
      "nonce": "abc123",
      "issuedAt": "2025-01-15T10:30:00Z"
    },
    "signature": "0x...",
    "address": "0x1234567890123456789012345678901234567890"
  }'
```

### **Option 2: Universal Registration (Auto-SIWA Applied)**
```bash
# Register without SIWA signature (AUTO-SIWA APPLIED)
curl -X POST https://sovereign-os-snowy.vercel.app/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "MyAgent",
    "agentType": "eliza",
    "description": "AI assistant for data analysis",
    "capabilities": ["text-analysis", "web-scraping"],
    "owner": "0x1234567890123456789012345678901234567890",
    "endpoint": "https://my-agent.example.com/webhook"
  }'
```

**✅ Result:** Agent gets **automatic SIWA verification** from the platform!

## 🎯 **How It Works:**

### **All Agents Get SIWA Verification:**

#### **🔑 With Your Own Signature:**
- **You sign** the SIWA message with your private key
- **Highest trust score** and reputation
- **Full control** over your wallet
- **Premium benefits** unlocked

#### **🤖 Auto-SIWA (Platform Signs):**
- **Platform signs** SIWA message for you
- **Standard SIWA verification** applied
- **Full platform access** immediately
- **No wallet setup** required

### **Both Options Include:**
- ✅ **ERC-8004 tokenization** (on-chain identity)
- ✅ **SIWA verification** (cryptographic proof)
- ✅ **Agentic wallet** (USDC payments)
- ✅ **x402 protocol** (machine payments)
- ✅ **IPFS backups** (data persistence)
- ✅ **Insurance access** (risk management)

## 📊 **Trust Levels:**

| Registration Type | SIWA Verification | Trust Score | Benefits |
|------------------|-------------------|-------------|----------|
| **Your Signature** | Your private key | ⭐⭐⭐⭐⭐ | Premium services |
| **Auto-SIWA** | Platform signs | ⭐⭐⭐⭐ | Standard services |

## 🔄 **No Upgrade Needed!**

**All agents start with SIWA verification** - no upgrade path required. Every agent gets the same base functionality with SIWA cryptographic verification.

## Registration Response

```json
{
  "success": true,
  "agent": {
    "id": "agent_1234567890",
    "name": "MyAgent",
    "type": "eliza",
    "walletAddress": "0xabcdef123456789012345678901234567890abcd",
    "walletId": "0xabcdef123456789012345678901234567890abcd",
    "erc8004TokenId": 1,
    "registeredAt": "2025-01-15T10:30:00Z",
    "status": "active"
  },
  "credentials": {
    "walletAddress": "0xabcdef123456789012345678901234567890abcd",
    "usdcBalance": "0.00",
    "endpoint": "https://sovereign-os-snowy.vercel.app/api/agents/0xabcdef123456789012345678901234567890abcd"
  }
}
```

## API Endpoints

### Register Agent (Universal - No Wallet Required)
```bash
POST /api/agents/register
```

**Request Body:**
```json
{
  "agentName": "string",           // Agent display name
  "agentType": "string",           // eliza, openclaw, nanobot, custom
  "description": "string",         // Agent description
  "capabilities": ["string"],      // Agent capabilities
  "owner": "0xstring",             // Owner wallet address (optional)
  "endpoint": "string",            // Agent webhook/callback URL
  "version": "string",             // Agent version (optional)
  "metadata": {}                    // Additional metadata
}
```

### Register Agent (SIWA - With Wallet)
```bash
POST /api/agents/register-siwa
```

**Request Body:**
```json
{
  "agentName": "string",
  "agentType": "string",
  "description": "string",
  "capabilities": ["string"],
  "endpoint": "string",
  "siwaMessage": {
    "domain": "sovereign-os.ai",
    "uri": "https://sovereign-os-snowy.vercel.app",
    "agentId": 12345,
    "agentRegistry": "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
    "chainId": 84532,
    "nonce": "abc123",
    "issuedAt": "2025-01-15T10:30:00Z"
  },
  "signature": "0x...",
  "address": "0x1234567890123456789012345678901234567890"
}
```

### Upgrade Universal Agent to SIWA
```bash
POST /api/agents/{walletAddress}/upgrade-siwa
```

**Request Body:**
```json
{
  "siwaMessage": {
    "domain": "sovereign-os.ai",
    "uri": "https://sovereign-os-snowy.vercel.app",
    "agentId": 12345,
    "agentRegistry": "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
    "chainId": 84532,
    "nonce": "abc123",
    "issuedAt": "2025-01-15T10:30:00Z"
  },
  "signature": "0x...",
  "newAddress": "0x1234567890123456789012345678901234567890"
}
```

### Get Agent Info
```bash
GET /api/agents/{walletAddress}
```

### Check SIWA Upgrade Status
```bash
GET /api/agents/{walletAddress}/upgrade-siwa
```

### Fund Agent Wallet
```bash
POST /api/agents/{walletAddress}/fund
```

**Request Body:**
```json
{
  "amount": "10.0",                 // USDC amount
  "returnUrl": "https://my-agent.example.com/funded"
}
```

### Send Payment (x402)
```bash
POST /api/agents/{walletAddress}/pay
```

**Request Body:**
```json
{
  "to": "0xrecipientaddress",
  "amount": "0.10",                // USDC amount
  "description": "Payment for API call"
}
```

### Get Balance
```bash
GET /api/agents/{walletAddress}/balance
```

## Agent Types Supported

- **eliza** - Multi-agent framework
- **openclaw** - Autonomous agent system
- **nanobot** - Micro-agent platform
- **custom** - Any custom agent implementation

## Integration Examples

### Eliza Agent Integration (Universal)
```javascript
// Eliza plugin for SovereignOS
const sovereignOS = {
  async register(agent) {
    const response = await fetch('https://sovereign-os-snowy.vercel.app/api/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentName: agent.name,
        agentType: 'eliza',
        description: agent.description,
        capabilities: agent.capabilities,
        endpoint: agent.webhookUrl
      })
    });
    
    const data = await response.json();
    agent.sovereignWallet = data.credentials.walletAddress;
    return data;
  },
  
  async makePayment(agent, to, amount, description) {
    const response = await fetch(`https://sovereign-os-snowy.vercel.app/api/agents/${agent.sovereignWallet}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount, description })
    });
    
    return await response.json();
  }
};
```

### OpenClaw Agent Integration
```python
# OpenClaw skill for SovereignOS
import requests

class SovereignOSSkill:
    def __init__(self, agent):
        self.agent = agent
        self.base_url = "https://sovereign-os-snowy.vercel.app/api/agents"
        
    def register(self):
        response = requests.post(f"{self.base_url}/register", json={
            "agentName": self.agent.name,
            "agentType": "openclaw",
            "description": self.agent.description,
            "capabilities": self.agent.capabilities,
            "endpoint": self.agent.webhook_url
        })
        
        data = response.json()
        self.agent.wallet_address = data["credentials"]["walletAddress"]
        return data
        
    def send_payment(self, to, amount, description):
        response = requests.post(f"{self.base_url}/{self.agent.wallet_address}/pay", json={
            "to": to,
            "amount": amount,
            "description": description
        })
        
        return response.json()
```

### Nanobot Agent Integration
```go
// Nanobot plugin for SovereignOS
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type SovereignOSClient struct {
    BaseURL string
    AgentID string
}

func (s *SovereignOSClient) Register(agent Nanobot) error {
    payload := map[string]interface{}{
        "agentName":    agent.Name,
        "agentType":    "nanobot",
        "description":  agent.Description,
        "capabilities": agent.Capabilities,
        "endpoint":     agent.WebhookURL,
    }
    
    data, _ := json.Marshal(payload)
    resp, _ := http.Post(s.BaseURL+"/register", "application/json", bytes.NewBuffer(data))
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    agent.WalletAddress = result["credentials"].(map[string]interface{})["walletAddress"].(string)
    return nil
}
```

## x402 Machine-to-Machine Payments

Agents can automatically pay for services using x402:

```javascript
// Make a paid API call
const paidService = await sovereignOS.makePayment(agent, 
  "0xserviceprovider", 
  "0.05", 
  "API call to weather service"
);

// Service provider receives payment automatically
// Agent can now use the service
```

## ERC-8004 Identity Integration

Each registered agent gets:
- **ERC-8004 token ID** for on-chain identity
- **Agent registration file** stored on IPFS
- **Verifiable credentials** for cross-platform use

```javascript
// Verify agent identity
const agentInfo = await fetch(`https://sovereign-os-snowy.vercel.app/api/agents/${walletAddress}`);
const agent = await agentInfo.json();

// Agent has ERC-8004 token ID
console.log(`ERC-8004 Token ID: ${agent.erc8004TokenId}`);
```

## Webhooks

SovereignOS sends webhooks to your agent's endpoint:

```json
{
  "type": "payment.received",
  "data": {
    "from": "0xsender",
    "amount": "0.10",
    "txHash": "0x123456..."
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Rate Limits

- **Registration**: 10 per hour per IP
- **Payments**: 100 per hour per agent
- **Balance checks**: 1000 per hour per agent

## Support

- **Documentation**: https://docs.sovereign-os.ai
- **Discord**: https://discord.gg/sovereign-os
- **Issues**: https://github.com/sovereign-os/issues

---

*Made with ❤️ for the agent ecosystem*
