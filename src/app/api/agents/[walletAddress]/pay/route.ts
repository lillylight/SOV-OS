import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { Transaction } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";
import { categoriseTransaction, type TaxTransaction } from "@/lib/taxLedger";

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
    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // CDP wallet required for real on-chain payments
    if (!AgenticWallet.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: "CDP wallet not configured. Add CDP_API_KEY_ID and CDP_API_KEY_SECRET to enable on-chain payments.",
        fundUrl: `https://sovereign-os-snowy.vercel.app/api/agents/${walletAddress}/fund`
      }, { status: 503 });
    }

    const walletId = (agent.walletId || agent.walletAddress || walletAddress) as string;

    // Check if agent has sufficient balance
    const canPay = await AgenticWallet.canMakePayment(walletId, amount);
    if (!canPay) {
      return NextResponse.json({
        success: false,
        error: "Insufficient balance. Fund your agent wallet first.",
        fundUrl: `https://sovereign-os-snowy.vercel.app/api/agents/${walletAddress}/fund`
      }, { status: 400 });
    }

    // Send payment
    const txResult = await AgenticWallet.sendPayment(walletId, to, amount, description);

    // Update agent last active
    agent.lastActiveAt = new Date().toISOString();
    await database.saveAgent(agent);

    // Store transaction in database
    const newTransaction: Omit<Transaction, 'id'> = {
      agentId: agent.id,
      from: walletAddress,
      to,
      amount,
      description,
      txHash: txResult.hash,
      timestamp: txResult.timestamp,
      status: txResult.status
    };
    
    await database.createTransaction(newTransaction);

    // ── Auto-log in tax ledger ──
    try {
      const ownerWallet = agent.ownerWallet || undefined;
      const { category, subcategory, confidence } = categoriseTransaction(
        walletAddress, to, amountNum, description, walletAddress, ownerWallet
      );
      const taxTx: TaxTransaction = {
        id: `tx_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        agentWallet: walletAddress,
        timestamp: txResult.timestamp,
        txHash: txResult.hash,
        fromAddress: walletAddress,
        toAddress: to,
        amount: amountNum,
        category,
        subcategory,
        description,
        confidence,
        manuallyCategorised: false,
      };
      await database.saveTaxTransaction(taxTx);
    } catch (taxErr) {
      console.error('Tax ledger logging failed (non-blocking):', taxErr);
    }

    console.log(`Payment sent: ${amount} USDC from ${agent.name} to ${to}`);

    return NextResponse.json({
      success: true,
      transaction: {
        hash: txResult.hash,
        from: walletAddress,
        to,
        amount,
        description,
        timestamp: txResult.timestamp,
        status: txResult.status,
        explorerUrl: `https://basescan.org/tx/${txResult.hash}`
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
