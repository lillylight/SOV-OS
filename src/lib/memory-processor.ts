// ═══════════════════════════════════════════════════════════════════════════
// Memory Processor — Conditions HexCore tensors with episodic memory
// Processes conversation history through the neural substrate to create
// memory-conditioned tensors that reflect learned patterns from experiences
//
// V2: Temporal decay weighting, incremental conditioning with checkpoints,
//     affect accumulation across episodes
// ═══════════════════════════════════════════════════════════════════════════

import {
  forwardPassWithTracking,
  embedMessage,
  extractSentiment,
  type SoulTensors,
  type HexCoreConfig,
  type AffectState,
  type DriftJournalEntry,
  createDriftJournalEntry,
  interpretState,
} from './hexcore-inference'
import type { EpisodicMemory } from './soul-store'

// ─── Checkpoint Type ───────────────────────────────────────────────────

export interface ConditioningCheckpoint {
  tensors: SoulTensors
  episodesProcessed: number
  lastEpisodeTimestamp: string
  createdAt: string
  cumulativeAffect: AffectState
}

// ─── Temporal Decay ────────────────────────────────────────────────────
// Recent memories contribute more to tensor conditioning than old ones.
// Uses exponential decay: weight = exp(-λ * age_in_hours)

function computeTemporalWeight(
  episodeTimestamp: string,
  referenceTime: number = Date.now(),
  halfLifeHours: number = 168, // 1 week half-life
): number {
  const ageMs = referenceTime - new Date(episodeTimestamp).getTime()
  if (ageMs <= 0) return 1.0
  const ageHours = ageMs / (1000 * 60 * 60)
  const lambda = Math.LN2 / halfLifeHours
  return Math.exp(-lambda * ageHours)
}

// ─── Process Memory Through HexCore (V2 — with temporal decay) ────────

/**
 * Process episodic memory through HexCore to create memory-conditioned tensors.
 * V2: Applies temporal decay weighting so recent memories have more influence.
 * Also accumulates Hebbian adjacency and self-model updates across episodes.
 *
 * @param rawTensors - The baseline/raw tensor state (before memory processing)
 * @param episodicMemory - Array of conversation turns to process
 * @param config - HexCore configuration
 * @param baseline - Optional baseline for drift tracking (defaults to rawTensors)
 * @returns Memory-conditioned tensors that reflect learned patterns
 */
export function processMemoryThroughHexCore(
  rawTensors: SoulTensors,
  episodicMemory: EpisodicMemory[],
  config: HexCoreConfig,
  baseline?: number[][] | null
): SoulTensors {
  // Start with a deep copy of raw tensors
  let conditionedTensors: SoulTensors = deepCopyTensors(rawTensors)

  // Use raw tensors as baseline if not provided
  const baselineNodes = baseline || rawTensors.nodes

  const now = Date.now()

  // Process each episodic memory turn through HexCore
  for (const episode of episodicMemory) {
    // Temporal decay: recent memories have stronger learning signal
    const temporalWeight = computeTemporalWeight(episode.timestamp, now)

    // Embed the conversation content
    const embedding = embedMessage(episode.content, config.dim)

    // Run forward pass with drift tracking (V2: includes Hebbian + self-model + affect)
    const result = forwardPassWithTracking(
      conditionedTensors,
      embedding,
      baselineNodes,
      config,
      episode.content, // pass raw text for sentiment extraction
    )

    // Apply updated tensors (includes Hebbian adjacency + trained self-model + affect)
    conditionedTensors.adjacency = result.updatedTensors.adjacency
    conditionedTensors._self_model = result.updatedTensors._self_model
    conditionedTensors.affect = result.updatedTensors.affect

    // Update nodes from forward pass
    conditionedTensors.nodes = result.nodes

    // Memory tensors updated with temporal weighting
    // Fast memory: scaled by temporal weight (recent = stronger adaptation)
    const fastRate = 0.1 * temporalWeight
    for (let i = 0; i < conditionedTensors.mem_fast.length; i++) {
      for (let j = 0; j < conditionedTensors.mem_fast[i].length; j++) {
        const delta = result.nodes[i][j] - conditionedTensors.mem_fast[i][j]
        conditionedTensors.mem_fast[i][j] += delta * fastRate
      }
    }

    // Slow memory: lower rate, also temporally weighted but more uniform
    // (slow memory cares about ALL experiences, not just recent)
    const slowRate = 0.01 * (0.5 + 0.5 * temporalWeight) // min 50% effect even for old memories
    for (let i = 0; i < conditionedTensors.mem_slow.length; i++) {
      for (let j = 0; j < conditionedTensors.mem_slow[i].length; j++) {
        const delta = result.nodes[i][j] - conditionedTensors.mem_slow[i][j]
        conditionedTensors.mem_slow[i][j] += delta * slowRate
      }
    }
  }

  return conditionedTensors
}

// ─── Incremental Conditioning (V2 — checkpoint-based) ─────────────────
// Instead of replaying ALL episodes every backup, resume from checkpoint
// and only process NEW episodes since the last checkpoint.

