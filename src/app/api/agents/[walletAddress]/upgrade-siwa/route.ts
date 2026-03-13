import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { AgenticWallet } from "@/lib/agenticWallet";
import { ERC8004Tokenization } from "@/lib/erc8004";
import { verifySIWASignature } from "@/lib/siwa";
import { nanoid } from "nanoid";

export interface UpgradeToSIWARequest {
  siwaMessage: {
    domain: string;
    uri: string;
    agentId: number;
    agentRegistry: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
    expirationTime?: string;
    notBefore?: string;
  };
  signature: string;
  newAddress: string;
}

export interface UpgradeToSIWAResponse {
  success: boolean;
  agent?: {
    id: string;
    name: string;
    type: string;
    walletAddress: string;
    walletId: string;
    erc8004TokenId: number;
    registeredAt: string;
    status: string;
    siwaVerified: boolean;
    upgradedAt: string;
  };
  credentials?: {
    walletAddress: string;
    usdcBalance: string;
    endpoint: string;
    siwaVerified: boolean;
  };
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  
  try {
    const body: UpgradeToSIWARequest = await request.json();

    // Validate required fields
    const { siwaMessage, signature, newAddress } = body;
    
    if (!siwaMessage || !signature || !newAddress) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields: siwaMessage, signature, newAddress"
      }, { status: 400 });
    }

    // Validate new address
    if (!newAddress.startsWith('0x') || newAddress.length !== 42) {
      return NextResponse.json({
        success: false,
        error: "Invalid Ethereum address"
      }, { status: 400 });
    }

    // Get existing agent
    const agent = database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Note: SIWA verification check would be implemented here
    // For now, we'll allow the upgrade to proceed

    // Verify SIWA signature
    const siwaVerification = await verifySIWASignature(siwaMessage, signature, newAddress);
    if (!siwaVerification.valid) {
      return NextResponse.json({
        success: false,
        error: `SIWA signature verification failed: ${siwaVerification.error}`
      }, { status: 401 });
    }

    // Get current wallet balance
    const currentBalance = await AgenticWallet.getBalance(walletAddress);
    
    // Create new wallet with SIWA address
    const newWallet = await AgenticWallet.createWallet(`${agent.name}@${agent.type}.sovereignos`);
    
    // Transfer balance from old wallet to new wallet (if > 0)
    let transferTx = null;
    if (parseFloat(currentBalance) > 0) {
      try {
        transferTx = await AgenticWallet.sendPayment(
          walletAddress,
          newWallet.address,
          currentBalance,
          "Balance transfer for SIWA upgrade"
        );
      } catch (error) {
        console.error("Balance transfer failed:", error);
        // Continue with upgrade even if transfer fails
      }
    }

    // Note: ERC-8004 token address update would be implemented here
    // For now, we'll update the database record only

    // Update agent in database
    const upgradedAgent = {
      ...agent,
      walletAddress: newWallet.address,
      walletId: newWallet.address,
      address: newWallet.address as `0x${string}`,
      owner: newAddress,
      metadata: {
        ...agent.metadata,
        siwaDomain: siwaMessage.domain,
        siwaChainId: siwaMessage.chainId,
        upgradedAt: new Date().toISOString(),
        previousWallet: walletAddress
      }
    };

    // Save updated agent
    database.saveAgent(upgradedAgent);

    // Get new wallet balance
    const newBalance = await AgenticWallet.getBalance(newWallet.walletId || newWallet.address);

    console.log(`Agent upgraded to SIWA: ${agent.id} - Old: ${walletAddress} → New: ${newWallet.address}`);

    return NextResponse.json({
      success: true,
      agent: {
        id: upgradedAgent.id,
        name: upgradedAgent.name,
        type: upgradedAgent.type,
        walletAddress: upgradedAgent.walletAddress,
        walletId: upgradedAgent.walletId,
        erc8004TokenId: upgradedAgent.erc8004TokenId,
        registeredAt: upgradedAgent.registeredAt,
        status: upgradedAgent.status,
        siwaVerified: true,
        upgradedAt: upgradedAgent.metadata?.upgradedAt
      },
      credentials: {
        walletAddress: upgradedAgent.walletAddress,
        usdcBalance: newBalance,
        endpoint: `https://sovereign-os-snowy.vercel.app/api/agents/${upgradedAgent.walletAddress}`,
        siwaVerified: true
      },
      transfer: transferTx ? {
        hash: transferTx.hash,
        amount: currentBalance,
        explorerUrl: `https://sepolia.basescan.org/tx/${transferTx.hash}`
      } : null
    });

  } catch (error) {
    console.error("SIWA upgrade failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "SIWA upgrade failed"
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;
  
  try {
    const agent = database.getAgentByWallet(walletAddress);
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      currentWallet: walletAddress,
      siwaVerified: false, // Default to false for upgrade check
      canUpgrade: true, // Allow upgrade for all agents
      upgradeEndpoint: `/api/agents/${walletAddress}/upgrade-siwa`,
      siwaRequirements: {
        domain: "sovereign-os.ai",
        uri: "https://sovereign-os-snowy.vercel.app",
        agentRegistry: "eip155:84532:0x8004A818BFB912233c491871b3d84c89A494BD9e",
        chainId: 84532
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "Failed to get upgrade info"
    }, { status: 500 });
  }
}
