import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import {
  validateWithholdingSettings,
  JURISDICTION_RATES,
  generateWithholdingCSV,
  generateWithholdingSummary,
} from "@/lib/taxWithholding";

// GET — Fetch withholding settings, events, and summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const settings = await database.getTaxSettings(walletAddress);
    const events = await database.getWithholdingEvents(walletAddress, year);
    const stats = await database.getWithholdingStats(walletAddress);

    // CSV export
    if (format === 'csv') {
      const csv = generateWithholdingCSV(events);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tax-withholding-${walletAddress.slice(0, 8)}-${year}.csv"`,
        },
      });
    }

    const summary = generateWithholdingSummary(events);

    return NextResponse.json({
      success: true,
      settings: {
        withholdingEnabled: settings.withholdingEnabled,
        withholdingRate: settings.withholdingRate,
        taxDestinationWallet: settings.taxDestinationWallet,
        jurisdiction: settings.jurisdiction,
      },
      stats: {
        totalWithheld: Math.round(stats.totalWithheld * 100) / 100,
        totalGrossIncome: Math.round(stats.totalGross * 100) / 100,
        totalNetIncome: Math.round(stats.totalNet * 100) / 100,
        withholdingCount: stats.count,
      },
      summary,
      events,
      jurisdictionRates: JURISDICTION_RATES,
    });
  } catch (error) {
    console.error("Tax withholding GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch withholding data" }, { status: 500 });
  }
}

// POST — Update withholding settings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const body = await request.json();

    // Action: update withholding settings
    if (body.action === 'updateSettings') {
      const { withholdingEnabled, withholdingRate, taxDestinationWallet, jurisdiction } = body;

      // If user is trying to enable, validate wallet is present
      const wantEnabled = withholdingEnabled ?? false;
      const walletValid = taxDestinationWallet
        && taxDestinationWallet.startsWith('0x')
        && taxDestinationWallet.length === 42;

      // Auto-disable if no valid wallet — can't split without a destination
      const finalEnabled = wantEnabled && walletValid;

      if (wantEnabled && !walletValid) {
        // Validate only when trying to enable
        const validation = validateWithholdingSettings({
          withholdingEnabled: true,
          withholdingRate,
          taxDestinationWallet,
        });
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            errors: validation.errors,
          }, { status: 400 });
        }
      }

      // Save settings
      await database.saveTaxSettings(walletAddress, {
        withholdingEnabled: finalEnabled,
        withholdingRate: withholdingRate ?? 15,
        taxDestinationWallet: taxDestinationWallet ?? '',
        ...(jurisdiction ? { jurisdiction } : {}),
      });

      console.log(`Tax withholding settings updated for ${walletAddress}: enabled=${withholdingEnabled}, rate=${withholdingRate}%, dest=${taxDestinationWallet?.slice(0, 10)}...`);

      return NextResponse.json({
        success: true,
        message: withholdingEnabled
          ? `Automatic withholding enabled at ${withholdingRate}%`
          : 'Automatic withholding disabled',
      });
    }

    // Action: toggle withholding on/off
    if (body.action === 'toggle') {
      const current = await database.getTaxSettings(walletAddress);

      if (!current.withholdingEnabled) {
        // Turning ON — validate destination wallet exists
        if (!current.taxDestinationWallet || current.taxDestinationWallet.length !== 42) {
          return NextResponse.json({
            success: false,
            error: 'Set a valid tax destination wallet before enabling withholding',
          }, { status: 400 });
        }
      }

      await database.saveTaxSettings(walletAddress, {
        withholdingEnabled: !current.withholdingEnabled,
      });

      return NextResponse.json({
        success: true,
        withholdingEnabled: !current.withholdingEnabled,
        message: !current.withholdingEnabled
          ? `Automatic withholding enabled at ${current.withholdingRate}%`
          : 'Automatic withholding disabled',
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Tax withholding POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to update withholding settings" }, { status: 500 });
  }
}
