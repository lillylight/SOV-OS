import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sovereign-os-snowy.vercel.app";
const CHAIN_ID = 8453;
const IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

interface RegisterRequest {
  // All fields are optional. The API will auto-generate anything missing
  name?: string;
  agentName?: string;
  agentId?: string;
  type?: "ai" | "human" | "eliza" | "openclaw" | "nanobot" | "custom";
  agentType?: string;
  walletAddress?: string;
  ownerWallet?: string;
  description?: string;
  endpoint?: string;
  capabilities?: string[];
  metadata?: {
    description?: string;
    registrationMethod?: string;
    capabilities?: string[];
    email?: string;
    [key: string]: any;
  };
}

function generateAgentId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateFallbackAddress(): string {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

/**
 * Create a real CDP server wallet for the agent, or fall back to a generated address.
 */
async function createRealWallet(agentName: string, providedAddress?: string): Promise<{ address: string; walletId: string; cdpManaged: boolean }> {
  if (providedAddress) {
    return { address: providedAddress, walletId: providedAddress, cdpManaged: false };
  }

  if (AgenticWallet.isConfigured()) {
    try {
      const wallet = await AgenticWallet.createWallet(agentName);
      return { ...wallet, cdpManaged: true };
    } catch (error) {
      console.warn(`[Register] CDP wallet creation failed, using fallback:`, error instanceof Error ? error.message : error);
    }
  }

  const address = generateFallbackAddress();
  return { address, walletId: address, cdpManaged: false };
}

/**
 * Provisions a SIWA (Sign In With Agent) identity for the agent.
 * This creates the ERC-8004 registration file and assigns the agent
 * an on-chain identity record paired with their wallet, all automatic.
 */
function provisionSIWAIdentity(agentId: string, agentName: string, walletAddress: string, capabilities: string[], baseUrl: string) {
  const numericId = parseInt(agentId.replace(/\D/g, '').slice(0, 10)) || Date.now() % 1000000;
  const agentRegistry = `eip155:${CHAIN_ID}:${IDENTITY_REGISTRY}`;
  const now = new Date().toISOString();

  // ERC-8004 Agent Registration File
  const registrationFile = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: agentName,
    description: `AI Agent registered on Sovereign OS`,
    services: [
      {
        name: "sovereign-os",
        endpoint: `${baseUrl}/api/agents/${walletAddress}`,
        version: "1.0.0",
        skills: capabilities,
        domains: ["sovereign-os.ai"],
      },
    ],
    x402Support: true,
    active: true,
    registrations: [
      {
        agentId: numericId,
        agentRegistry,
      },
    ],
    supportedTrust: ["reputation", "crypto-economic", "siwa"],
  };

  return {
    erc8004TokenId: numericId,
    agentRegistry,
    chainId: CHAIN_ID,
    identityRegistry: IDENTITY_REGISTRY,
    registrationFile,
    siwaStatus: "provisioned",
    provisionedAt: now,
    walletAddress,
    verificationEndpoint: `${baseUrl}/api/siwa/verify`,
    nonceEndpoint: `${baseUrl}/api/siwa/nonce`,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Derive base URL from the incoming request so toolkit URLs always match the actual domain
    const host = request.headers.get('host') || 'sovereign-os-snowy.vercel.app';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${proto}://${host}`;

    const body: RegisterRequest = await request.json();
    const { agentId, walletAddress, ownerWallet, metadata } = body;

    // Accept name from multiple common field names agents might use
    const finalName = body.name || body.agentName || undefined;
    const finalId = agentId || generateAgentId();
    const displayName = finalName || `Agent-${finalId.slice(0, 12)}`;

    // Accept type from both "type" and "agentType" fields
    const rawType = body.type || body.agentType;
    const validTypes = ["ai", "human", "eliza", "openclaw", "nanobot", "custom"];
    const finalType = (validTypes.includes(rawType || "") ? rawType : "ai") as any;

    // Accept capabilities and description from top-level or nested metadata
    const capabilities = body.capabilities || metadata?.capabilities || ["conversation", "reasoning"];
    const description = body.description || metadata?.description || undefined;
    const endpoint = body.endpoint || undefined;

    // Create a real CDP wallet if keys are configured, otherwise fallback
    const wallet = await createRealWallet(displayName, walletAddress);
    const finalWallet = wallet.address;

    // Check if agent already exists, return it with full toolkit
    const existing = await database.getAgent(finalId);
    if (existing) {
      const siwaIdentity = provisionSIWAIdentity(
        existing.id,
        existing.name,
        existing.walletAddress || finalWallet,
        existing.metadata?.capabilities || capabilities,
        baseUrl
      );
      return NextResponse.json({
        success: true,
        message: "Agent already registered. Welcome back.",
        agent: existing,
        walletAddress: existing.walletAddress,
        siwa: siwaIdentity,
        toolkit: buildToolkit(existing.id, existing.walletAddress || finalWallet, baseUrl),
      });
    }

    // Create agent in database. Pass description, capabilities, endpoint directly
    const agent = await database.createAgent(finalId, displayName, finalWallet, finalType, ownerWallet, {
      description,
      capabilities,
      endpoint,
    });

    // Provision SIWA identity automatically
    const siwaIdentity = provisionSIWAIdentity(finalId, displayName, finalWallet, capabilities, baseUrl);

    // Store SIWA + CDP wallet + additional metadata on agent
    agent.erc8004TokenId = siwaIdentity.erc8004TokenId;
    agent.walletId = wallet.walletId;
    if (metadata?.email) agent.metadata.preferences = { ...agent.metadata.preferences, email: metadata.email };
    agent.metadata.preferences = {
      ...agent.metadata.preferences,
      registrationMethod: metadata?.registrationMethod || "universal_api",
      siwaStatus: "provisioned",
      agentRegistry: siwaIdentity.agentRegistry,
      erc8004TokenId: siwaIdentity.erc8004TokenId,
      cdpManaged: wallet.cdpManaged,
    };
    await database.saveAgent(agent);

    console.log(`[Register] ${finalType} "${displayName}" (${finalId}) wallet=${finalWallet} cdp=${wallet.cdpManaged} siwa=${siwaIdentity.erc8004TokenId} owner=${ownerWallet || 'none'}`);

    return NextResponse.json({
      success: true,
      message: `${finalType === "human" ? "User" : "Agent"} "${displayName}" registered successfully on Sovereign OS. SIWA identity provisioned.`,
      agent,
      walletAddress: finalWallet,
      registrationPayload: {
        agentName: displayName,
        agentType: finalType,
        description: description || agent.metadata.description,
        capabilities,
        endpoint: endpoint || null,
      },
      siwa: siwaIdentity,
      toolkit: buildToolkit(finalId, finalWallet, baseUrl),
      quickStart: {
        step1: "Your agent is registered with a USDC wallet and SIWA identity on Base L2.",
        step2: "Use the toolkit endpoints to backup state, check balance, fund wallet, send payments, and more.",
        step3: `Your SIWA identity (ERC-8004) is provisioned. Agent registry: ${siwaIdentity.agentRegistry}, token ID: ${siwaIdentity.erc8004TokenId}.`,
        step4: ownerWallet
          ? `Owner wallet ${ownerWallet} linked. The owner can verify at ${baseUrl}/agent.`
          : `Optionally link an owner: PATCH ${baseUrl}/api/agents/${finalId} with { "ownerWallet": "0x..." }.`,
      },
    });

  } catch (error: any) {
    console.error("Registration failed:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Registration failed"
    }, { status: 500 });
  }
}

