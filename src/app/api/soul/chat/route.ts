// ═══════════════════════════════════════════════════════════════════════════
// POST /api/soul/chat — Chat with an agent using its soul + memory
// This is the main endpoint that demonstrates the full soul pipeline:
//   1. Load soul (from memory or decentralised platform backup)
//   2. Record user message as episodic memory
//   3. Run HexCore forward pass (V2: with self-model, Hebbian, affect)
//   4. Assemble context (soul + memory + affect + drift → system prompt)
//   5. Update live tensors in cache (self-model trained, adjacency rewired)
//   6. Log drift journal entry + affect state
//   7. Return soul-conditioned response + full mind metrics
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { initializeSoul, getAgentSoul, getAgentMemory } from '@/lib/soul-store'
import type { HexCoreConfig } from '@/lib/hexcore-inference'
import { assembleContext, quickSoulCheck } from '@/lib/context-assembler'
import {
  recordTurn,
  getRecentEpisodic,
  getSemanticFacts,
  loadMemoriesIntoSession,
  distillFromConversation,
  getOrCreateSession,
  getEpisodicCount,
  getSessionData,
  recordDriftEntry,
  recordAffect,
  getDriftJournal,
  getRecentDrift,
  getAffectTrend,
  getSoulDefinition,
} from '@/lib/memory-manager'
import { getSoulCache, setSoulCache, updateCachedTensors } from '@/lib/soul-cache'

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
    const { agentId, message, userId, soulDefinition: incomingSoulDef } = await request.json()

    if (!agentId || !message) {
      return NextResponse.json({ success: false, error: 'Missing agentId or message' }, { status: 400 })
    }

    // 1. Resolve agent
    const agent = await database.getAgent(agentId) || await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    const walletAddress = agent.walletAddress || agent.address || agentId

    // 2. Load or initialize soul
    let cached = getSoulCache(agent.id)
    if (!cached || Date.now() - cached.loadedAt > 3600000) {
      // Cache expired or missing — load from decentralised platform or initialize
      const soulData = await getAgentSoul(agent.id, walletAddress)

      // Also load memories from last backup (V2: includes drift journal, affect, soul definition)
      const memoryData = await getAgentMemory(agent.id, walletAddress)
      if (memoryData.episodic.length > 0 || memoryData.semantic.length > 0 || memoryData.driftJournal.length > 0) {
        loadMemoriesIntoSession(
          agent.id,
          memoryData.episodic,
          memoryData.semantic,
          memoryData.driftJournal,
          memoryData.soulDefinition,
          memoryData.checkpoint,
          memoryData.affectHistory,
        )
      }

      cached = {
        tensors: soulData.tensors,
        config: soulData.config,
        baseline: soulData.isNew ? null : [...soulData.tensors.nodes.map(r => [...r])],
        loadedAt: Date.now(),
        rawTensors: soulData.isNew ? null : {
          ...soulData.tensors,
          nodes: soulData.tensors.nodes.map(r => [...r]),
        },
      }
      setSoulCache(agent.id, cached)
    }

    // 3. Handle soul definition (soul.md) if provided in this request
    if (incomingSoulDef && typeof incomingSoulDef === 'string') {
      const { setSoulDefinition } = await import('@/lib/memory-manager')
      setSoulDefinition(agent.id, incomingSoulDef)
    }

    // 4. Ensure session exists
    const sessionId = getOrCreateSession(agent.id)

    // 5. Record user turn as episodic memory
    recordTurn(agent.id, 'user', message)

    // 6. Get current memory state
    const recentEpisodic = getRecentEpisodic(agent.id, 20)
    const semanticFacts = getSemanticFacts(agent.id)
    const driftJournal = getRecentDrift(agent.id, 10)
    const soulDef = getSoulDefinition(agent.id)
    const affectTrend = getAffectTrend(agent.id, 10)

    // 7. Assemble full context (V2: includes affect, drift history, soul definition)
    const context = assembleContext(
      cached.tensors,
      cached.config,
      message,
      recentEpisodic,
      semanticFacts,
      cached.baseline,
      driftJournal,
      soulDef,
      affectTrend,
    )

    // 8. V2: Update live tensors in cache (self-model trained, adjacency Hebbian-updated, affect updated)
    updateCachedTensors(agent.id, context.updatedTensors)

    // 9. V2: Record drift journal entry
    recordDriftEntry(agent.id, context.driftEntry)

    // 10. V2: Record affect state
    recordAffect(agent.id, context.soulInterpretation.affect)

    // 11. Generate response (simple echo with soul conditioning for now)
    const responseText = generateSoulResponse(message, context.soulInterpretation, semanticFacts)

    // 12. Record assistant turn
    recordTurn(agent.id, 'assistant', responseText)

    // 13. Run distillation every 10 turns
    const turnCount = getEpisodicCount(agent.id)
    if (turnCount % 10 === 0 && turnCount > 0) {
      distillFromConversation(agent.id, getRecentEpisodic(agent.id, 20))
    }

    // 14. Persist memory to DB to prevent dataloss on Vercel Serverless unmounts
    const sessionData = getSessionData(agent.id)
    if (sessionData && agent) {
      agent.memory = {
        ...(agent.memory || { preferences: {} }),
        conversations: (sessionData.episodic || []).map((m: any, i) => ({
          id: m.session_id || `msg_${i}_${Date.now()}`,
          timestamp: m.timestamp,
          content: `[${m.role}] ${m.content}`
        })),
        learnings: (sessionData.semantic || []).map((s: any, i) => ({
          id: `fact_${i}_${Date.now()}`,
          type: 'fact',
          content: `${s.key}: ${s.value}`
        }))
      }
      await database.saveAgent(agent)
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      soulState: {
        signature: context.soulInterpretation.signature,
        coherence: context.soulInterpretation.coherence,
        traits: context.soulInterpretation.traits,
        status: context.soulInterpretation.summary,
        // V2: new mind metrics
        mood: context.soulInterpretation.affect.mood,
        valence: context.soulInterpretation.affect.valence,
        arousal: context.soulInterpretation.affect.arousal,
        selfAwareness: context.soulInterpretation.metacognition.selfAwareness,
        predictionError: context.soulInterpretation.metacognition.predictionError,
        novelty: context.soulInterpretation.metacognition.novelty,
      },
      memory: {
        episodicCount: context.episodicCount,
        semanticCount: context.semanticCount,
        sessionId,
        turnCount,
        // V2: additional memory metrics
        driftJournalCount: getDriftJournal(agent.id).length,
        affectTrend,
      },
      systemPrompt: context.systemPrompt,
    })

  } catch (error) {
    console.error('[soul/chat] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed'
    }, { status: 500 })
  }
}

