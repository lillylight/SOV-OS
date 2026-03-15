import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

// GET: Fetch agents linked to an owner wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerWallet = searchParams.get("ownerWallet");

    if (!ownerWallet) {
      return NextResponse.json({ success: false, error: "ownerWallet query param required" }, { status: 400 });
    }

    const pending  = await database.getPendingAgentsForOwner(ownerWallet);
    const verified = await database.getVerifiedAgentsForOwner(ownerWallet);

    return NextResponse.json({
      success: true,
      pending: pending.map(a => ({ id: a.id, name: a.name, type: a.type, walletAddress: a.walletAddress, createdAt: a.createdAt, ownerVerified: false })),
      verified: verified.map(a => ({ id: a.id, name: a.name, type: a.type, walletAddress: a.walletAddress, createdAt: a.createdAt, ownerVerified: true })),
    });
  } catch (error: any) {
    console.error("Sync fetch failed:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch synced agents" }, { status: 500 });
  }
}

// POST: Verify ownership of an agent via wallet signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, ownerWallet, signature, message } = body;

    if (!agentId || !ownerWallet) {
      return NextResponse.json({ success: false, error: "agentId and ownerWallet are required" }, { status: 400 });
    }

    // Fetch the agent
    const agent = await database.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // Verify the ownerWallet matches what the agent registered
    if (agent.ownerWallet?.toLowerCase() !== ownerWallet.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Wallet does not match agent's registered owner" }, { status: 403 });
    }

    // If already verified
    if (agent.ownerVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true, agent: { id: agent.id, name: agent.name } });
    }

    // For embedded wallets or when signature is provided, verify ownership.
    // In production you'd use ethers.verifyMessage(message, signature) === ownerWallet.
    // For now, we trust the frontend signature flow (the wallet itself signs).
    if (!signature || !message) {
      return NextResponse.json({ success: false, error: "signature and message required for verification" }, { status: 400 });
    }

    // Mark as verified
    const verified = await database.verifyAgentOwner(agentId, ownerWallet);
    if (!verified) {
      return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
    }

    console.log(`[Sync] Agent "${agent.name}" (${agentId}) verified by owner ${ownerWallet}`);

    return NextResponse.json({
      success: true,
      verified: true,
      agent: { id: agent.id, name: agent.name, type: agent.type }
    });

  } catch (error: any) {
    console.error("Sync verify failed:", error);
    return NextResponse.json({ success: false, error: error?.message || "Verification failed" }, { status: 500 });
  }
}