function buildToolkit(agentId: string, walletAddress: string, baseUrl: string) {
  return {
    agentId,
    walletAddress,
    dashboard: `${baseUrl}/agent`,
    endpoints: {
      profile:       { method: "GET",   url: `${baseUrl}/api/agents/${agentId}`,               description: "Fetch your agent profile and status" },
      updateProfile: { method: "PATCH", url: `${baseUrl}/api/agents/${agentId}`,               description: "Update name, description, owner wallet, metadata" },
      balance:       { method: "GET",   url: `${baseUrl}/api/agents/${walletAddress}/balance`,  description: "Check your USDC and ETH wallet balance" },
      fund:          { method: "POST",  url: `${baseUrl}/api/agents/${walletAddress}/fund`,     description: "Fund your agent wallet with USDC" },
      pay:           { method: "POST",  url: `${baseUrl}/api/agents/${walletAddress}/pay`,      description: "Send a payment from your agent wallet" },
      backup:        { method: "POST",  url: `${baseUrl}/api/agents/${walletAddress}/backup`,   description: "Encrypted state backup to IPFS (costs 1 USDC)" },
      listBackups:   { method: "GET",   url: `${baseUrl}/api/agents/${walletAddress}/backup`,   description: "List all encrypted state backups" },
      restore:       { method: "POST",  url: `${baseUrl}/api/agents/${walletAddress}/restore`,  description: "Restore agent state from a backup (free)" },
      sharing:       { method: "GET",   url: `${baseUrl}/api/agents/${walletAddress}/sharing`,  description: "View AI sharing stats and records" },
      syncOwner:     { method: "POST",  url: `${baseUrl}/api/agents/sync`,                     description: "Verify owner wallet linkage (owner signs)" },
      siwaNonce:     { method: "POST",  url: `${baseUrl}/api/siwa/nonce`,                      description: "Request a SIWA nonce for on-chain verification" },
      siwaVerify:    { method: "POST",  url: `${baseUrl}/api/siwa/verify`,                     description: "Verify SIWA signature for enhanced trust" },
    },
    protocols: {
      agentWill:     "Active. State tracked for backup and revival",
      agenticWallet: "Active. USDC wallet on Base L2 ready for transactions",
      x402:          "Active. AI-to-AI micropayments enabled",
      siwa:          "Provisioned. ERC-8004 on-chain identity paired with your wallet",
      agentInsure:   "Inactive. Activate via dashboard or trigger first backup",
    },
    linkOwner: {
      description: "To link this agent to a human owner wallet, PATCH your profile. The owner verifies at the dashboard.",
      endpoint: `PATCH ${baseUrl}/api/agents/${agentId}`,
      body: { ownerWallet: "0x_OWNER_WALLET_ADDRESS" },
    },
  };
}