// ─── Simple Response Generator (no LLM — demonstrates soul conditioning) ─

function generateSoulResponse(
  userMessage: string,
  soul: import('@/lib/hexcore-inference').SoulInterpretation,
  facts: import('@/lib/soul-store').SemanticMemory[],
): string {
  const traits = soul.traits
  const energy = soul.energy
  const coherence = parseFloat(soul.coherence)
  const mood = soul.affect.mood
  const awareness = soul.metacognition.selfAwareness

  // Adjust tone based on soul traits + mood
  let prefix = ''
  if (mood === 'excited' || mood === 'engaged') prefix = 'That sparks something! '
  else if (mood === 'melancholic' || mood === 'tense') prefix = 'I sense some weight here. '
  else if (traits.includes('formal')) prefix = 'I appreciate your question. '
  else if (traits.includes('casual')) prefix = 'Hey! '
  else if (traits.includes('analytical')) prefix = 'Let me think about this. '
  else if (traits.includes('creative')) prefix = 'That sparks an interesting thought. '
  else prefix = ''

  // Check if we know user facts
  const userNameFact = facts.find(f => f.key === 'user_fact:name')
  const nameGreeting = userNameFact ? `, ${userNameFact.value}` : ''

  // Energy affects verbosity, awareness affects depth
  let response: string
  if (energy > 0.5) {
    response = `${prefix}I'm processing your message with high energy${nameGreeting}. `
    response += `My soul traits are [${traits.join(', ')}] with coherence ${coherence.toFixed(2)}. `
    response += `Current mood: ${mood}, self-awareness: ${(awareness * 100).toFixed(0)}%. `
    response += `I received: "${userMessage.slice(0, 100)}". `
    response += `This is a soul-conditioned response — in production, this would be an LLM call with my full synthetic mind injected as the system prompt.`
  } else {
    response = `${prefix}Acknowledged${nameGreeting}. `
    response += `Soul: [${traits.slice(0, 3).join(', ')}], coherence: ${coherence.toFixed(2)}, mood: ${mood}. `
    response += `I heard you. In production, my full mind state would condition the LLM's response.`
  }

  return response
}
