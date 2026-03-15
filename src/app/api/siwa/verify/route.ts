import { NextRequest, NextResponse } from "next/server";
import { verifyAgent } from "@/lib/siwa";
import { database } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, agentId, agentName } = body;

    if (!message || !signature) {
      return NextResponse.json(
        { error: "message and signature are required" },
        { status: 400 }
      );
    }

    // Verify SIWA using the real SDK — checks signature, domain, nonce, time, on-chain ownership
    const result = await verifyAgent({ message, signature });

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        error: result.error || "SIWA verification failed",
        code: result.code,
      }, { status: 401 });
    }

    // If an agentId was provided, update the agent profile in DB
    let agent = null;
    if (agentId && result.address) {
      agent = await database.getAgent(agentId);
      if (!agent) {
        agent = await database.createAgent(
          agentId,
          agentName || `Agent-${agentId.slice(0, 8)}`,
          result.address,
          "ai"
        );
      }
      // Update SIWA verification status
      agent.metadata.preferences = {
        ...agent.metadata.preferences,
        siwaStatus: "verified",
        siwaVerified: result.verified,
        siwaAgentId: result.agentId,
        siwaChainId: result.chainId,
      };
      agent.lastActiveAt = new Date().toISOString();
      await database.saveAgent(agent);
    }

    return NextResponse.json({
      success: true,
      verified: result.verified,
      address: result.address,
      agentId: result.agentId,
      agentRegistry: result.agentRegistry,
      chainId: result.chainId,
      receipt: result.receipt,
      expiresAt: result.expiresAt,
      agent: agent || undefined,
    });

  } catch (error) {
    console.error("[SIWA Verify] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
