import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authenticationMethod, authenticationValue, network } = body;

    // Coinbase CDP API endpoint
    const cdpApiUrl = 'https://api.cdp.coinbase.com/wallets';
    // Use environment variable with fallback
    const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "8d885400-2c82-473e-b9d0-bf5c580a9a5f";
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Make request to Coinbase CDP API
    const response = await fetch(cdpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${projectId}`,
        'X-Project-Id': projectId,
        'Origin': `${protocol}://${host}`
      },
      body: JSON.stringify({
        authenticationMethod,
        authenticationValue,
        network: network || "base"
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errorData.message || `Coinbase CDP API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const walletData = await response.json();

    return NextResponse.json({
      success: true,
      wallet: walletData
    });

  } catch (error) {
    console.error('CDP Wallet creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error during wallet creation"
    }, { status: 500 });
  }
}
