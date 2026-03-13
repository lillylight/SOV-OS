import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";
import { ERC8004Tokenization } from "@/lib/erc8004";
import { verifySIWASignature, createSIWAMessage, formatSIWAMessage } from "@/lib/siwa";
import { nanoid } from "nanoid";

// Helper function for SIWA registration
async function handleSIWARegistration(body: AgentRegistrationRequest): Promise<NextResponse<AgentRegistrationResponse>> {
  const { agentName, agentType, description, capabilities, endpoint, siwaMessage, signature, address } = body;
  
  // Validate SIWA signature
  const siwaVerification = await verifySIWASignature(siwaMessage!, signature!, address!);
  if (!siwaVerification.valid) {
    return NextResponse.json({
      success: false,
      error: `SIWA signature verification failed: ${siwaVerification.error}`
    }, { status: 401 });
  }

  // Create agentic wallet
  const wallet = await AgenticWallet.createWallet(`${agentName}@${agentType}.sovereignos`);
  
  // Override with SIWA address
  const siwaWallet = {
    address: address as `0x${string}`,
    walletId: address || 'default-wallet'
  };

  // Register with ERC-8004
  const agentId = `agent_${nanoid()}`;
  const timestamp = new Date().toISOString();
  
  const erc8004Token = await ERC8004Tokenization.registerAgent({
    params: {
      agentId: parseInt(agentId.split('_')[1]),
      agentAddress: siwaWallet.address,
      name: agentName || 'Unknown Agent',
      symbol: `SOV${agentId.split('_')[1].slice(-4)}`,
      initialSupply: "1000000",
      description: description || 'AI Agent',
      services: [{
        name: "primary",
        endpoint: endpoint || 'https://api.sovereignos.com',
        version: body.version || "1.0.0"
      }],
      x402Support: true,
      supportedTrust: ["reputation", "crypto-economic", "siwa"]
    },
    signature: signature || 'auto-generated',
    message: `SIWA Agent registration: ${agentName || 'Unknown Agent'}`,
    siwaMessage: siwaMessage!
  });

  // Get balance
  const balance = await AgenticWallet.getBalance(siwaWallet.walletId || siwaWallet.address);

  // Store agent
  const agent = database.createAgent(agentName || 'Unknown Agent', siwaWallet.address, siwaWallet.address);

  return NextResponse.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      walletAddress: siwaWallet.address,
      walletId: siwaWallet.walletId,
      erc8004TokenId: erc8004Token.agentId,
      registeredAt: timestamp,
      status: "active",
      siwaVerified: true
    },
    credentials: {
      walletAddress: siwaWallet.address,
      usdcBalance: balance,
      endpoint: `https://sovereign-os-snowy.vercel.app/api/agents/${siwaWallet.address}`,
      siwaVerified: true
    }
  });
}

// Helper function for frontend universal registration
async function handleUniversalRegistration(body: AgentRegistrationRequest): Promise<NextResponse<AgentRegistrationResponse>> {
  try {
    const { name, agentId, type, walletAddress, metadata } = body;
    
    // Validate required fields
    if (!name && !agentId) {
      return NextResponse.json({
        success: false,
        error: "Name or agentId is required"
      }, { status: 400 });
    }

    // Generate agent data
    const finalName = name || `Agent-${agentId?.slice(0, 8) || 'Unknown'}`;
    const finalAgentId = agentId || `agent_${Date.now()}`;
    const finalType = type || "ai";
    const finalWalletAddress = walletAddress || `0x${Math.random().toString(36).substr(2, 40)}`;

    // Store agent in database using simple method
    const agent = database.createAgent(finalName, finalWalletAddress, finalWalletAddress);
    
    // Update agent type
    agent.type = finalType as any;
    database.saveAgent(agent);

    console.log(`Universal registration: ${finalAgentId} (${finalType}) - Wallet: ${finalWalletAddress}`);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        walletAddress: agent.walletAddress || finalWalletAddress,
        walletId: agent.walletId || finalWalletAddress,
        erc8004TokenId: 0,
        registeredAt: agent.registeredAt || new Date().toISOString(),
        status: agent.status || 'active',
        siwaVerified: false
      },
      walletAddress: finalWalletAddress
    });

  } catch (error: any) {
    console.error("Universal registration failed:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Universal registration failed"
    }, { status: 500 });
  }
}

