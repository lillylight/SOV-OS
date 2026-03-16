import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";
import {
  calculateWithholding,
  generateWithholdingId,
  type WithholdingEvent,
  type WithholdingSourceType,
} from "@/lib/taxWithholding";
import { categoriseTransaction, type TaxTransaction } from "@/lib/taxLedger";

// POST — Receive a payment for an agent with automatic tax withholding
// This is the main entry point for any income flowing into an agent's wallet.
// If withholding is enabled, the payment is automatically split:
//   - Net amount → Agent's operational wallet
//   - Tax amount → Owner's designated tax wallet
// If withholding is disabled, full amount goes to agent.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;

  try {
    const body = await request.json();
    const {
      amount,
      fromAddress,
      description,
      sourceType,
      txHash,
    } = body;

    // ── Validate inputs ──
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!fromAddress || !fromAddress.startsWith('0x')) {
      return NextResponse.json({ success: false, error: "Invalid fromAddress" }, { status: 400 });
    }

    const grossAmount = parseFloat(amount);
    const desc = description || 'Incoming payment';
    const source: WithholdingSourceType = sourceType || 'api_payment';

    // ── Resolve agent ──
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    // ── Get tax withholding settings ──
    const settings = await database.getTaxSettings(walletAddress);
    // ── Always calculate tax obligation (even when split is disabled) ──
    const calc = calculateWithholding(grossAmount, settings.withholdingRate > 0 ? settings.withholdingRate : 15);
    const calculatedTax = calc.taxAmount;
    const calculatedNet = calc.netAmount;

    // Split only happens when: enabled + valid tax wallet
    const hasTaxWallet = !!settings.taxDestinationWallet
      && settings.taxDestinationWallet.startsWith('0x')
      && settings.taxDestinationWallet.length === 42;
    const shouldSplit = settings.withholdingEnabled && hasTaxWallet && settings.withholdingRate > 0;

    let netAmount = grossAmount;
    let taxAmount = 0;
    let splitExecuted = false;
    let withholdingEvent: WithholdingEvent | null = null;

    // ── Create withholding event (always — for tracking) ──
    withholdingEvent = {
      id: generateWithholdingId(),
      agentWallet: walletAddress,
      timestamp: new Date().toISOString(),
      grossAmount,
      taxAmount: calculatedTax,
      netAmount: calculatedNet,
      withholdingRate: settings.withholdingRate > 0 ? settings.withholdingRate : 15,
      taxDestinationWallet: settings.taxDestinationWallet || '',
      source: desc,
      sourceType: source,
      txHashIncoming: txHash || undefined,
      status: shouldSplit ? 'pending' : 'completed',
      jurisdiction: settings.jurisdiction,
    };

    if (shouldSplit) {
      // ── Execute the on-chain split ──
      taxAmount = calculatedTax;
      netAmount = calculatedNet;

      if (AgenticWallet.isConfigured() && taxAmount > 0) {
        try {
          const taxTxResult = await AgenticWallet.sendPayment(
            walletAddress,
            settings.taxDestinationWallet,
            taxAmount.toString(),
            `Tax withholding: ${settings.withholdingRate}% of $${grossAmount.toFixed(2)} — ${desc}`
          );
          withholdingEvent.txHashToTax = taxTxResult.hash;
          withholdingEvent.status = 'completed';
          splitExecuted = true;

          console.log(`Tax withholding: $${taxAmount.toFixed(2)} sent to ${settings.taxDestinationWallet.slice(0, 10)}... for agent ${walletAddress.slice(0, 10)}...`);
        } catch (txError) {
          console.error('Tax withholding transfer failed:', txError);
          withholdingEvent.status = 'failed';
          netAmount = grossAmount;
          taxAmount = 0;
        }
      } else {
        // CDP not configured — ledger-only mode, still record the split
        withholdingEvent.status = 'completed';
        splitExecuted = true;
      }
    } else {
      // Not splitting — full amount goes to agent, but we still track
      // the calculated tax obligation so user knows what they owe
      netAmount = grossAmount;
      taxAmount = 0;
    }

    // ── Always save withholding event to ledger ──
    await database.saveWithholdingEvent(withholdingEvent);

    // ── Always update running totals ──
    await database.saveTaxSettings(walletAddress, {
      totalWithheld: settings.totalWithheld + (splitExecuted ? calculatedTax : 0),
      totalGrossIncome: settings.totalGrossIncome + grossAmount,
      totalNetIncome: settings.totalNetIncome + (splitExecuted ? calculatedNet : grossAmount),
      withholdingCount: settings.withholdingCount + 1,
      lastWithholdingAt: new Date().toISOString(),
    });

    // ── Log in tax ledger (for tax reporting) ──
    const ownerWallet = agent.ownerWallet || undefined;
    const { category, subcategory, confidence } = categoriseTransaction(
      fromAddress, walletAddress, grossAmount, desc, walletAddress, ownerWallet
    );

    const taxTx: TaxTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentWallet: walletAddress,
      timestamp: new Date().toISOString(),
      txHash: txHash || undefined,
      fromAddress,
      toAddress: walletAddress,
      amount: grossAmount,
      category,
      subcategory,
      description: desc,
      confidence,
      manuallyCategorised: false,
      jurisdiction: settings.jurisdiction,
    };
    await database.saveTaxTransaction(taxTx);

    // ── Store transaction in database ──
    await database.createTransaction({
      agentId: agent.id,
      from: fromAddress,
      to: walletAddress,
      amount: grossAmount.toString(),
      description: desc,
      txHash: txHash || '',
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    // ── Update agent last active ──
    agent.lastActiveAt = new Date().toISOString();
    await database.saveAgent(agent);

    // ── Build response ──
    const response: any = {
      success: true,
      payment: {
        grossAmount,
        netAmount,
        taxWithheld: taxAmount,
        withholdingApplied: splitExecuted && taxAmount > 0,
        withholdingRate: settings.withholdingRate > 0 ? settings.withholdingRate : 15,
        calculatedTaxObligation: calculatedTax,
        splitEnabled: shouldSplit,
      },
      agent: {
        wallet: walletAddress,
        name: agent.name,
      },
    };

    if (withholdingEvent) {
      response.withholding = {
        id: withholdingEvent.id,
        status: withholdingEvent.status,
        taxDestination: settings.taxDestinationWallet,
        txHashToTax: withholdingEvent.txHashToTax || null,
      };
    }

    if (splitExecuted && taxAmount > 0) {
      response.message = `Payment received: $${grossAmount.toFixed(2)} gross → $${netAmount.toFixed(2)} net (${settings.withholdingRate}% withheld → ${settings.taxDestinationWallet.slice(0, 10)}...)`;
    } else {
      response.message = `Payment received: $${grossAmount.toFixed(2)} (tax obligation: $${calculatedTax.toFixed(2)} at ${settings.withholdingRate > 0 ? settings.withholdingRate : 15}% — not split, tracking only)`;
    }

    console.log(response.message);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Receive payment error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
    }, { status: 500 });
  }
}

// GET — Check withholding status for an agent (quick status check)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const settings = await database.getTaxSettings(walletAddress);
    const stats = await database.getWithholdingStats(walletAddress);

    return NextResponse.json({
      success: true,
      withholdingEnabled: settings.withholdingEnabled,
      withholdingRate: settings.withholdingRate,
      taxDestinationWallet: settings.taxDestinationWallet,
      stats: {
        totalWithheld: Math.round(stats.totalWithheld * 100) / 100,
        totalGrossIncome: Math.round(stats.totalGross * 100) / 100,
        totalNetIncome: Math.round(stats.totalNet * 100) / 100,
        count: stats.count,
      },
    });
  } catch (error) {
    console.error("Withholding status error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500 });
  }
}
