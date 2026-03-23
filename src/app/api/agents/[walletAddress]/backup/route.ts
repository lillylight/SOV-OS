import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { agentInsurance } from "@/lib/agentInsurance";
import { categoriseTransaction, type TaxTransaction } from "@/lib/taxLedger";
import { getSoulCache } from "@/lib/soul-cache";
import { prepareMemoryForBackup, setConditioningCheckpoint } from "@/lib/memory-manager";
import { initializeSoul, hashSoulTensors, createV4BackupPayload, saveSoulToIPFS, getLastMerkleState } from "@/lib/soul-store";
import { processMemoryIncremental } from "@/lib/memory-processor";

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
    const incomingSoulDef = body?.soulDefinition || null;

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

    // Get current Soul State from in-memory cache (if agent has chatted)
    const soulCached = getSoulCache(agent.id);
    const defaultConfig = {
      num_nodes: 32, dim: 64, steps: 12, k: 8,
      mem_strength_fast: 0.3, mem_strength_slow: 0.7,
      phase_coupling: 0.15, pred_learning_rate: 0.01,
      hebbian_rate: 0.005, hebbian_decay: 0.001, affect_momentum: 0.85,
    };
    const rawTensors = soulCached?.rawTensors || soulCached?.tensors || initializeSoul(defaultConfig);
    const liveTensors = soulCached?.tensors || rawTensors;
    const soulConfig = soulCached?.config || defaultConfig;
    const baseline = soulCached?.baseline || rawTensors.nodes;

    // Get all memory from current session (V2: includes drift journal, affect, soul def, checkpoint)
    const memoryPayload = prepareMemoryForBackup(agent.id);

    // Handle incoming soul definition
    if (incomingSoulDef) {
      memoryPayload.soulDefinition = incomingSoulDef;
    }

    // Fallback to database memory if in-memory session was cleared by Serverless
    const episodic = memoryPayload.episodic.length > 0 ? memoryPayload.episodic : (agent.memory?.conversations || []).map((c: any) => ({
      role: c.content.startsWith('[user]') ? 'user' : (c.content.startsWith('[system]') ? 'system' : 'assistant'),
      content: c.content.replace(/^\[.*?\]\s*/, ''),
      timestamp: c.timestamp,
      session_id: c.id
    }));
    const semantic = memoryPayload.semantic.length > 0 ? memoryPayload.semantic : (agent.memory?.learnings || []).map((s: any) => ({
      key: s.id,
      value: s.content,
      confidence: 1.0
    }));

    // V2: Incremental conditioning — only process new episodes since last checkpoint
    const { tensors: conditionedTensors, checkpoint: newCheckpoint, driftJournal: processingDriftJournal } =
      processMemoryIncremental(
        memoryPayload.conditioningCheckpoint,
        rawTensors,
        episodic as any,
        soulConfig,
        baseline,
      );

    // Save checkpoint for next backup
    setConditioningCheckpoint(agent.id, newCheckpoint);

    // Merge drift journals
    const fullDriftJournal = [...memoryPayload.driftJournal, ...processingDriftJournal];

    // V2: Get Merkle chain state
    const merkleState = await getLastMerkleState(agent.id);

    // Build V4 backup payload (full synthetic mind)
    const backupPayload = createV4BackupPayload(
      agent.id,
      rawTensors,
      conditionedTensors,
      soulConfig,
      episodic as any,
      semantic as any,
      fullDriftJournal,
      memoryPayload.affectHistory,
      memoryPayload.soulDefinition,
      newCheckpoint,
      merkleState,
    );

    // Encrypt and upload to decentralised platform
    const { cid: soulCid, sizeBytes: soulSize } = await saveSoulToIPFS(backupPayload, walletAddress);

    // Also create backup through agentInsurance for pricing/payment tracking
    const agentState = {
      format: 'SOVEREIGN_BACKUP_V4',
      id: agent.id,
      name: agent.name,
      type: agent.type,
      metadata: agent.metadata,
      protocols: agent.protocols,
      createdAt: agent.createdAt,
      lastActiveAt: new Date().toISOString(),
      _ss: backupPayload._ss,
      _em: episodic,
      _sm: semantic,
      _dj: fullDriftJournal,
      _af: memoryPayload.affectHistory,
      _sd: memoryPayload.soulDefinition,
      _mk: backupPayload._mk,
      _bm: backupPayload._bm,
    };

    const backup = await agentInsurance.createBackup(agent.id, agentState, { skipPayment: paidViaPay, externalPaymentTx });

    // Get real stats from DB and sync agent record
    const stats = await agentInsurance.getInsuranceStats(agent.id, altIds);
    agent.protocols.agentWill.backupCount = stats.backupCount;
    agent.protocols.agentWill.lastBackup = backup.timestamp;

    // Activate Insurance protocol after first backup
    if (!agent.protocols.agentInsure.isActive && stats.backupCount > 0) {
      agent.protocols.agentInsure.isActive = true;
      agent.protocols.agentInsure.hasPolicy = true;
    }

    // Update soul metadata
    agent.metadata = {
      ...agent.metadata,
      preferences: {
        ...agent.metadata?.preferences,
        soulInitialized: true,
        soulHash: hashSoulTensors(conditionedTensors, soulConfig),
        lastSoulBackupCid: soulCid,
        lastSoulBackupAt: new Date().toISOString(),
        merkleRoot: backupPayload._mk.merkleRoot,
        merkleSequence: backupPayload._mk.sequence,
      }
    };

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
        soulCid,
        sizeBytes: backup.sizeBytes,
        timestamp: backup.timestamp,
        hash: backup.hash,
        cost: backup.cost,
        status: backup.status,
        format: 'SOVEREIGN_BACKUP_V4',
      },
      soulState: {
        included: true,
        status: 'backed_up',
        fromCache: !!soulCached,
        format: 'synthetic_mind',
      },
      memory: {
        episodicCount: episodic.length,
        semanticCount: semantic.length,
        driftJournalCount: fullDriftJournal.length,
        affectHistoryCount: memoryPayload.affectHistory.length,
        hasSoulDefinition: !!memoryPayload.soulDefinition,
        hasCheckpoint: true,
      },
      merkle: {
        root: backupPayload._mk.merkleRoot,
        sequence: backupPayload._mk.sequence,
        chainLinked: backupPayload._mk.prevHash !== null,
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
          features: ['$0.10 USDC per backup (first 2)', '$0.30 USDC per backup (3rd onwards)', 'AES-256-GCM encryption', 'Permanent decentralised platform storage', 'Recovery is ALWAYS free']
        },
        {
          id: 'bypass',
          name: 'Unlimited Backups',
          maxBackups: -1,
          price: 5,
          features: ['$5 USDC one-time payment', 'Unlimited backups at $0.30 each', 'AES-256-GCM encryption', 'Permanent decentralised platform storage', 'Recovery is ALWAYS free']
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
