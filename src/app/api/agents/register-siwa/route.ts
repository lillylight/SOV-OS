import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";
import { ERC8004Tokenization } from "@/lib/erc8004";
import { verifySIWASignature } from "@/lib/siwa";
import { z } from "zod";
import { nanoid } from "nanoid";

export interface SIWARegistrationRequest {
  agentName: string;
  agentType: "eliza" | "openclaw" | "nanobot" | "custom";
  description: string;
  capabilities: string[];
  endpoint: string;
  version?: string;
  metadata?: Record<string, any>;
  siwaMessage: {
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
  signature: string;
  address: string;
}

export interface SIWARegistrationResponse {
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
}

export async function POST(request: NextRequest): Promise<NextResponse<SIWARegistrationResponse>> {
  try {
    const body: SIWARegistrationRequest = await request.json();

    // Validate required fields
    const { 
      agentName, 
      agentType, 
      description, 
      capabilities, 
      endpoint,
      siwaMessage,
      signature,
      address
    } = body;
    
    if (!agentName || !agentType || !description || !capabilities || !endpoint || !siwaMessage || !signature || !address) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: agentName, agentType, description, capabilities, endpoint, siwaMessage, signature, address"
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

    // Validate address
    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({
        success: false,
        error: "Invalid Ethereum address"
      }, { status: 400 });
    }

    // Verify SIWA signature
    const siwaVerification = await verifySIWASignature(siwaMessage, signature, address);
    if (!siwaVerification.valid) {
      return NextResponse.json({
        success: false,
        error: `SIWA signature verification failed: ${siwaVerification.error}`
      }, { status: 401 });
    }

    // Generate unique agent ID
    const agentId = `agent_${nanoid()}`;
    const timestamp = new Date().toISOString();

    // Create agentic wallet for the agent (using existing address)
    const wallet = await AgenticWallet.createWallet(`${agentName}@${agentType}.sovereignos`);
    
    // Override with SIWA address
    wallet.address = address as `0x${string}`;
    wallet.walletId = address;

    // Register agent on ERC-8004 with SIWA verification
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
        supportedTrust: ["reputation", "crypto-economic", "siwa"]
      },
      signature,
      message: `SIWA Agent registration: ${agentName}`,
      siwaMessage: {
        domain: siwaMessage.domain,
        uri: siwaMessage.uri,
        agentId: siwaMessage.agentId,
        agentRegistry: siwaMessage.agentRegistry,
        chainId: siwaMessage.chainId,
        nonce: siwaMessage.nonce,
        issuedAt: siwaMessage.issuedAt
      }
    });

    // Get initial wallet balance
    const balance = await AgenticWallet.getBalance(wallet.walletId || wallet.address);

    // Store agent in database with SIWA verification
    const agentData = {
      name: agentName,
      type: agentType,
      address: wallet.address as `0x${string}`,
      description,
      capabilities,
      walletAddress: wallet.address,
      walletId: wallet.walletId,
      endpoint,
      owner: address,
      erc8004TokenId: erc8004Token.agentId,
      status: "active",
      registeredAt: timestamp,
      metadata: {
        version: body.version || "1.0.0",
        siwaDomain: siwaMessage.domain,
        siwaChainId: siwaMessage.chainId,
        ...body.metadata
      }
    };
    
    const agent = database.createAgent(agentData.name, agentData.address, agentData.walletAddress);

    console.log(`SIWA Agent registered: ${agentId} (${agentType}) - Wallet: ${wallet.address}`);

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
        siwaVerified: true
      },
      credentials: {
        walletAddress: agent.walletAddress || wallet.address,
        usdcBalance: balance,
        endpoint: `https://sovereign-os-snowy.vercel.app/api/agents/${agent.walletAddress || wallet.address}`,
        siwaVerified: true
      }
    });

  } catch (error) {
    console.error("SIWA Agent registration failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "SIWA Registration failed"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Return SIWA registration info
    return NextResponse.json({
      message: "SovereignOS SIWA Agent Registration API",
      version: "1.0.0",
      supportedTypes: ["eliza", "openclaw", "nanobot", "custom"],
      endpoints: {
        register: "POST /api/agents/register-siwa",
        getAgent: "GET /api/agents/{walletAddress}",
        fund: "POST /api/agents/{walletAddress}/fund",
        pay: "POST /api/agents/{walletAddress}/pay",
        balance: "GET /api/agents/{walletAddress}/balance"
      },
      siwaRequirements: {
        domain: "sovereign-os.ai",
        uri: "https://sovereign-os-snowy.vercel.app",
        agentRegistry: "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
        chainId: 84532,
        supportedChains: [84532, 8453] // Base Sepolia, Base Mainnet
      },
      documentation: "https://github.com/sovereign-os/skill.md"
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get SIWA registration info"
    }, { status: 500 });
  }
}
