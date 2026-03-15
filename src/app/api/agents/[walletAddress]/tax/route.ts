import { NextRequest, NextResponse } from "next/server";
import {
  categoriseTransaction,
  generateTaxSummary,
  generateCSV,
  JURISDICTIONS,
  type TaxTransaction,
  type TaxCategory,
  type TaxSubcategory,
} from "@/lib/taxLedger";

// In-memory store (replace with DB in production)
const taxStore = new Map<string, {
  transactions: TaxTransaction[];
  jurisdiction: string;
}>();

function getOrCreateStore(walletAddress: string) {
  if (!taxStore.has(walletAddress)) {
    taxStore.set(walletAddress, { transactions: [], jurisdiction: 'US' });
  }
  return taxStore.get(walletAddress)!;
}

// GET — Fetch tax data, summary, and transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'csv' for export
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const store = getOrCreateStore(walletAddress);

    // Generate period based on jurisdiction
    const jurisdictionConfig = JURISDICTIONS.find(j => j.id === store.jurisdiction) || JURISDICTIONS[0];
    let periodStart: Date;
    let periodEnd: Date;

    if (jurisdictionConfig.id === 'UK') {
      periodStart = new Date(year - 1, 3, 6); // Apr 6 previous year
      periodEnd = new Date(year, 3, 5); // Apr 5 current year
    } else if (jurisdictionConfig.id === 'AU') {
      periodStart = new Date(year - 1, 6, 1); // Jul 1 previous year
      periodEnd = new Date(year, 5, 30); // Jun 30 current year
    } else if (jurisdictionConfig.id === 'ZA') {
      periodStart = new Date(year - 1, 2, 1); // Mar 1 previous year
      periodEnd = new Date(year, 1, 28); // Feb 28 current year
    } else {
      periodStart = new Date(year, 0, 1); // Jan 1
      periodEnd = new Date(year, 11, 31); // Dec 31
    }

    // CSV export
    if (format === 'csv') {
      const csv = generateCSV(store.transactions);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="agent-tax-report-${walletAddress.slice(0, 8)}-${year}.csv"`,
        },
      });
    }

    const summary = generateTaxSummary(store.transactions, store.jurisdiction, periodStart, periodEnd);

    // Calculate next cost thresholds for alerts
    const alerts: string[] = [];
    const config = JURISDICTIONS.find(j => j.id === store.jurisdiction);
    if (config) {
      for (const threshold of config.thresholds) {
        if (summary.grossIncome >= threshold.amount * 0.8 && summary.grossIncome < threshold.amount) {
          alerts.push(`⚠️ Approaching ${threshold.label}: $${summary.grossIncome.toFixed(2)} / $${threshold.amount} — ${threshold.note}`);
        } else if (summary.grossIncome >= threshold.amount) {
          alerts.push(`🔴 ${threshold.label} reached: $${summary.grossIncome.toFixed(2)} — ${threshold.note}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      jurisdiction: store.jurisdiction,
      jurisdictionConfig: config,
      summary,
      transactions: store.transactions.slice().reverse(), // newest first
      alerts,
      availableJurisdictions: JURISDICTIONS.map(j => ({ id: j.id, name: j.name, flag: j.flag })),
    });

  } catch (error) {
    console.error("Tax data fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tax data" }, { status: 500 });
  }
}

// POST — Log a new transaction or update settings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const body = await request.json();
    const store = getOrCreateStore(walletAddress);

    // Action: set jurisdiction
    if (body.action === 'setJurisdiction') {
      const validJurisdiction = JURISDICTIONS.find(j => j.id === body.jurisdiction);
      if (!validJurisdiction) {
        return NextResponse.json({ success: false, error: "Invalid jurisdiction" }, { status: 400 });
      }
      store.jurisdiction = body.jurisdiction;
      return NextResponse.json({ success: true, jurisdiction: store.jurisdiction });
    }

    // Action: recategorise a transaction
    if (body.action === 'recategorise') {
      const tx = store.transactions.find(t => t.id === body.transactionId);
      if (!tx) {
        return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
      }
      tx.category = body.category as TaxCategory;
      tx.subcategory = body.subcategory as TaxSubcategory;
      tx.manuallyCategorised = true;
      tx.confidence = 100;
      return NextResponse.json({ success: true, transaction: tx });
    }

    // Action: log a new transaction
    if (body.action === 'log' || !body.action) {
      const { fromAddress, toAddress, amount, description, txHash, ownerWallet } = body;

      if (!fromAddress || !toAddress || amount === undefined) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const { category, subcategory, confidence } = categoriseTransaction(
        fromAddress, toAddress, parseFloat(amount), description || '', walletAddress, ownerWallet
      );

      const transaction: TaxTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        agentWallet: walletAddress,
        timestamp: new Date().toISOString(),
        txHash,
        fromAddress,
        toAddress,
        amount: parseFloat(amount),
        category,
        subcategory,
        description: description || '',
        confidence,
        manuallyCategorised: false,
        jurisdiction: store.jurisdiction,
      };

      store.transactions.push(transaction);

      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Tax logging error:", error);
    return NextResponse.json({ success: false, error: "Failed to process tax request" }, { status: 500 });
  }
}
