import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";

async function safeGetBalance(walletAddress: string): Promise<{ usdc: string; eth: string; totalValue: string }> {
  const defaultBalance = { usdc: "0", eth: "0", totalValue: "0" };

  if (!AgenticWallet.isConfigured()) {
    return defaultBalance;
  }

  try {
    return await AgenticWallet.getCompleteBalance(walletAddress);
  } catch (error) {
    console.warn(`[Balance] CDP query failed for ${walletAddress}:`, error instanceof Error ? error.message : error);
    return defaultBalance;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  try {
    // Get agent info
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Get wallet balance — gracefully returns 0 if CDP is not configured
    const walletId = (agent.walletId || agent.walletAddress || walletAddress) as string;
    const balances = await safeGetBalance(walletId);

    // Get transaction count
    const transactions = await database.getAgentTransactions(agent.id);
    
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
        erc8004TokenId: agent.erc8004TokenId,
        cdpConfigured: AgenticWallet.isConfigured()
      },
      balances,
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
