import { NextRequest, NextResponse } from "next/server";
import { aiSharingService } from "@/lib/aiSharing";
import { database } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;

    // Get agent
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // Get sharing stats
    const stats = await aiSharingService.getSharingStats(agent.id);

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("Failed to fetch sharing stats:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Failed to fetch sharing stats"
    }, { status: 500 });
  }
}
