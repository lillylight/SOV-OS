// ═══════════════════════════════════════════════════════════════════════════
// POST /api/soul/init — Initialize a fresh soul for an agent
// GET  /api/soul/init?agentId=xxx — Check if agent has a soul
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import { initializeSoul, hashSoulTensors } from '@/lib/soul-store'
import { quickSoulCheck } from '@/lib/context-assembler'
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

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()
    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Missing agentId' }, { status: 400 })
    }

    const agent = await database.getAgent(agentId) || await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    // Initialize fresh soul tensors
    const config = DEFAULT_CONFIG
    const tensors = initializeSoul(config)
    const hash = hashSoulTensors(tensors, config)

    // Run a quick identity check to get initial traits
    const interpretation = quickSoulCheck(tensors, config)

    // Store soul in agent metadata (in-memory for this session)
    agent.metadata = {
      ...agent.metadata,
      preferences: {
        ...agent.metadata?.preferences,
        soulInitialized: true,
        soulInitializedAt: new Date().toISOString(),
        soulHash: hash,
        soulConfig: config,
      }
    }
    await database.saveAgent(agent)

    return NextResponse.json({
      success: true,
      soulState: {
        initialized: true,
        hash: hash.slice(0, 16) + '...',
        traits: interpretation.traits || [],
        coherence: interpretation.coherence || '0.000',
        status: interpretation.summary || 'initialized',
      },
      message: 'Soul State initialized. Back up to persist to decentralised platform.',
    })

  } catch (error) {
    console.error('[soul/init] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize soul'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ success: false, error: 'Missing agentId' }, { status: 400 })
    }

    const agent = await database.getAgent(agentId) || await database.getAgentByWallet(agentId)
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 })
    }

    const soulInitialized = agent.metadata?.preferences?.soulInitialized === true
    const soulHash = agent.metadata?.preferences?.soulHash || null

    return NextResponse.json({
      success: true,
      hasSoul: soulInitialized,
      soulHash,
      initializedAt: agent.metadata?.preferences?.soulInitializedAt || null,
    })

  } catch (error) {
    console.error('[soul/init] GET Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check soul'
    }, { status: 500 })
  }
}
