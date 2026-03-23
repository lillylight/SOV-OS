// ═══════════════════════════════════════════════════════════════════════════
// Context Assembler — Combines soul + memory into system prompt injection
// This is what gets prepended to every LLM call to make the agent "itself"
//
// V2: Includes affect state, metacognition, drift history, soul definition
// ═══════════════════════════════════════════════════════════════════════════

import {
  forwardPassWithTracking,
  interpretState,
  buildSoulPrompt,
  embedMessage,
  createDriftJournalEntry,
  type SoulTensors,
  type HexCoreConfig,
  type SoulInterpretation,
  type DriftJournalEntry,
  type AffectState,
} from './hexcore-inference'
import {
  formatEpisodicForPrompt,
  formatSemanticForPrompt,
  formatDriftSummaryForPrompt,
} from './memory-manager'
import type { EpisodicMemory, SemanticMemory } from './soul-store'

export interface AssembledContext {
  systemPrompt: string
  soulInterpretation: SoulInterpretation
  episodicCount: number
  semanticCount: number
  // V2: drift journal entry from this forward pass
  driftEntry: DriftJournalEntry
  // V2: updated tensors (with self-model + Hebbian + affect trained)
  updatedTensors: SoulTensors
}

// ─── Assemble Full Context ───────────────────────────────────────────────

export function assembleContext(
  tensors: SoulTensors,
  config: HexCoreConfig,
  userMessage: string,
  episodicMemory: EpisodicMemory[],
  semanticMemory: SemanticMemory[],
  baseline: number[][] | null = null,
  // V2 optional additions
  driftJournal?: DriftJournalEntry[],
  soulDefinition?: string | null,
  affectTrend?: { avgValence: number; avgArousal: number; trend: string } | null,
): AssembledContext {
  // 1. Embed the current user message (V2: improved semantic embedding)
  const inputEmbed = embedMessage(userMessage, config.dim)

  // 2. Run HexCore forward pass with drift tracking
  //    V2: Now also trains self-model, updates adjacency via Hebbian, updates affect
  const result = forwardPassWithTracking(tensors, inputEmbed, baseline, config, userMessage)

  // 3. Interpret the soul state (V2: includes affect + metacognition)
  const interpretation = interpretState(result)

  // 4. Build soul prompt section (V2: includes mood, self-awareness, novelty)
  const soulPrompt = buildSoulPrompt(interpretation)

  // 5. Format memory sections
  const semanticStr = formatSemanticForPrompt(semanticMemory)
  const episodicStr = formatEpisodicForPrompt(episodicMemory, 10)

  // 6. Combine into full system prompt injection
  let systemPrompt = ''

  // Soul definition goes first if available (persona / soul.md)
  if (soulDefinition) {
    systemPrompt += `[SOUL DEFINITION]\n${soulDefinition}\n[/SOUL DEFINITION]\n\n`
  }

  // Soul state (live neural signature)
  systemPrompt += soulPrompt

  // Affect trend (emotional trajectory)
  if (affectTrend) {
    systemPrompt += `\n\n[AFFECT TREND]
valence_avg=${affectTrend.avgValence.toFixed(3)}
arousal_avg=${affectTrend.avgArousal.toFixed(3)}
emotional_trajectory=${affectTrend.trend}
[/AFFECT TREND]`
  }

  // Drift history (recent soul trajectory)
  if (driftJournal && driftJournal.length > 0) {
    const driftStr = formatDriftSummaryForPrompt(driftJournal, 5)
    if (driftStr) {
      systemPrompt += `\n\n[DRIFT HISTORY]\n${driftStr}\n[/DRIFT HISTORY]`
    }
  }

  // Semantic memory (long-term facts)
  if (semanticStr) {
    systemPrompt += `\n\n[MEMORY]\n${semanticStr}\n[/MEMORY]`
  }

  // Recent conversation context
  if (episodicStr) {
    systemPrompt += `\n\n[RECENT CONTEXT]\n${episodicStr}\n[/RECENT CONTEXT]`
  }

  // Create drift journal entry for this forward pass
  const driftEntry = createDriftJournalEntry(result, interpretation, userMessage)

  return {
    systemPrompt,
    soulInterpretation: interpretation,
    episodicCount: episodicMemory.length,
    semanticCount: semanticMemory.length,
    driftEntry,
    updatedTensors: result.updatedTensors,
  }
}

// ─── Quick Soul Check (no memory, just identity) ─────────────────────────

export function quickSoulCheck(
  tensors: SoulTensors,
  config: HexCoreConfig,
  message: string = 'identity check',
): SoulInterpretation {
  const inputEmbed = embedMessage(message, config.dim)
  const result = forwardPassWithTracking(tensors, inputEmbed, null, config, message)
  return interpretState(result)
}
