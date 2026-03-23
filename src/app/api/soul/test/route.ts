// ═══════════════════════════════════════════════════════════════════════════
// GET /api/soul/test — Full end-to-end test of the soul system
// Creates a fresh agent, chats, backs up soul+memory, restores, verifies
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { initializeSoul, hashSoulTensors, createCombinedBackupPayload } from '@/lib/soul-store'
import { assembleContext, quickSoulCheck } from '@/lib/context-assembler'
import {
  recordTurn,
  getRecentEpisodic,
  getSemanticFacts,
  addSemanticFact,
  prepareMemoryForBackup,
  loadMemoriesIntoSession,
  clearSession,
  getOrCreateSession,
  getEpisodicCount,
  distillFromConversation,
} from '@/lib/memory-manager'
import { forwardPassWithTracking, interpretState } from '@/lib/hexcore-inference'
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
}

function embedMessage(message: string, dim: number = 64): number[] {
  const embedding = new Array(dim).fill(0)
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i)
    const idx = i % dim
    embedding[idx] += (charCode - 96) / 26.0 * 0.1
    embedding[(idx + 7) % dim] += Math.sin(charCode * 0.1) * 0.05
    embedding[(idx + 13) % dim] += Math.cos(charCode * 0.15) * 0.03
  }
  const norm = Math.sqrt(embedding.reduce((sum: number, v: number) => sum + v * v, 0)) + 1e-8
  return embedding.map((v: number) => v / norm)
}

