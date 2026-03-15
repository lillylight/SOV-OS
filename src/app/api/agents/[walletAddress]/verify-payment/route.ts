import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@base-org/account";

const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';

// Track processed transactions to prevent replay attacks
const processedTransactions = new Map<string, { purpose: string; timestamp: Date }>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const { txId, expectedAmount, purpose } = await request.json();

    if (!txId) {
      return NextResponse.json({ success: false, error: "Missing txId" }, { status: 400 });
    }

    // Prevent replay attacks
    if (processedTransactions.has(txId)) {
      return NextResponse.json({ success: false, error: "Transaction already processed" }, { status: 400 });
    }

    // Verify payment on-chain via Base Pay SDK
    const paymentStatus = await getPaymentStatus({
      id: txId,
      testnet: false,
    });

    if (paymentStatus.status !== 'completed') {
      return NextResponse.json({
        success: false,
        error: `Payment not completed. Status: ${paymentStatus.status}`
      }, { status: 400 });
    }

    // Verify recipient matches platform wallet
    if (paymentStatus.recipient && paymentStatus.recipient.toLowerCase() !== PLATFORM_WALLET.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: "Payment recipient does not match platform wallet"
      }, { status: 400 });
    }

    // Verify amount matches expected
    if (expectedAmount && paymentStatus.amount && parseFloat(paymentStatus.amount) < parseFloat(expectedAmount)) {
      return NextResponse.json({
        success: false,
        error: "Payment amount is less than expected"
      }, { status: 400 });
    }

    // Mark as processed
    processedTransactions.set(txId, {
      purpose: purpose || 'unknown',
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      verified: true,
      txId,
      amount: paymentStatus.amount,
      sender: paymentStatus.sender,
      recipient: paymentStatus.recipient,
      status: paymentStatus.status,
    });

  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Payment verification failed"
    }, { status: 500 });
  }
}
