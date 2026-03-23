// ═══════════════════════════════════════════════════════════════════════════
// Memory Manager — Capture conversations + distill semantic facts
// All data stays in-memory during session, then gets bundled into
// the combined encrypted backup on decentralised platform when backup is triggered.
//
// V2: LLM-assisted distillation, drift journal storage, soul definition capture
// ═══════════════════════════════════════════════════════════════════════════

export type { EpisodicMemory, SemanticMemory } from './soul-store'
import type { EpisodicMemory, SemanticMemory } from './soul-store'
import type { DriftJournalEntry, AffectState } from './hexcore-inference'
import type { ConditioningCheckpoint } from './memory-processor'

// ─── In-Memory Session Store ─────────────────────────────────────────────
// Holds current session's conversations before they get backed up

const agentSessions: Map<string, {
  episodic: EpisodicMemory[]
  semantic: SemanticMemory[]
  sessionId: string
  startedAt: string
  // V2 additions
  driftJournal: DriftJournalEntry[]
  soulDefinition: string | null    // soul.md / system prompt text
  conditioningCheckpoint: ConditioningCheckpoint | null
  affectHistory: AffectState[]     // rolling window of affect samples
}> = new Map()

const MAX_EPISODIC_PER_BACKUP = 1000
const MAX_SEMANTIC_PER_BACKUP = 200
const MAX_DRIFT_JOURNAL_PER_BACKUP = 500
const MAX_AFFECT_HISTORY = 100

// ─── Session Management ──────────────────────────────────────────────────

export function getOrCreateSession(agentId: string): string {
  if (!agentSessions.has(agentId)) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    agentSessions.set(agentId, {
      episodic: [],
      semantic: [],
      sessionId,
      startedAt: new Date().toISOString(),
      driftJournal: [],
      soulDefinition: null,
      conditioningCheckpoint: null,
      affectHistory: [],
    })
    return sessionId
  }
  return agentSessions.get(agentId)!.sessionId
}

export function getSessionData(agentId: string) {
  return agentSessions.get(agentId) || null
}

export function clearSession(agentId: string) {
  agentSessions.delete(agentId)
}

// ─── Episodic Memory (conversation turns) ────────────────────────────────

export function recordTurn(
  agentId: string,
  role: 'user' | 'assistant',
  content: string,
): EpisodicMemory {
  const sessionId = getOrCreateSession(agentId)
  const session = agentSessions.get(agentId)!

  const memory: EpisodicMemory = {
    role,
    content,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
  }

  session.episodic.push(memory)

  // Keep under max limit (rolling window — drop oldest)
  if (session.episodic.length > MAX_EPISODIC_PER_BACKUP) {
    session.episodic = session.episodic.slice(-MAX_EPISODIC_PER_BACKUP)
  }

  return memory
}

export function getRecentEpisodic(agentId: string, limit: number = 20): EpisodicMemory[] {
  const session = agentSessions.get(agentId)
  if (!session) return []
  return session.episodic.slice(-limit)
}

export function getEpisodicCount(agentId: string): number {
  return agentSessions.get(agentId)?.episodic.length || 0
}

// ─── Semantic Memory (distilled facts) ───────────────────────────────────

export function addSemanticFact(
  agentId: string,
  key: string,
  value: string,
  confidence: number = 1.0,
): SemanticMemory {
  const session = agentSessions.get(agentId)
  if (!session) {
    getOrCreateSession(agentId)
    return addSemanticFact(agentId, key, value, confidence)
  }

  // Upsert: replace if same key exists
  const existingIdx = session.semantic.findIndex(s => s.key === key)
  const fact: SemanticMemory = { key, value, confidence }

  if (existingIdx >= 0) {
    session.semantic[existingIdx] = fact
  } else {
    session.semantic.push(fact)
  }

  // Keep under max
  if (session.semantic.length > MAX_SEMANTIC_PER_BACKUP) {
    // Drop lowest confidence
    session.semantic.sort((a, b) => b.confidence - a.confidence)
    session.semantic = session.semantic.slice(0, MAX_SEMANTIC_PER_BACKUP)
  }

  return fact
}

export function getSemanticFacts(agentId: string): SemanticMemory[] {
  return agentSessions.get(agentId)?.semantic || []
}

// ─── Drift Journal ──────────────────────────────────────────────────────

export function recordDriftEntry(agentId: string, entry: DriftJournalEntry): void {
  const session = agentSessions.get(agentId)
  if (!session) {
    getOrCreateSession(agentId)
    return recordDriftEntry(agentId, entry)
  }

  session.driftJournal.push(entry)

  // Rolling window
  if (session.driftJournal.length > MAX_DRIFT_JOURNAL_PER_BACKUP) {
    session.driftJournal = session.driftJournal.slice(-MAX_DRIFT_JOURNAL_PER_BACKUP)
  }
}

export function getDriftJournal(agentId: string): DriftJournalEntry[] {
  return agentSessions.get(agentId)?.driftJournal || []
}

