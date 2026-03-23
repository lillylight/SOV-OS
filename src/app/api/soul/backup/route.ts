// ═══════════════════════════════════════════════════════════════════════════
// POST /api/soul/backup — Create V4 synthetic mind backup on decentralised platform
// GET  /api/soul/backup?agentId=xxx — Get latest soul backup info
// V2: Full synthetic mind backup with drift journal, affect, soul.md, Merkle chain
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { agentInsurance } from '@/lib/agentInsurance'
import {
  initializeSoul,
  hashSoulTensors,
  createV4BackupPayload,
  saveSoulToIPFS,
  getLastMerkleState,
} from '@/lib/soul-store'
import {
  prepareMemoryForBackup,
  getEpisodicCount,
  getSemanticFacts,
  setConditioningCheckpoint,
} from '@/lib/memory-manager'
import { processMemoryIncremental } from '@/lib/memory-processor'
import { getSoulCache } from '@/lib/soul-cache'
import type { HexCoreConfig } from '@/lib/hexcore-inference'

const DEFAULT_CONFIG: HexCoreConfig = {
  num_nodes: 32,
  dim: 64,
  steps: 12,
  k: 8,
  mem_strength_fast: 0.3,
  mem_strength_slow: 0.7,
  phase_coupling: 0.15,
  pred_learning_rate: 0.01,
  hebbian_rate: 0.005,
  hebbian_decay: 0.001,
  affect_momentum: 0.85,
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, paymentTx, soulDefinition: incomingSoulDef } = await request.json()

    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Missing agentId' }, { status: 400 })
    }

    // 1. Resolve agent
    let agent = await database.getAgent(agentId)
    if (!agent) agent = await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    const walletAddress = agent.walletAddress || agent.address || agentId

    // 2. Check backup permission (pricing, plan limits)
    const altIds = [agent.walletAddress, agent.address, agentId].filter(Boolean) as string[]
    const { canBackup, reason, plan } = await agentInsurance.canCreateBackup(agent.id, altIds)
    if (!canBackup) {
      return NextResponse.json({ success: false, error: reason, currentPlan: plan }, { status: 400 })
    }

    // 3. Get soul tensors (from cache or initialize)
    const soulCached = getSoulCache(agent.id)
    const config = soulCached?.config || (agent.metadata?.preferences?.soulConfig as HexCoreConfig) || DEFAULT_CONFIG
    const rawTensors = soulCached?.rawTensors || soulCached?.tensors || initializeSoul(config)
    const liveTensors = soulCached?.tensors || rawTensors
    const baseline = soulCached?.baseline || rawTensors.nodes

    // 4. Gather all memory from current session (V2: includes drift journal, affect, soul def, checkpoint)
    const memoryPayload = prepareMemoryForBackup(agent.id)

    // Handle incoming soul definition
    if (incomingSoulDef) {
      memoryPayload.soulDefinition = incomingSoulDef
    }

    // 5. V2: Incremental conditioning — only process new episodes since last checkpoint
    const { tensors: conditionedTensors, checkpoint: newCheckpoint, driftJournal: processingDriftJournal } =
      processMemoryIncremental(
        memoryPayload.conditioningCheckpoint,
        rawTensors,
        memoryPayload.episodic,
        config,
        baseline,
      )

    // Save the checkpoint for next backup
    setConditioningCheckpoint(agent.id, newCheckpoint)

    // Merge drift journal entries from conditioning into the backup
    const fullDriftJournal = [...memoryPayload.driftJournal, ...processingDriftJournal]

    // 6. V2: Get Merkle chain state
    const merkleState = await getLastMerkleState(agent.id)

    // 7. Create V4 backup payload (full synthetic mind)
    const backupPayload = createV4BackupPayload(
      agent.id,
      rawTensors,
      conditionedTensors,
      config,
      memoryPayload.episodic,
      memoryPayload.semantic,
      fullDriftJournal,
      memoryPayload.affectHistory,
      memoryPayload.soulDefinition,
      newCheckpoint,
      merkleState,
    )

    // 8. Encrypt and upload to decentralised platform
    const { cid, sizeBytes } = await saveSoulToIPFS(backupPayload, walletAddress)

    // 9. Create backup record through agentInsurance for pricing/payment
    const soulHash = hashSoulTensors(conditionedTensors, config)
    const agentState = {
      format: 'SOVEREIGN_BACKUP_V4',
      id: agent.id,
      name: agent.name,
      type: agent.type,
      metadata: agent.metadata,
      protocols: agent.protocols,
      createdAt: agent.createdAt,
      lastActiveAt: agent.lastActiveAt,
      soulCid: cid,
      soulHash,
      backupType: 'synthetic_mind',
      merkleRoot: backupPayload._mk.merkleRoot,
      merkleSequence: backupPayload._mk.sequence,
    }

    const backupRecord = await agentInsurance.createBackup(agent.id, agentState, {
      skipPayment: !!paymentTx,
      externalPaymentTx: paymentTx || null,
    })

    // 10. Update agent metadata with soul info
    agent.metadata = {
      ...agent.metadata,
      preferences: {
        ...agent.metadata?.preferences,
        soulInitialized: true,
        soulHash,
        lastSoulBackupCid: cid,
        lastSoulBackupAt: new Date().toISOString(),
        merkleRoot: backupPayload._mk.merkleRoot,
        merkleSequence: backupPayload._mk.sequence,
      }
    }
    await database.saveAgent(agent)

    // 11. Get updated stats
    const stats = await agentInsurance.getInsuranceStats(agent.id, altIds)

    return NextResponse.json({
      success: true,
      backup: {
        id: backupRecord.id,
        ipfsCid: backupRecord.ipfsCid,
        soulCid: cid,
        soulHash,
        sizeBytes,
        timestamp: backupRecord.timestamp,
        cost: backupRecord.cost,
        status: backupRecord.status,
        format: 'SOVEREIGN_BACKUP_V4',
        backupType: 'synthetic_mind',
        episodicCount: memoryPayload.episodic.length,
        semanticCount: memoryPayload.semantic.length,
        driftJournalCount: fullDriftJournal.length,
        affectHistoryCount: memoryPayload.affectHistory.length,
        hasSoulDefinition: !!memoryPayload.soulDefinition,
        hasCheckpoint: true,
        merkle: {
          root: backupPayload._mk.merkleRoot,
          sequence: backupPayload._mk.sequence,
          chainLinked: backupPayload._mk.prevHash !== null,
        },
      },
      stats,
      plan,
    })

  } catch (error) {
    console.error('[soul/backup] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Soul backup failed'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Missing agentId' }, { status: 400 })
    }

    let agent = await database.getAgent(agentId)
    if (!agent) agent = await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    const hasSoul = agent.metadata?.preferences?.soulInitialized === true
    const lastCid = agent.metadata?.preferences?.lastSoulBackupCid || null
    const lastHash = agent.metadata?.preferences?.soulHash || null
    const lastBackupAt = agent.metadata?.preferences?.lastSoulBackupAt || null
    const merkleRoot = agent.metadata?.preferences?.merkleRoot || null
    const merkleSequence = agent.metadata?.preferences?.merkleSequence || 0

    return NextResponse.json({
      success: true,
      hasSoul,
      lastSoulBackupCid: lastCid,
      soulHash: lastHash,
      lastBackupAt,
      merkle: {
        root: merkleRoot,
        sequence: merkleSequence,
      },
    })

  } catch (error) {
    console.error('[soul/backup] GET Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check soul backup'
    }, { status: 500 })
  }
}
