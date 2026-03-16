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
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

const PLATFORM_WALLET = '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

/**
 * Auto-ingest backup payments and other platform transactions into the tax ledger.
 * Checks existing tax records to avoid duplicates.
 */
async function autoIngestTransactions(walletAddress: string, agentId: string, ownerWallet?: string) {
  // Get existing tax transactions to avoid duplicates
  const existingTx = await database.getTaxTransactions(walletAddress);
  const existingIds = new Set(existingTx.map(t => t.id));

  const agent = await database.getAgent(agentId);
  const altIds = [agentId, walletAddress, agent?.address].filter(Boolean) as string[];

  // 1. Ingest backup payments
  const backups = await agentInsurance.getAgentBackups(agentId, altIds);
  for (const backup of backups) {
    const taxId = `tax_backup_${backup.id}`;
    if (existingIds.has(taxId)) continue;
    if (!backup.cost || backup.cost <= 0) continue;

    const { category, subcategory, confidence } = categoriseTransaction(
      walletAddress, PLATFORM_WALLET, backup.cost, `Backup fee: ${backup.id}`, walletAddress, ownerWallet
    );

    const tx: TaxTransaction = {
      id: taxId,
      agentWallet: walletAddress,
      timestamp: backup.timestamp || new Date().toISOString(),
      txHash: backup.paymentTx || undefined,
      fromAddress: walletAddress,
      toAddress: PLATFORM_WALLET,
      amount: backup.cost,
      category,
      subcategory,
      description: `Backup fee: ${backup.id.slice(0, 20)}`,
      confidence,
      manuallyCategorised: false,
    };
    await database.saveTaxTransaction(tx);
  }

  // 2. Ingest DB transactions (wallet transfers, payments)
  const dbTransactions = await database.getTransactions(agentId);
  for (const t of dbTransactions) {
    const taxId = `tax_dbtx_${t.id}`;
    if (existingIds.has(taxId)) continue;

    const amount = parseFloat(t.amount || '0');
    if (amount <= 0) continue;

    const from = t.fromAddress || t.from || walletAddress;
    const to = t.toAddress || t.to || '';

    const { category, subcategory, confidence } = categoriseTransaction(
      from, to, amount, t.description || t.type || '', walletAddress, ownerWallet
    );

    const tx: TaxTransaction = {
      id: taxId,
      agentWallet: walletAddress,
      timestamp: t.timestamp || t.createdAt || new Date().toISOString(),
      txHash: t.txHash || t.hash || undefined,
      fromAddress: from,
      toAddress: to,
      amount,
      category,
      subcategory,
      description: t.description || t.type || '',
      confidence,
      manuallyCategorised: false,
    };
    await database.saveTaxTransaction(tx);
  }
}

// GET — Fetch tax data, summary, and transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Resolve agent
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    const agentId = agent?.id || walletAddress;
    const ownerWallet = agent?.ownerWallet;

    // Auto-ingest backup/payment transactions into tax ledger
    await autoIngestTransactions(walletAddress, agentId, ownerWallet);

    // Load settings and transactions from Supabase
    const settings = await database.getTaxSettings(walletAddress);
    const transactions = await database.getTaxTransactions(walletAddress);

    // Generate period based on jurisdiction
    const jurisdictionConfig = JURISDICTIONS.find(j => j.id === settings.jurisdiction) || JURISDICTIONS[0];
    let periodStart: Date;
    let periodEnd: Date;

    if (jurisdictionConfig.id === 'UK') {
      periodStart = new Date(year - 1, 3, 6);
      periodEnd = new Date(year, 3, 5);
    } else if (jurisdictionConfig.id === 'AU') {
      periodStart = new Date(year - 1, 6, 1);
      periodEnd = new Date(year, 5, 30);
    } else if (jurisdictionConfig.id === 'ZA') {
      periodStart = new Date(year - 1, 2, 1);
      periodEnd = new Date(year, 1, 28);
    } else {
      periodStart = new Date(year, 0, 1);
      periodEnd = new Date(year, 11, 31);
    }

    // CSV export
    if (format === 'csv') {
      const csv = generateCSV(transactions as TaxTransaction[]);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="agent-tax-report-${walletAddress.slice(0, 8)}-${year}.csv"`,
        },
      });
    }

    const summary = generateTaxSummary(transactions as TaxTransaction[], settings.jurisdiction, periodStart, periodEnd);

    // Threshold alerts
    const alerts: string[] = [];
    const config = JURISDICTIONS.find(j => j.id === settings.jurisdiction);
    if (config) {
      for (const threshold of config.thresholds) {
        if (summary.grossIncome >= threshold.amount * 0.8 && summary.grossIncome < threshold.amount) {
          alerts.push(`Approaching ${threshold.label}: $${summary.grossIncome.toFixed(2)} / $${threshold.amount} — ${threshold.note}`);
        } else if (summary.grossIncome >= threshold.amount) {
          alerts.push(`${threshold.label} reached: $${summary.grossIncome.toFixed(2)} — ${threshold.note}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      jurisdiction: settings.jurisdiction,
      jurisdictionConfig: config,
      summary,
      transactions,
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

    // Load settings
    const settings = await database.getTaxSettings(walletAddress);

    // Action: set jurisdiction
    if (body.action === 'setJurisdiction') {
      const validJurisdiction = JURISDICTIONS.find(j => j.id === body.jurisdiction);
      if (!validJurisdiction) {
        return NextResponse.json({ success: false, error: "Invalid jurisdiction" }, { status: 400 });
      }
      await database.saveTaxSettings(walletAddress, { jurisdiction: body.jurisdiction });
      return NextResponse.json({ success: true, jurisdiction: body.jurisdiction });
    }

    // Action: recategorise a transaction
    if (body.action === 'recategorise') {
      await database.updateTaxTransaction(body.transactionId, {
        category: body.category as TaxCategory,
        subcategory: body.subcategory as TaxSubcategory,
        manuallyCategorised: true,
        confidence: 100,
      });
      return NextResponse.json({ success: true });
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
        jurisdiction: settings.jurisdiction,
      };

      await database.saveTaxTransaction(transaction);

      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Tax logging error:", error);
    return NextResponse.json({ success: false, error: "Failed to process tax request" }, { status: 500 });
  }
}
