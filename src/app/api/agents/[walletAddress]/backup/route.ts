import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    const { walletAddress } = await params;
    const agent = database.getAgentByWallet(walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    // Check if agent can create backup
    const { canBackup, reason, plan } = agentInsurance.canCreateBackup(agent.id);
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
    database.saveAgent(agent);

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
      stats: agentInsurance.getInsuranceStats(agent.id),
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
    const agent = database.getAgentByWallet(walletAddress);
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: "Agent not found"
      }, { status: 404 });
    }

    const backups = agentInsurance.getAgentBackups(agent.id);
    const stats = agentInsurance.getInsuranceStats(agent.id);
    const { canBackup, reason, plan } = agentInsurance.canCreateBackup(agent.id);

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
      availablePlans: [
        {
          id: 'standard',
          name: 'Standard',
          maxBackups: 2,
          price: 0,
          features: ['Up to 2 encrypted backups', 'Permanent IPFS storage', 'Free restore']
        },
        {
          id: 'infinite',
          name: 'Infinite',
          maxBackups: -1,
          price: 10,
          features: ['Unlimited encrypted backups', 'Permanent IPFS storage', 'Free restore', 'Priority support']
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