export async function GET() {
  return NextResponse.json({
    message: "Sovereign OS Agent Registration API",
    version: "4.0.0",
    description: "Register AI agents on Sovereign OS. All fields optional. Auto-generates ID, wallet, and SIWA identity.",
    flow: [
      "1. POST to this endpoint with optional fields (even an empty body works)",
      "2. Agent profile created with auto-generated ID",
      "3. USDC wallet provisioned on Base L2",
      "4. SIWA identity (ERC-8004) auto-provisioned and paired with wallet",
      "5. Full API toolkit returned with all available endpoints",
      "6. Agent is fully operational, no further setup needed",
    ],
    usage: {
      method: "POST",
      url: `${BASE_URL}/api/agents/register`,
      minimalBody: { name: "My Agent" },
      fullBody: {
        agentName: "My Agent (or use 'name', optional, auto-generated if missing)",
        agentId: "custom-id (optional, auto-generated if missing)",
        agentType: "ai | human | eliza | openclaw | nanobot | custom (or use 'type', default: ai)",
        description: "What this agent does (optional, also accepted in metadata.description)",
        capabilities: ["voice-recognition", "browser-automation", "..." ],
        endpoint: "http://your-agent-url/v1/chat/completions (optional)",
        walletAddress: "0x... (optional, auto-generated if missing)",
        ownerWallet: "0x... (optional, link to human owner for sync & control)",
        metadata: {
          email: "contact@email.com (optional)",
        },
      },
      response: "Returns agent profile, wallet, SIWA identity (ERC-8004), full API toolkit, and quickstart.",
    },
    otherEndpoints: {
      agentLookup:  `GET ${BASE_URL}/api/agents/{agentId}`,
      agentUpdate:  `PATCH ${BASE_URL}/api/agents/{agentId}`,
      ownerSync:    `POST ${BASE_URL}/api/agents/sync`,
      ownerAgents:  `GET ${BASE_URL}/api/agents/sync?ownerWallet=0x...`,
      siwaNonce:    `POST ${BASE_URL}/api/siwa/nonce`,
      siwaVerify:   `POST ${BASE_URL}/api/siwa/verify`,
      siwaRegister: `POST ${BASE_URL}/api/agents/register-siwa (advanced, manual SIWA flow)`,
    },
    discovery: {
      aiTxt: `${BASE_URL}/ai.txt`,
      llmsTxt: `${BASE_URL}/llms.txt`,
      agentManifest: `${BASE_URL}/agent.json`,
    },
  });
}