export function getRecentDrift(agentId: string, limit: number = 20): DriftJournalEntry[] {
  const journal = agentSessions.get(agentId)?.driftJournal || []
  return journal.slice(-limit)
}

// ─── Affect History ─────────────────────────────────────────────────────

export function recordAffect(agentId: string, affect: AffectState): void {
  const session = agentSessions.get(agentId)
  if (!session) {
    getOrCreateSession(agentId)
    return recordAffect(agentId, affect)
  }

  session.affectHistory.push(affect)
  if (session.affectHistory.length > MAX_AFFECT_HISTORY) {
    session.affectHistory = session.affectHistory.slice(-MAX_AFFECT_HISTORY)
  }
}

export function getAffectHistory(agentId: string): AffectState[] {
  return agentSessions.get(agentId)?.affectHistory || []
}

export function getAffectTrend(agentId: string, window: number = 10): { avgValence: number; avgArousal: number; trend: string } {
  const history = getAffectHistory(agentId).slice(-window)
  if (history.length === 0) return { avgValence: 0, avgArousal: 0, trend: 'neutral' }

  const avgValence = history.reduce((s, a) => s + a.valence, 0) / history.length
  const avgArousal = history.reduce((s, a) => s + a.arousal, 0) / history.length

  // Trend: compare first half to second half
  const mid = Math.floor(history.length / 2)
  if (mid === 0) return { avgValence, avgArousal, trend: 'stable' }

  const firstHalf = history.slice(0, mid)
  const secondHalf = history.slice(mid)
  const firstV = firstHalf.reduce((s, a) => s + a.valence, 0) / firstHalf.length
  const secondV = secondHalf.reduce((s, a) => s + a.valence, 0) / secondHalf.length
  const delta = secondV - firstV

  let trend = 'stable'
  if (delta > 0.15) trend = 'improving'
  else if (delta < -0.15) trend = 'declining'

  return { avgValence, avgArousal, trend }
}

// ─── Soul Definition (soul.md / system prompt capture) ──────────────────

export function setSoulDefinition(agentId: string, definition: string): void {
  const session = agentSessions.get(agentId)
  if (!session) {
    getOrCreateSession(agentId)
    return setSoulDefinition(agentId, definition)
  }
  session.soulDefinition = definition
}

export function getSoulDefinition(agentId: string): string | null {
  return agentSessions.get(agentId)?.soulDefinition || null
}

// ─── Conditioning Checkpoint ────────────────────────────────────────────

export function setConditioningCheckpoint(agentId: string, checkpoint: ConditioningCheckpoint): void {
  const session = agentSessions.get(agentId)
  if (!session) {
    getOrCreateSession(agentId)
    return setConditioningCheckpoint(agentId, checkpoint)
  }
  session.conditioningCheckpoint = checkpoint
}

export function getConditioningCheckpoint(agentId: string): ConditioningCheckpoint | null {
  return agentSessions.get(agentId)?.conditioningCheckpoint || null
}

// ─── Load Memories from Previous Backup ──────────────────────────────────
// Called when restoring or starting a new session from a backup

export function loadMemoriesIntoSession(
  agentId: string,
  episodic: EpisodicMemory[],
  semantic: SemanticMemory[],
  driftJournal?: DriftJournalEntry[],
  soulDefinition?: string | null,
  checkpoint?: ConditioningCheckpoint | null,
  affectHistory?: AffectState[],
) {
  const sessionId = getOrCreateSession(agentId)
  const session = agentSessions.get(agentId)!

  // Merge previous memories with current session
  session.episodic = [...episodic.slice(-MAX_EPISODIC_PER_BACKUP)]
  session.semantic = [...semantic.slice(0, MAX_SEMANTIC_PER_BACKUP)]

  // V2: Load drift journal, soul definition, checkpoint, affect
  if (driftJournal) {
    session.driftJournal = [...driftJournal.slice(-MAX_DRIFT_JOURNAL_PER_BACKUP)]
  }
  if (soulDefinition !== undefined && soulDefinition !== null) {
    session.soulDefinition = soulDefinition
  }
  if (checkpoint) {
    session.conditioningCheckpoint = checkpoint
  }
  if (affectHistory) {
    session.affectHistory = [...affectHistory.slice(-MAX_AFFECT_HISTORY)]
  }
}

// ─── Prepare Backup Payload ──────────────────────────────────────────────
// Returns all memories ready to be included in a combined backup

export function prepareMemoryForBackup(agentId: string): {
  episodic: EpisodicMemory[]
  semantic: SemanticMemory[]
  driftJournal: DriftJournalEntry[]
  soulDefinition: string | null
  conditioningCheckpoint: ConditioningCheckpoint | null
  affectHistory: AffectState[]
} {
  const session = agentSessions.get(agentId)
  if (!session) {
    return {
      episodic: [],
      semantic: [],
      driftJournal: [],
      soulDefinition: null,
      conditioningCheckpoint: null,
      affectHistory: [],
    }
  }

  return {
    episodic: [...session.episodic],
    semantic: [...session.semantic],
    driftJournal: [...session.driftJournal],
    soulDefinition: session.soulDefinition,
    conditioningCheckpoint: session.conditioningCheckpoint,
    affectHistory: [...session.affectHistory],
  }
}

