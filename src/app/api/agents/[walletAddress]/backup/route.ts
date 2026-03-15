import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const agent = await database.getAgentByWallet(walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Check if agent can create backup
    const { canBackup, reason, plan } = await agentInsurance.canCreateBackup(agent.id);
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
    const backup = await agentInsurance.createBackup(agent.id, agentState);

    // Update agent's backup count
    agent.protocols.agentWill.backupCount += 1;
    agent.protocols.agentWill.lastBackup = backup.timestamp;
    await database.saveAgent(agent);
    
    // Get stats
    const stats = await agentInsurance.getInsuranceStats(agent.id);

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
    const agent = await database.getAgentByWallet(walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    const backups = await agentInsurance.getAgentBackups(agent.id);
    const stats = await agentInsurance.getInsuranceStats(agent.id);
    const { canBackup, reason, plan } = await agentInsurance.canCreateBackup(agent.id);

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
        unlimitedPrice: 10.00,
        recoveryPrice: 0,
      },
      availablePlans: [
        {
          id: 'starter',
          name: 'Pay-per-backup',
          maxBackups: -1,
          price: 0.10,
          features: ['$0.10 USDC per backup (first 2)', '$0.30 USDC per backup (after 2)', 'AES-256-GCM encryption', 'Permanent IPFS storage', 'Recovery is ALWAYS free']
        },
        {
          id: 'bypass',
          name: 'Bypass Limit',
          maxBackups: -1,
          price: 10,
          features: ['$10 USDC one-time payment', 'Remove the 2-backup cap', 'More than 2 backups at $0.30 each', 'AES-256-GCM encryption', 'Permanent IPFS storage', 'Recovery is ALWAYS free']
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
