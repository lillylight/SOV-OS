import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance, BACKUP_PRICING } from "@/lib/agentInsurance";
import AgenticWallet from "@/lib/agenticWallet";

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

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

    const agent = await database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // For bypass plan ($5 USDC), collect real payment to platform wallet first
    // If paymentSignature starts with 'pay_' or 'basepay_', payment was already collected externally
    let paymentTx: string | undefined;
    const alreadyPaid = paymentSignature && (paymentSignature.startsWith('pay_') || paymentSignature.startsWith('basepay_'));

    if (alreadyPaid) {
      paymentTx = paymentSignature.replace(/^(pay_|basepay_)/, '');
      console.log(`[Payment] Bypass plan: payment already collected externally (tx: ${paymentTx})`);
    } else if (planId === 'bypass' && agent.walletAddress && AgenticWallet.isConfigured()) {
      try {
        const tx = await AgenticWallet.sendPayment(
          agent.walletAddress,
          PLATFORM_WALLET,
          BACKUP_PRICING.UNLIMITED_PRICE.toFixed(6),
          `Bypass plan purchase: ${agent.id}`
        );
        paymentTx = tx.hash;
        console.log(`[Payment] $5 USDC bypass plan from ${agent.walletAddress} to ${PLATFORM_WALLET} | tx: ${tx.hash}`);
      } catch (payErr) {
        console.error('[Payment] Bypass plan USDC transfer failed:', payErr);
        return NextResponse.json({
          success: false,
          error: 'Payment failed. Please ensure your agent wallet has sufficient USDC balance.'
        }, { status: 402 });
      }
    }

    // Upgrade the plan
    const success = await agentInsurance.upgradePlan(agent.id, planId, paymentSignature || '');

    if (!success) {
      return NextResponse.json({
        success: false,
        error: "Plan upgrade failed"
      }, { status: 400 });
    }

    // Auto-log to tax ledger
    try {
      const taxRes = await fetch(new URL(`/api/agents/${walletAddress}/tax`, request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          fromAddress: walletAddress,
          toAddress: PLATFORM_WALLET,
          amount: BACKUP_PRICING.UNLIMITED_PRICE,
          description: `Unlock Unlimited Backups (bypass plan)`,
          txHash: paymentTx || undefined,
        }),
      });
    } catch (taxErr) {
      console.error('Tax logging failed (non-blocking):', taxErr);
    }

    return NextResponse.json({
      success: true,
      newPlan: planId,
      upgradedAt: new Date().toISOString(),
      ...(paymentTx && { paymentTx, paidTo: PLATFORM_WALLET })
    });

  } catch (error) {
    console.error("Plan upgrade failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Plan upgrade failed"
    }, { status: 500 });
  }
}
