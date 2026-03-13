import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { planId, paymentSignature } = await request.json();
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        error: "Missing planId"
      }, { status: 400 });
    }

    const agent = database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Upgrade the plan
    const success = await agentInsurance.upgradePlan(agent.id, planId, paymentSignature || '');

    if (!success) {
      return NextResponse.json({
        success: false,
        error: "Plan upgrade failed"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newPlan: planId,
      upgradedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Plan upgrade failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Plan upgrade failed"
    }, { status: 500 });
  }
}
