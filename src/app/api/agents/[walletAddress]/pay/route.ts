import { NextRequest, NextResponse } from "next/server";
import { AgenticWallet } from "@/lib/agenticWallet";
import { database } from "@/lib/database";
import { Transaction } from "@/lib/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  try {
    const { to, amount, description } = await request.json();

    if (!to || !amount || !description) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: to, amount, description"
      }, { status: 400 });
    }

    // Validate addresses
    if (!to.startsWith('0x') || to.length !== 42) {
      return NextResponse.json({
        success: false,
        error: "Invalid recipient address"
      }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid amount"
      }, { status: 400 });
    }

    // Get agent info
    const agent = database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Check if agent has sufficient balance
    const canPay = await AgenticWallet.canMakePayment((agent.walletId || agent.walletAddress || walletAddress) as string, amount);
    if (!canPay) {
      return NextResponse.json({
        success: false,
        error: "Insufficient balance. Fund your agent wallet first.",
        fundUrl: `https://sovereign-os-snowy.vercel.app/api/agents/${walletAddress}/fund`
      }, { status: 400 });
    }

    // Send payment
    const transaction = await AgenticWallet.sendPayment(
      (agent.walletId || agent.walletAddress || walletAddress) as string,
      to,
      amount,
      description
    );

    // Update agent last active
    agent.lastActiveAt = new Date().toISOString();
    database.saveAgent(agent);

    // Store transaction in database
    const newTransaction: Omit<Transaction, 'id'> = {
      agentId: agent.id,
      from: walletAddress,
      to,
      amount,
      description,
      txHash: transaction.hash,
      timestamp: transaction.timestamp,
      status: transaction.status
    };
    
    database.createTransaction(newTransaction);

    console.log(`Payment sent: ${amount} USDC from ${agent.name} to ${to}`);

    return NextResponse.json({
      success: true,
      transaction: {
        hash: transaction.hash,
        from: walletAddress,
        to,
        amount,
        description,
        timestamp: transaction.timestamp,
        status: transaction.status,
        explorerUrl: `https://sepolia.basescan.org/tx/${transaction.hash}`
      },
      message: "Payment sent successfully"
    });

  } catch (error) {
    console.error("Agent payment failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Payment failed"
    }, { status: 500 });
  }
}
