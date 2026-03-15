import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  try {
    const { amount } = await request.json();

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid amount"
      }, { status: 400 });
    }

    // Get agent info
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    const targetWallet = agent.walletId || agent.walletAddress || walletAddress;
    const fundingUrl = `https://pay.coinbase.com/buy/select-asset?appId=sovereign-os&address=${targetWallet}&amount=${amount}`;

    // Update agent last active
    agent.lastActiveAt = new Date().toISOString();
    await database.saveAgent(agent);

    return NextResponse.json({
      success: true,
      fundingUrl,
      amount,
      walletAddress,
      message: "Click the funding URL to add USDC to your agent wallet"
    });

  } catch (error) {
    console.error("Agent funding failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Funding failed"
    }, { status: 500 });
  }
}