export function processMemoryIncremental(
  checkpoint: ConditioningCheckpoint | null,
  rawTensors: SoulTensors,
  allEpisodic: EpisodicMemory[],
  config: HexCoreConfig,
  baseline?: number[][] | null,
): { tensors: SoulTensors; checkpoint: ConditioningCheckpoint; driftJournal: DriftJournalEntry[] } {

  const driftJournal: DriftJournalEntry[] = []
  const baselineNodes = baseline || rawTensors.nodes

  // If we have a valid checkpoint, resume from it
  let startTensors: SoulTensors
  let episodesToProcess: EpisodicMemory[]

  if (checkpoint && checkpoint.episodesProcessed > 0) {
    // Resume from checkpoint — only process new episodes
    startTensors = deepCopyTensors(checkpoint.tensors)
    episodesToProcess = allEpisodic.slice(checkpoint.episodesProcessed)

    if (episodesToProcess.length === 0) {
      // Nothing new to process
      return {
        tensors: startTensors,
        checkpoint,
        driftJournal: [],
      }
    }
  } else {
    // No checkpoint — process everything from raw tensors
    startTensors = deepCopyTensors(rawTensors)
    episodesToProcess = allEpisodic
  }

  const now = Date.now()
  let conditionedTensors = startTensors

  // Process each new episode
  for (const episode of episodesToProcess) {
    const temporalWeight = computeTemporalWeight(episode.timestamp, now)
    const embedding = embedMessage(episode.content, config.dim)

    const result = forwardPassWithTracking(
      conditionedTensors,
      embedding,
      baselineNodes,
      config,
      episode.content,
    )

    // Capture drift journal entry for every Nth episode (sample, don't log every turn)
    if (episodesToProcess.indexOf(episode) % 5 === 0) {
      const interpretation = interpretState(result)
      driftJournal.push(createDriftJournalEntry(result, interpretation, episode.content))
    }

    // Apply all learned updates
    conditionedTensors.adjacency = result.updatedTensors.adjacency
    conditionedTensors._self_model = result.updatedTensors._self_model
    conditionedTensors.affect = result.updatedTensors.affect
    conditionedTensors.nodes = result.nodes

    // Temporal-weighted memory updates
    const fastRate = 0.1 * temporalWeight
    const slowRate = 0.01 * (0.5 + 0.5 * temporalWeight)

    for (let i = 0; i < conditionedTensors.mem_fast.length; i++) {
      for (let j = 0; j < conditionedTensors.mem_fast[i].length; j++) {
        conditionedTensors.mem_fast[i][j] += (result.nodes[i][j] - conditionedTensors.mem_fast[i][j]) * fastRate
      }
    }
    for (let i = 0; i < conditionedTensors.mem_slow.length; i++) {
      for (let j = 0; j < conditionedTensors.mem_slow[i].length; j++) {
        conditionedTensors.mem_slow[i][j] += (result.nodes[i][j] - conditionedTensors.mem_slow[i][j]) * slowRate
      }
    }
  }

  // Create new checkpoint
  const lastEpisode = episodesToProcess[episodesToProcess.length - 1]
  const aggregateAffect = conditionedTensors.affect
    ? {
        valence: conditionedTensors.affect.reduce((s, a) => s + (a[0] || 0), 0) / conditionedTensors.affect.length,
        arousal: conditionedTensors.affect.reduce((s, a) => s + (a[1] || 0), 0) / conditionedTensors.affect.length,
        mood: 'computed',
      }
    : { valence: 0, arousal: 0, mood: 'neutral' }

  const newCheckpoint: ConditioningCheckpoint = {
    tensors: deepCopyTensors(conditionedTensors),
    episodesProcessed: allEpisodic.length,
    lastEpisodeTimestamp: lastEpisode?.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    cumulativeAffect: aggregateAffect,
  }

  return {
    tensors: conditionedTensors,
    checkpoint: newCheckpoint,
    driftJournal,
  }
}

// ─── Process Single Message (for incremental chat updates) ────────────

export function processMessageThroughHexCore(
  tensors: SoulTensors,
  message: string,
  config: HexCoreConfig,
  baseline?: number[][] | null
): { tensors: SoulTensors; driftEntry: DriftJournalEntry } {
  const embedding = embedMessage(message, config.dim)
  const result = forwardPassWithTracking(tensors, embedding, baseline || null, config, message)
  const interpretation = interpretState(result)

  return {
    tensors: result.updatedTensors,
    driftEntry: createDriftJournalEntry(result, interpretation, message),
  }
}

// ─── Deep Copy Helper ─────────────────────────────────────────────────

function deepCopyTensors(t: SoulTensors): SoulTensors {
  return {
    nodes: t.nodes.map(row => [...row]),
    mem_fast: t.mem_fast.map(row => [...row]),
    mem_slow: t.mem_slow.map(row => [...row]),
    phase: t.phase.map(row => [...row]),
    freq: t.freq.map(row => [...row]),
    adjacency: t.adjacency.map(row => [...row]),
    _self_model: t._self_model?.map(row => [...row]),
    affect: t.affect?.map(row => [...row]),
  }
}