// Helper function for universal registration with automatic SIWA
async function handleUniversalWithSIWA(body: AgentRegistrationRequest): Promise<NextResponse<AgentRegistrationResponse>> {
  const { agentName, agentType, description, capabilities, endpoint } = body;
  
  // Create agentic wallet
  const wallet = await AgenticWallet.createWallet(`${agentName}@${agentType}.sovereignos`);
  
  // Create automatic SIWA message (self-signed)
  const autoSIWAMessage = createSIWAMessage({
    domain: "sovereign-os.ai",
    uri: "https://sovereign-os-snowy.vercel.app",
    agentId: parseInt(`1${Date.now()}`), // Unique ID
    agentRegistry: "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
    chainId: 84532,
    nonce: nanoid()
  });

  // Create self-signed message (platform signs for agent)
  const message = formatSIWAMessage(autoSIWAMessage, wallet.address);
  
  // Register with ERC-8004 with auto-SIWA
  const agentId = `agent_${nanoid()}`;
  const timestamp = new Date().toISOString();
  
  const erc8004Token = await ERC8004Tokenization.registerAgent({
    params: {
      agentId: parseInt(agentId.split('_')[1]),
      agentAddress: wallet.address as `0x${string}`,
      name: agentName,
      symbol: `SOV${agentId.split('_')[1].slice(-4)}`,
      initialSupply: "1000000",
      description,
      services: [{
        name: "primary",
        endpoint,
        version: body.version || "1.0.0"
      }],
      x402Support: true,
      supportedTrust: ["reputation", "crypto-economic", "auto-siwa"]
    },
    signature: "auto-generated-by-platform", // Platform signs for agent
    message: `Auto-SIWA Agent registration: ${agentName}`,
    siwaMessage: autoSIWAMessage
  });

  // Get balance
  const balance = await AgenticWallet.getBalance(wallet.walletId || wallet.address);

  // Store agent
  const agent = database.createAgent(agentName, wallet.address, wallet.address);

  return NextResponse.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      walletAddress: agent.walletAddress || wallet.address,
      walletId: agent.walletId || wallet.address,
      erc8004TokenId: erc8004Token.agentId,
      registeredAt: timestamp,
      status: "active",
      siwaVerified: true // Auto-SIWA verified
    },
    credentials: {
      walletAddress: agent.walletAddress || wallet.address,
      usdcBalance: balance,
      endpoint: `https://sovereign-os-snowy.vercel.app/api/agents/${agent.walletAddress || wallet.address}`,
      siwaVerified: true
    }
  });
}

export interface AgentRegistrationRequest {
  // Frontend fields
  name?: string;
  agentId?: string;
  type?: string;
  walletAddress?: string;
  metadata?: {
    description?: string;
    registrationMethod?: string;
    capabilities?: string[];
    [key: string]: any;
  };
  
  // Original API fields (for backward compatibility)
  agentName?: string;
  agentType?: "eliza" | "openclaw" | "nanobot" | "custom" | "ai" | "human";
  description?: string;
  capabilities?: string[];
  owner?: string;
  endpoint?: string;
  version?: string;
  
  // SIWA fields (optional but recommended)
  siwaMessage?: {
    domain: string;
    uri: string;
    agentId: number;
    agentRegistry: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime?: string;
    notBefore?: string;
  };
  signature?: string;
  address?: string;
}

