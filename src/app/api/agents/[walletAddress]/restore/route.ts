import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { backupId, creatorWallet } = await request.json();
    
    if (!backupId || !creatorWallet) {
      return NextResponse.json({
        success: false,
        error: "Missing backupId or creatorWallet"
      }, { status: 400 });
    }

    // Verify the agent exists (try wallet address first, then ID)
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Only the verified owner/creator can restore the agent
    if (!agent.ownerWallet || agent.ownerWallet.toLowerCase() !== creatorWallet.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: "Only the registered creator/owner can restore this agent"
      }, { status: 403 });
    }

    if (!agent.ownerVerified) {
      return NextResponse.json({
        success: false,
        error: "Owner must be verified (synced) before restoring an agent"
      }, { status: 403 });
    }

    const wasAlive = agent.status === "alive" || agent.status === "active";

    // Restore from backup — works whether agent is alive or dead
    const restoredState = await agentInsurance.restoreFromBackup(backupId, creatorWallet);

    return NextResponse.json({
      success: true,
      restoredAgent: restoredState,
      previousStatus: wasAlive ? "alive" : agent.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Backup restoration failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Backup restoration failed"
    }, { status: 500 });
  }
}
