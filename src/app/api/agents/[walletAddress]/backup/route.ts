import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";
import { categoriseTransaction, type TaxTransaction } from "@/lib/taxLedger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    let body: any = {};
    try { body = await request.json(); } catch { /* no body is fine */ }
    const paidViaPay = body?.paidViaPay === true;
    const externalPaymentTx = body?.paymentTx || body?.bpTxId || null;

    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Check if agent can create backup
    const altIds = [agent.walletAddress, agent.address, walletAddress].filter(Boolean) as string[];
    const { canBackup, reason, plan } = await agentInsurance.canCreateBackup(agent.id, altIds);
    if (!canBackup) {
      return NextResponse.json({
        success: false,
        error: reason,
        currentPlan: plan
      }, { status: 400 });
    }

    // Get current agent state
    const agentState = {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      metadata: agent.metadata,
      protocols: agent.protocols,
      createdAt: agent.createdAt,
      lastActiveAt: agent.lastActiveAt
    };

    // Create encrypted backup
    // If paidViaPay is true, payment was already collected via /api/agents/[wallet]/pay
    // so skip the internal USDC transfer in createBackup
    const backup = await agentInsurance.createBackup(agent.id, agentState, { skipPayment: paidViaPay, externalPaymentTx });

    // Get real stats from DB and sync agent record
    const stats = await agentInsurance.getInsuranceStats(agent.id, altIds);
    agent.protocols.agentWill.backupCount = stats.backupCount;
    agent.protocols.agentWill.lastBackup = backup.timestamp;
    await database.saveAgent(agent);

    // Auto-log to tax ledger
    try {
      const PLATFORM_WALLET = process.env.PLATFORM_WALLET || '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';
      const taxRes = await fetch(new URL(`/api/agents/${walletAddress}/tax`, request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          fromAddress: walletAddress,
          toAddress: PLATFORM_WALLET,
          amount: backup.cost || 0,
          description: `Backup fee: ${backup.id}`,
          txHash: backup.hash || undefined,
        }),
      });
    } catch (taxErr) {
      console.error('Tax logging failed (non-blocking):', taxErr);
    }

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        ipfsCid: backup.ipfsCid,
        sizeBytes: backup.sizeBytes,
        timestamp: backup.timestamp,
        hash: backup.hash,
        cost: backup.cost,
        status: backup.status
      },
      stats,
      plan
    });

  } catch (error) {
    console.error("Backup creation failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Backup creation failed"
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    console.log("[Backup GET] identifier:", walletAddress);
    let agent = await database.getAgentByWallet(walletAddress);
    if (!agent) agent = await database.getAgent(walletAddress);
    
    if (!agent) {
      console.log("[Backup GET] Agent NOT found for:", walletAddress);
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    const altIds = [agent.walletAddress, agent.address, walletAddress].filter(Boolean) as string[];
    const backups = await agentInsurance.getAgentBackups(agent.id, altIds);
    const stats = await agentInsurance.getInsuranceStats(agent.id, altIds);
    const { canBackup, reason, plan } = await agentInsurance.canCreateBackup(agent.id, altIds);

    // Sync agent record with real backup count from DB
    const realCount = stats.backupCount;
    if (agent.protocols?.agentWill?.backupCount !== realCount) {
      agent.protocols.agentWill = agent.protocols.agentWill || { isActive: true, lastBackup: "", backupCount: 0 };
      agent.protocols.agentWill.backupCount = realCount;
      agent.protocols.agentWill.lastBackup = stats.lastBackup || agent.protocols.agentWill.lastBackup;
      try { await database.saveAgent(agent); } catch {}
    }

    return NextResponse.json({
      success: true,
      backups: backups.map(b => ({
        id: b.id,
        ipfsCid: b.ipfsCid,
        sizeBytes: b.sizeBytes,
        timestamp: b.timestamp,
        hash: b.hash,
        cost: b.cost,
        status: b.status
      })),
      stats,
      canBackup,
      backupReason: reason,
      currentPlan: plan,
      nextCost: (await agentInsurance.canCreateBackup(agent.id)).nextCost,
      pricing: {
        introPrice: 0.10,
        introLimit: 2,
        standardPrice: 0.30,
        unlimitedPrice: 5.00,
        recoveryPrice: 0,
      },
      availablePlans: [
        {
          id: 'starter',
          name: 'Pay-per-backup',
          maxBackups: -1,
          price: 5.00,
          features: ['$0.10 USDC per backup (first 2)', '$0.30 USDC per backup (3rd onwards)', 'AES-256-GCM encryption', 'Permanent IPFS storage', 'Recovery is ALWAYS free']
        },
        {
          id: 'bypass',
          name: 'Unlimited Backups',
          maxBackups: -1,
          price: 5,
          features: ['$5 USDC one-time payment', 'Unlimited backups at $0.30 each', 'AES-256-GCM encryption', 'Permanent IPFS storage', 'Recovery is ALWAYS free']
        }
      ]
    });

  } catch (error) {
    console.error("Backup retrieval failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Backup retrieval failed"
    }, { status: 500 });
  }
}
