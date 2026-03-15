import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { verifyAgent } from "@/lib/siwa";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sovereign-os-snowy.vercel.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;

  try {
    const body = await request.json();
    const { message, signature } = body;

    if (!message || !signature) {
      return NextResponse.json({
        success: false,
        error: "message and signature are required (SIWA signed message + EIP-191 signature)"
      }, { status: 400 });
    }

    // Get existing agent
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Verify SIWA using the real SDK
    const result = await verifyAgent({ message, signature });

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        error: result.error || "SIWA verification failed",
        code: result.code,
      }, { status: 401 });
    }

    // Upgrade agent with SIWA verification details
    agent.erc8004TokenId = result.agentId;
    agent.metadata.preferences = {
      ...agent.metadata.preferences,
      siwaStatus: "verified",
      siwaVerified: result.verified,
      siwaAgentId: result.agentId,
      siwaChainId: result.chainId,
      agentRegistry: result.agentRegistry,
      upgradedAt: new Date().toISOString(),
    };
    agent.lastActiveAt = new Date().toISOString();
    await database.saveAgent(agent);

    console.log(`[SIWA Upgrade] ${agent.id} verified=${result.verified} agentId=${result.agentId}`);

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
    });

  } catch (error) {
    console.error("[SIWA Upgrade] Failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "SIWA upgrade failed"
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;

  try {
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    const siwaVerified = agent.metadata?.preferences?.siwaStatus === "verified";

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      currentWallet: walletAddress,
      siwaVerified,
      canUpgrade: !siwaVerified,
      flow: [
        "1. POST /api/siwa/nonce to get a nonce",
        "2. Build + sign SIWA message with your agent wallet",
        "3. POST /api/agents/{walletAddress}/upgrade-siwa with { message, signature }",
      ],
      identityRegistry: {
        network: "Base (chain ID 8453)",
        address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        agentRegistry: "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      },
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to get upgrade info" }, { status: 500 });
  }
}
