import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authenticationMethod, authenticationValue, network } = body;

    // Coinbase CDP API endpoint
    const cdpApiUrl = 'https://api.cdp.coinbase.com/wallets';
    const projectId = "8d885400-2c82-473e-b9d0-bf5c580a9a5f";

    // Make request to Coinbase CDP API
    const response = await fetch(cdpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${projectId}`,
        'X-Project-Id': projectId,
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        authenticationMethod,
        authenticationValue,
        network: network || "base"
      })
    });

    if (!response.ok) {
      // If CDP API fails, create a mock wallet for demo
      console.warn('CDP API not available, creating mock wallet');
      
      const mockWalletAddress = `0x${Math.random().toString(36).substr(2, 40)}`;
      const mockWalletData = {
        address: mockWalletAddress,
        walletId: `wallet_${Date.now()}`,
        network: "base",
        type: "smart",
        createdAt: new Date().toISOString(),
        status: "active"
      };

      return NextResponse.json({
        success: true,
        wallet: mockWalletData,
        mock: true
      });
    }

    const walletData = await response.json();

    return NextResponse.json({
      success: true,
      wallet: walletData,
      mock: false
    });

  } catch (error) {
    console.error('CDP Wallet creation error:', error);
    
    // Fallback to mock wallet
    const mockWalletAddress = `0x${Math.random().toString(36).substr(2, 40)}`;
    const mockWalletData = {
      address: mockWalletAddress,
      walletId: `wallet_${Date.now()}`,
      network: "base",
      type: "smart",
      createdAt: new Date().toISOString(),
      status: "active"
    };

    return NextResponse.json({
      success: true,
      wallet: mockWalletData,
      mock: true
    });
  }
}