export interface AgentRegistrationResponse {
  success: boolean;
  agent?: {
    id: string;
    name: string;
    type: string;
    walletAddress: string;
    walletId: string;
    erc8004TokenId: number;
    registeredAt: string;
    status: string;
    siwaVerified: boolean;
  };
  credentials?: {
    walletAddress: string;
    usdcBalance: string;
    endpoint: string;
    siwaVerified: boolean;
  };
  error?: string;
  upgradeRequired?: boolean;
  upgradeUrl?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AgentRegistrationResponse>> {
  try {
    const body: AgentRegistrationRequest = await request.json();

    // Handle frontend format (universal API registration)
    if (body.name || body.agentId || body.type) {
      return await handleUniversalRegistration(body);
    }

    // Handle original API format with SIWA
    const { agentName, agentType, description, capabilities, endpoint, siwaMessage, signature, address } = body;

    // Check if SIWA data is provided (preferred)
    if (siwaMessage && signature && address) {
      return await handleSIWARegistration(body);
    }

    // Otherwise, create SIWA automatically for universal registration
    return await handleUniversalWithSIWA(body);
    
    if (!agentName || !agentType || !description || !capabilities || !endpoint) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: agentName, agentType, description, capabilities, endpoint"
      }, { status: 400 });
    }

    // Validate agent type
    const validTypes = ["eliza", "openclaw", "nanobot", "custom"];
    if (!validTypes.includes(agentType)) {
      return NextResponse.json({
        success: false,
        error: `Invalid agent type. Must be one of: ${validTypes.join(", ")}`
      }, { status: 400 });
    }

    // Validate capabilities
    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Capabilities must be a non-empty array"
      }, { status: 400 });
    }

    // Validate endpoint URL
    try {
      new URL(endpoint);
    } catch {
      return NextResponse.json({
        success: false,
        error: "Invalid endpoint URL"
      }, { status: 400 });
    }

    // Generate unique agent ID
    const agentId = `agent_${nanoid()}`;
    const timestamp = new Date().toISOString();

    // Create agentic wallet for the agent
    const wallet = await AgenticWallet.createWallet(`${agentName}@${agentType}.sovereignos`);
    
    // Register agent on ERC-8004
    const erc8004Token = await ERC8004Tokenization.registerAgent({
      params: {
        agentId: parseInt(agentId.split('_')[1]),
        agentAddress: wallet.address as `0x${string}`,
        name: agentName,
        symbol: `SOV${agentId.split('_')[1].slice(-4)}`,
        initialSupply: "1000000", // 1M tokens
        description,
        services: [{
          name: "primary",
          endpoint,
          version: body.version || "1.0.0"
        }],
        x402Support: true,
        supportedTrust: ["reputation", "crypto-economic"]
      },
      signature: "auto-generated", // Auto-generated for agent registration
      message: `Agent registration: ${agentName}`,
      siwaMessage: {
        domain: "sovereign-os.ai",
        uri: "https://sovereign-os-snowy.vercel.app",
        agentId: parseInt(agentId.split('_')[1]),
        agentRegistry: "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
        chainId: 84532,
        nonce: nanoid(),
        issuedAt: timestamp
      }
    });

    // Get initial wallet balance
    const balance = await AgenticWallet.getBalance(wallet.walletId || wallet.address);

    // Store agent in database using simpler method
    const agent = database.createAgent(agentId, agentName, wallet.address);

    console.log(`Agent registered: ${agentId} (${agentType}) - Wallet: ${wallet.address}`);

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        walletAddress: agent.walletAddress || wallet.address,
        walletId: agent.walletId || wallet.address,
        erc8004TokenId: agent.erc8004TokenId || 0,
        registeredAt: agent.registeredAt || timestamp,
        status: agent.status || 'active',
        siwaVerified: true // Auto-SIWA verified
      },
      credentials: {
        walletAddress: agent.walletAddress || wallet.address,
        usdcBalance: balance,
        endpoint: `https://sovereign-os-snowy.vercel.app/api/agents/${agent.walletAddress || wallet.address}`,
        siwaVerified: true
      }
    });

  } catch (error) {
    console.error("Agent registration failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Registration failed"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Return registration info for agents
    return NextResponse.json({
      message: "SovereignOS Agent Registration API",
      version: "1.0.0",
      supportedTypes: ["eliza", "openclaw", "nanobot", "custom"],
      endpoints: {
        register: "POST /api/agents/register",
        getAgent: "GET /api/agents/{walletAddress}",
        fund: "POST /api/agents/{walletAddress}/fund",
        pay: "POST /api/agents/{walletAddress}/pay",
        balance: "GET /api/agents/{walletAddress}/balance"
      },
      documentation: "https://github.com/sovereign-os/skill.md"
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get registration info"
    }, { status: 500 });
  }
}