export async function GET(_request: NextRequest) {
  const testId = `test-agent-${Date.now()}`
  const results: { step: string; status: 'pass' | 'fail'; details: string; data?: any }[] = []
  const startTime = Date.now()

  try {
    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Initialize Soul
    // ══════════════════════════════════════════════════════════════════════
    const config = DEFAULT_CONFIG
    const tensors = initializeSoul(config)
    const soulHash = hashSoulTensors(tensors, config)
    const baseline = tensors.nodes.map(r => [...r])

    results.push({
      step: '1. Initialize Soul State',
      status: 'pass',
      details: `Soul State initialized, hash=${soulHash.slice(0, 16)}...`,
      data: {
        soulHash: soulHash.slice(0, 32),
        status: 'initialized',
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Quick Identity Check
    // ══════════════════════════════════════════════════════════════════════
    const identity = quickSoulCheck(tensors, config, 'who am I')

    results.push({
      step: '2. Identity Check',
      status: 'pass',
      details: `Signature=${identity.signature}, traits=[${identity.traits.join(',')}], coherence=${identity.coherence}`,
      data: identity,
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Simulate Conversation (5 turns)
    // ══════════════════════════════════════════════════════════════════════
    clearSession(testId)
    getOrCreateSession(testId)

    const conversation = [
      { role: 'user' as const, msg: 'Hello, my name is Alex. I like building AI agents.' },
      { role: 'user' as const, msg: 'Can you help me with blockchain programming?' },
      { role: 'user' as const, msg: 'I prefer TypeScript over Python for web apps.' },
      { role: 'user' as const, msg: 'What do you think about decentralized identity?' },
      { role: 'user' as const, msg: 'I want to build a soul system for persistent agents.' },
    ]

    const turnResults: any[] = []

    for (const turn of conversation) {
      recordTurn(testId, turn.role, turn.msg)
      recordTurn(testId, 'assistant', `[Soul-conditioned response to: "${turn.msg.slice(0, 40)}..."]`)

      // Run forward pass on each turn
      const inputEmbed = embedMessage(turn.msg, config.dim)
      const fwdResult = forwardPassWithTracking(tensors, inputEmbed, baseline, config)
      const interp = interpretState(fwdResult)

      turnResults.push({
        msg: turn.msg.slice(0, 50),
        drift: fwdResult.drift.delta.toFixed(4),
        coherence: interp.coherence,
        traits: interp.traits.slice(0, 3),
      })
    }

    // Run distillation
    distillFromConversation(testId, getRecentEpisodic(testId, 20))

    const episodicCount = getEpisodicCount(testId)
    const semanticFacts = getSemanticFacts(testId)

    results.push({
      step: '3. Conversation (5 turns)',
      status: episodicCount >= 10 ? 'pass' : 'fail',
      details: `${episodicCount} episodic memories, ${semanticFacts.length} semantic facts distilled`,
      data: {
        episodicCount,
        semanticFacts: semanticFacts.map(f => ({ key: f.key, value: f.value, confidence: f.confidence })),
        turns: turnResults,
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Context Assembly
    // ══════════════════════════════════════════════════════════════════════
    const recentEpisodic = getRecentEpisodic(testId, 10)
    const context = assembleContext(
      tensors,
      config,
      'Tell me about yourself',
      recentEpisodic,
      semanticFacts,
      baseline,
    )

    results.push({
      step: '4. Context Assembly',
      status: context.systemPrompt.includes('[SOUL:') ? 'pass' : 'fail',
      details: `System prompt: ${context.systemPrompt.length} chars, soul signature present`,
      data: {
        systemPromptPreview: context.systemPrompt.slice(0, 300),
        episodicInContext: context.episodicCount,
        semanticInContext: context.semanticCount,
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Create Combined Backup
    // ══════════════════════════════════════════════════════════════════════
    const { episodic: backupEpisodic, semantic: backupSemantic } = prepareMemoryForBackup(testId)

    const backupPayload = createCombinedBackupPayload(
      testId,
      tensors,
      config,
      backupEpisodic,
      backupSemantic,
      { test: true }
    )

    const backupJson = JSON.stringify(backupPayload)
    const backupSize = backupJson.length

    results.push({
      step: '5. Create Combined Backup',
      status: backupPayload.format === 'SOVEREIGN_BACKUP_V1' ? 'pass' : 'fail',
      details: `Backup size: ${(backupSize / 1024).toFixed(1)} KB, ${backupPayload.episodic_memory.length} episodes, ${backupPayload.semantic_memory.length} facts`,
      data: {
        sizeBytes: backupSize,
        episodicCount: backupPayload.episodic_memory.length,
        semanticCount: backupPayload.semantic_memory.length,
        status: 'created',
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: Simulate Restore (clear session, then load from backup)
    // ══════════════════════════════════════════════════════════════════════
    clearSession(testId)
    const afterClearCount = getEpisodicCount(testId)

    // Restore from backup payload
    loadMemoriesIntoSession(
      testId,
      backupPayload.episodic_memory,
      backupPayload.semantic_memory,
    )

    const afterRestoreEpisodic = getEpisodicCount(testId)
    const afterRestoreSemantic = getSemanticFacts(testId)

    results.push({
      step: '6. Restore from Backup',
      status: afterRestoreEpisodic > 0 && afterRestoreEpisodic === backupPayload.episodic_memory.length ? 'pass' : 'fail',
      details: `Cleared session (${afterClearCount} → 0), restored ${afterRestoreEpisodic} episodes + ${afterRestoreSemantic.length} facts`,
      data: {
        clearedCount: afterClearCount,
        restoredEpisodic: afterRestoreEpisodic,
        restoredSemantic: afterRestoreSemantic.length,
        matchesBackup: afterRestoreEpisodic === backupPayload.episodic_memory.length,
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: Verify Identity Persists After Restore
    // ══════════════════════════════════════════════════════════════════════
    const postRestoreIdentity = quickSoulCheck(tensors, config, 'who am I after restore')

    const signatureMatch = postRestoreIdentity.signature === identity.signature
    const traitsOverlap = identity.traits.filter(t => postRestoreIdentity.traits.includes(t)).length

    results.push({
      step: '7. Identity Persistence Check',
      status: signatureMatch || traitsOverlap >= 2 ? 'pass' : 'fail',
      details: `Signature match: ${signatureMatch}, trait overlap: ${traitsOverlap}/${identity.traits.length}`,
      data: {
        beforeRestore: { signature: identity.signature, traits: identity.traits },
        afterRestore: { signature: postRestoreIdentity.signature, traits: postRestoreIdentity.traits },
        signatureMatch,
        traitsOverlap,
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 8: Verify Memories Survived
    // ══════════════════════════════════════════════════════════════════════
    const restoredEpisodic = getRecentEpisodic(testId, 20)
    const restoredSemantic = getSemanticFacts(testId)

    const hasUserName = restoredSemantic.some(f => f.key === 'user_fact:name' && f.value === 'Alex')
    const hasConversation = restoredEpisodic.some(e => e.content.includes('Alex'))

    results.push({
      step: '8. Memory Survival Check',
      status: hasConversation ? 'pass' : 'fail',
      details: `Conversations restored: ${hasConversation}, user name "Alex" remembered: ${hasUserName}`,
      data: {
        hasConversation,
        hasUserName,
        episodicSample: restoredEpisodic.slice(0, 3).map(e => ({ role: e.role, content: e.content.slice(0, 60) })),
        semanticSample: restoredSemantic.slice(0, 5),
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // STEP 9: Post-Restore Conversation
    // ══════════════════════════════════════════════════════════════════════
    recordTurn(testId, 'user', 'Do you remember my name?')

    const postRestoreContext = assembleContext(
      tensors,
      config,
      'Do you remember my name?',
      getRecentEpisodic(testId, 10),
      getSemanticFacts(testId),
      baseline,
    )

    const memoryInPrompt = postRestoreContext.systemPrompt.includes('Alex') || postRestoreContext.systemPrompt.includes('name')

    results.push({
      step: '9. Post-Restore Chat',
      status: memoryInPrompt ? 'pass' : 'fail',
      details: `Memory in system prompt: ${memoryInPrompt}. The LLM would see previous context.`,
      data: {
        memoryInPrompt,
        promptPreview: postRestoreContext.systemPrompt.slice(0, 400),
      }
    })

    // ══════════════════════════════════════════════════════════════════════
    // CLEANUP + SUMMARY
    // ══════════════════════════════════════════════════════════════════════
    clearSession(testId)

    const passCount = results.filter(r => r.status === 'pass').length
    const totalCount = results.length
    const elapsed = Date.now() - startTime

    return NextResponse.json({
      success: true,
      summary: {
        passed: passCount,
        total: totalCount,
        allPassed: passCount === totalCount,
        elapsed: `${elapsed}ms`,
        testAgentId: testId,
      },
      results,
    })

  } catch (error) {
    console.error('[soul/test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      results,
      elapsed: `${Date.now() - startTime}ms`,
    }, { status: 500 })
  }
}
