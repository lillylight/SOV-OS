import { NextRequest, NextResponse } from "next/server";
import { AgenticWallet } from "@/lib/agenticWallet";
import { database } from "@/lib/database";
import { Transaction } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  try {
    // Get agent info
    const agent = database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Get wallet balance
    const walletId = (agent.walletId || agent.walletAddress || walletAddress) as string;
    const usdcBalance = await AgenticWallet.getBalance(walletId);
    const completeBalance = await AgenticWallet.getCompleteBalance(walletId);

    // Get transaction count
    const transactions = database.getAgentTransactions(agent.id);
    
    // Calculate recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.timestamp) > oneDayAgo
    );

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        registeredAt: agent.registeredAt,
        lastActiveAt: agent.lastActiveAt
      },
      wallet: {
        address: agent.walletAddress,
        walletId: agent.walletId,
        erc8004TokenId: agent.erc8004TokenId
      },
      balances: {
        usdc: completeBalance.usdc,
        eth: completeBalance.eth,
        totalValue: completeBalance.totalValue
      },
      activity: {
        totalTransactions: transactions.length,
        recentTransactions: recentTransactions.length,
        lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1] : null
      },
      capabilities: agent.metadata.capabilities,
      endpoint: agent.endpoint
    });

  } catch (error) {
    console.error("Balance check failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Balance check failed"
    }, { status: 500 });
  }
}
