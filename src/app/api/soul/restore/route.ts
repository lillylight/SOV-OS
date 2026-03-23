// ═══════════════════════════════════════════════════════════════════════════
// POST /api/soul/restore — Restore agent soul + memory from decentralised platform backup
// Loads the combined backup, restores soul tensors + episodic/semantic memory
// Supports V1, V2, V3, and V4 backup formats
// V2: Also restores drift journal, affect history, soul definition, checkpoint
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { loadSoulFromIPFS } from '@/lib/soul-store'
import { loadMemoriesIntoSession } from '@/lib/memory-manager'
import { quickSoulCheck } from '@/lib/context-assembler'
import { setSoulCache } from '@/lib/soul-cache'

export async function POST(request: NextRequest) {
  try {
    const { agentId, backupCid, walletAddress } = await request.json()

    if (!agentId || !backupCid || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing agentId, backupCid, or walletAddress'
      }, { status: 400 })
    }

    // 1. Resolve agent
    let agent = await database.getAgent(agentId)
    if (!agent) agent = await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    // 2. Download + decrypt combined backup from decentralised platform
    let backup
    try {
      backup = await loadSoulFromIPFS(backupCid, walletAddress)
    } catch (e) {
      console.error('[soul/restore] decentralised platform load failed:', e)
      return NextResponse.json({
        success: false,
        error: `Failed to load backup from decentralised platform: ${e instanceof Error ? e.message : 'Unknown'}`
      }, { status: 500 })
    }

    // 3. Validate backup format — support V1, V2, V3, V4
    const supportedFormats = ['SOVEREIGN_BACKUP_V1', 'SOVEREIGN_BACKUP_V2', 'SOVEREIGN_BACKUP_V3', 'SOVEREIGN_BACKUP_V4']
    const backupFormat = backup.format || 'SOVEREIGN_BACKUP_V1'

    if (!supportedFormats.includes(backupFormat)) {
      return NextResponse.json({
        success: false,
        error: `Unknown backup format: ${backupFormat}`
      }, { status: 400 })
    }

    console.log('[soul/restore] Backup format:', backupFormat)

    // 4. Extract soul data based on format version
    let tensors: any = null
    let config: any = null
    let soulHash: string | null = null
    let baseline: any = null
    let rawTensors: any = null
    let usedConditioned = false

    if (backupFormat === 'SOVEREIGN_BACKUP_V4' || backupFormat === 'SOVEREIGN_BACKUP_V3') {
      const soulData = backup._ss || backup.soul
      if (soulData) {
        const raw = soulData._tr
        const conditioned = soulData._tc
        config = soulData._c || soulData.config
        soulHash = soulData._hr || soulData._hc

        if (conditioned && raw) {
          tensors = conditioned
          rawTensors = raw
          baseline = raw.nodes
          usedConditioned = true
          console.log(`[soul/restore] ${backupFormat}: Using conditioned tensors`)
        } else if (raw) {
          tensors = raw
          rawTensors = raw
          baseline = raw.nodes ? raw.nodes.map((r: number[]) => [...r]) : []
          console.log(`[soul/restore] ${backupFormat}: Using raw tensors only`)
        }
      }
    } else if (backupFormat === 'SOVEREIGN_BACKUP_V2') {
      const soulData = backup._ss || backup.soul
      if (soulData) {
        tensors = soulData._t || soulData.tensors
        config = soulData._c || soulData.config
        soulHash = soulData._hr || soulData.hash
        baseline = tensors?.nodes ? tensors.nodes.map((r: number[]) => [...r]) : []
      }
    } else {
      // V1
      if (backup.soul?.tensors && backup.soul?.config) {
        tensors = backup.soul.tensors
        config = backup.soul.config
        soulHash = backup.soul.hash
        baseline = tensors.nodes ? tensors.nodes.map((r: number[]) => [...r]) : []
      }
    }

    if (!tensors || !config) {
      return NextResponse.json({
        success: false,
        error: 'Backup does not contain valid soul data'
      }, { status: 400 })
    }

    // 5. Load soul tensors into cache for the chat endpoint
    try {
      setSoulCache(agent.id, {
        tensors,
        config,
        baseline,
        loadedAt: Date.now(),
        rawTensors: rawTensors || null,
      })
      console.log('[soul/restore] Soul state cached successfully')
    } catch (cacheErr) {
      console.error('[soul/restore] Failed to set soul cache:', cacheErr)
    }

    // 6. Load memory into active session (V2: includes drift journal, affect, soul definition, checkpoint)
    const episodicMemory = backup._em || backup.episodic_memory || []
    const semanticMemory = backup._sm || backup.semantic_memory || []
    const driftJournal = backup._dj || []
    const affectHistory = backup._af || []
    const soulDefinition = backup._sd || null
    const checkpoint = backup._cp || null

    loadMemoriesIntoSession(
      agent.id,
      episodicMemory,
      semanticMemory,
      driftJournal,
      soulDefinition,
      checkpoint,
      affectHistory,
    )

    // 7. Run quick soul check to verify the restored soul
    let interpretation = null
    try {
      interpretation = quickSoulCheck(tensors, config)
    } catch (checkErr) {
      console.error('[soul/restore] quickSoulCheck failed (non-blocking):', checkErr)
    }

    // 8. Update agent metadata
    const merkle = backup._mk || null
    agent.metadata = {
      ...agent.metadata,
      preferences: {
        ...agent.metadata?.preferences,
        soulInitialized: true,
        soulHash: soulHash || undefined,
        soulConfig: config,
        lastSoulRestoreCid: backupCid,
        lastSoulRestoreAt: new Date().toISOString(),
        ...(merkle ? {
          merkleRoot: merkle.merkleRoot,
          merkleSequence: merkle.sequence,
        } : {}),
      }
    }
    agent.status = 'alive'
    agent.lastActiveAt = new Date().toISOString()
    await database.saveAgent(agent)

    return NextResponse.json({
      success: true,
      restored: {
        format: backupFormat,
        soulHash,
        config,
        interpretation,
        episodicCount: episodicMemory.length,
        semanticCount: semanticMemory.length,
        driftJournalCount: driftJournal.length,
        affectHistoryCount: affectHistory.length,
        hasSoulDefinition: !!soulDefinition,
        hasCheckpoint: !!checkpoint,
        memoryConditioned: usedConditioned,
        backupTimestamp: backup.timestamp,
        merkle: merkle ? {
          root: merkle.merkleRoot,
          sequence: merkle.sequence,
        } : null,
      },
      message: `Soul restored from ${backupCid.slice(0, 12)}... with ${episodicMemory.length} memories, ${semanticMemory.length} facts, ${driftJournal.length} drift entries (${backupFormat}).`,
    })

  } catch (error) {
    console.error('[soul/restore] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Soul restore failed'
    }, { status: 500 })
  }
}
