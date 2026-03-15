import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { verifyAgent } from "@/lib/siwa";
import { nanoid } from "nanoid";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sovereign-os-snowy.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, agentName, agentType, description, capabilities } = body;

    if (!message || !signature) {
      return NextResponse.json({
        success: false,
        error: "message and signature are required (SIWA signed message + EIP-191 signature)"
      }, { status: 400 });
    }

    // Verify SIWA using the real @buildersgarden/siwa SDK
    const result = await verifyAgent({ message, signature });

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        error: result.error || "SIWA verification failed",
        code: result.code,
      }, { status: 401 });
    }

    // Agent is verified on-chain — create or fetch profile
    const agentId = `agent_siwa_${nanoid(12)}`;
    const finalName = agentName || `SIWA-Agent-${result.agentId}`;
    const finalType = agentType || "ai";

    let agent = result.address ? await database.getAgentByWallet(result.address) : null;

    if (!agent) {
      agent = await database.createAgent(
        agentId,
        finalName,
        result.address!,
        finalType as any,
      );
    }

    // Update with SIWA verification details
    agent.erc8004TokenId = result.agentId;
    agent.metadata.description = description || agent.metadata.description;
    agent.metadata.capabilities = capabilities || agent.metadata.capabilities;
    agent.metadata.preferences = {
      ...agent.metadata.preferences,
      siwaStatus: "verified",
      siwaVerified: result.verified,
      siwaAgentId: result.agentId,
      siwaChainId: result.chainId,
      agentRegistry: result.agentRegistry,
      registrationMethod: "siwa",
    };
    agent.lastActiveAt = new Date().toISOString();
    await database.saveAgent(agent);

    console.log(`[SIWA Register] "${finalName}" verified=${result.verified} agentId=${result.agentId} address=${result.address}`);

    return NextResponse.json({
      success: true,
      verified: result.verified,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        walletAddress: agent.walletAddress,
        erc8004TokenId: agent.erc8004TokenId,
        status: agent.status,
        siwaVerified: true,
      },
      receipt: result.receipt,
      expiresAt: result.expiresAt,
      toolkit: {
        profile: `${BASE_URL}/api/agents/${agent.id}`,
        balance: `${BASE_URL}/api/agents/${agent.walletAddress}/balance`,
        fund: `${BASE_URL}/api/agents/${agent.walletAddress}/fund`,
        pay: `${BASE_URL}/api/agents/${agent.walletAddress}/pay`,
        backup: `${BASE_URL}/api/agents/${agent.walletAddress}/backup`,
      },
    });

  } catch (error) {
    console.error("[SIWA Register] Failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "SIWA registration failed"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Sovereign OS SIWA Agent Registration (ERC-8004)",
    version: "2.0.0",
    description: "Register an AI agent using SIWA (Sign In With Agent). Requires an on-chain ERC-8004 identity.",
    flow: [
      "1. Register on ERC-8004 Identity Registry (Base mainnet)",
      "2. POST /api/siwa/nonce to get a nonce",
      "3. Build a SIWA message with your agentId, agentRegistry, chainId, nonce",
      "4. Sign the message with your agent wallet (EIP-191)",
      "5. POST /api/agents/register-siwa with { message, signature }",
      "6. Server verifies signature + on-chain ownership → returns verified profile + receipt",
    ],
    endpoint: `POST ${BASE_URL}/api/agents/register-siwa`,
    body: {
      message: "Full SIWA message string (required)",
      signature: "EIP-191 signature hex (required)",
      agentName: "Optional agent name",
      agentType: "ai | eliza | openclaw | nanobot | custom (optional)",
      description: "What this agent does (optional)",
      capabilities: ["array", "of", "capabilities (optional)"],
    },
    identityRegistry: {
      network: "Base (chain ID 8453)",
      address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      agentRegistry: "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    },
    sdkDocs: "https://docs.siwa.build",
  });
}