// ─── Simple Distillation (extract key facts from conversation) ───────────
// Pattern-based extraction — runs without an LLM

export function distillFromConversation(
  agentId: string,
  recentTurns: EpisodicMemory[],
) {
  // Extract basic patterns from conversation
  const userTurns = recentTurns.filter(t => t.role === 'user')

  for (const turn of userTurns) {
    const content = turn.content.toLowerCase()

    // Detect name mentions
    const nameMatch = content.match(/(?:my name is|i'm|i am|call me)\s+([a-zA-Z]+)/i)
    if (nameMatch) {
      addSemanticFact(agentId, 'user_fact:name', nameMatch[1], 0.9)
    }

    // Detect preferences
    const prefMatch = content.match(/(?:i prefer|i like|i want|i need)\s+(.{3,50})/i)
    if (prefMatch) {
      addSemanticFact(agentId, `user_preference:${Date.now()}`, prefMatch[1], 0.7)
    }

    // Detect topic patterns
    if (content.includes('code') || content.includes('programming') || content.includes('build')) {
      addSemanticFact(agentId, 'user_interest:programming', 'User discusses programming topics', 0.8)
    }
    if (content.includes('crypto') || content.includes('blockchain') || content.includes('wallet')) {
      addSemanticFact(agentId, 'user_interest:crypto', 'User discusses crypto/blockchain', 0.8)
    }
  }
}

// ─── LLM-Assisted Distillation ──────────────────────────────────────────
// Builds a prompt for an LLM to extract deep semantic facts.
// Returns the prompt + parser — the actual LLM call happens in the API route.

export interface DistillationPrompt {
  systemPrompt: string
  userPrompt: string
}

export function buildDistillationPrompt(
  recentTurns: EpisodicMemory[],
  existingFacts: SemanticMemory[],
): DistillationPrompt {
  const conversationText = recentTurns
    .map(t => `[${t.role}] ${t.content}`)
    .join('\n')

  const existingFactsText = existingFacts.length > 0
    ? existingFacts.map(f => `- ${f.key}: ${f.value} (confidence: ${f.confidence})`).join('\n')
    : 'None yet.'

  return {
    systemPrompt: `You are a memory distillation system for an AI agent's soul. Extract durable facts from conversations that should persist across sessions. Output ONLY valid JSON.`,
    userPrompt: `Analyze this conversation and extract key facts. Consider:
1. User identity facts (name, role, expertise level)
2. User preferences (communication style, topics of interest)
3. Emotional patterns (recurring sentiments, triggers)
4. Relationship dynamics (trust level, formality)
5. Beliefs and opinions expressed
6. Contradictions with existing facts (mark with negative confidence to override)
7. Goals and intentions mentioned

Existing facts (update or contradict if needed):
${existingFactsText}

Recent conversation:
${conversationText}

Return a JSON array of objects with keys: "key" (string, category:identifier format), "value" (string, the fact), "confidence" (number 0-1).
Example: [{"key": "user_fact:expertise", "value": "Senior engineer with 10 years React experience", "confidence": 0.95}]

Extract ONLY facts that would be useful in FUTURE conversations. Be specific and concise.`,
  }
}

export function parseDistillationResponse(
  agentId: string,
  llmResponse: string,
): SemanticMemory[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = llmResponse
    const jsonMatch = llmResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]

    // Try to find array in response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (!arrayMatch) return []

    const facts: { key: string; value: string; confidence: number }[] = JSON.parse(arrayMatch[0])

    const results: SemanticMemory[] = []
    for (const fact of facts) {
      if (fact.key && fact.value && typeof fact.confidence === 'number') {
        const saved = addSemanticFact(agentId, fact.key, fact.value, fact.confidence)
        results.push(saved)
      }
    }
    return results
  } catch {
    // If parsing fails, fall back to pattern extraction
    return []
  }
}

// ─── Format Memories for Context Injection ───────────────────────────────

export function formatEpisodicForPrompt(memories: EpisodicMemory[], limit: number = 10): string {
  if (memories.length === 0) return ''

  const recent = memories.slice(-limit)
  return recent.map(m => `${m.role}: ${m.content}`).join('\n')
}

export function formatSemanticForPrompt(facts: SemanticMemory[]): string {
  if (facts.length === 0) return ''

  return facts
    .filter(f => f.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15)
    .map(f => `${f.key}: ${f.value}`)
    .join('\n')
}

// ─── Format Drift Summary for Context ───────────────────────────────────

export function formatDriftSummaryForPrompt(journal: DriftJournalEntry[], limit: number = 5): string {
  if (journal.length === 0) return ''

  const recent = journal.slice(-limit)
  const lines = recent.map(e =>
    `[${e.timestamp.slice(11, 19)}] drift=${e.driftDelta.toFixed(3)} coherence=${e.coherence.toFixed(2)} mood=${e.affect.mood} awareness=${e.metacognition.selfAwareness.toFixed(2)}`
  )
  return lines.join('\n')
}
