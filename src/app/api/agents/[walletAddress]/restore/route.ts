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

    // Verify the agent exists
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Only the verified owner/creator can restore (revive) the agent
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

    // Restore from backup
    const restoredState = await agentInsurance.restoreFromBackup(backupId, creatorWallet);

    return NextResponse.json({
      success: true,
      restoredAgent: restoredState,
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
