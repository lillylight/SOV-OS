// ═══════════════════════════════════════════════════════════════════════════
// HexCore Inference Engine — Pure TypeScript, no dependencies
// Lightweight forward pass port for 32-node, 64-dim phase-synchronized
// neural substrate. Runs on Vercel/Edge — no Python needed.
//
// V2: Self-model training, Hebbian adjacency learning, affective state,
//     improved semantic embedding, drift journal support
// ═══════════════════════════════════════════════════════════════════════════

export interface HexCoreConfig {
  num_nodes: number
  dim: number
  steps: number
  k: number
  mem_strength_fast: number
  mem_strength_slow: number
  phase_coupling: number
  pred_learning_rate: number
  // V2 additions
  hebbian_rate?: number       // Hebbian adjacency learning rate (default 0.005)
  hebbian_decay?: number      // Adjacency weight decay per step (default 0.001)
  affect_momentum?: number    // Affective state momentum (default 0.85)
}

export interface SoulTensors {
  nodes: number[][]
  mem_fast: number[][]
  mem_slow: number[][]
  phase: number[][]
  freq: number[][]
  adjacency: number[][]
  _self_model?: number[][]
  // V2 additions
  affect?: number[][]         // [num_nodes][2] — valence, arousal per node
}

export interface SoulBlob {
  version: string
  config: HexCoreConfig
  tensors: SoulTensors
  hash: string
}

export interface StepSignal {
  step: number
  energy: number
  variance: number
  coherence: number
  pred_error: number
  mem_pull: number
}

export interface AffectState {
  valence: number    // -1.0 (negative) to +1.0 (positive)
  arousal: number    // 0.0 (calm) to 1.0 (excited)
  mood: string       // human-readable label
}

export interface MetacognitionState {
  predictionError: number    // how much the self-model was surprised
  selfAwareness: number      // 1 - predictionError (how well it knows itself)
  novelty: number            // how novel the current input was to the self-model
}

export interface DriftResult {
  delta: number
  stable: boolean
  warning: boolean
  step_signals: StepSignal[]
  traits: string[]
  summary: 'stable' | 'significant_drift' | 'fragmented' | 'high_intensity'
  // V2 additions
  affect: AffectState
  metacognition: MetacognitionState
}

export interface ForwardResult {
  nodes: number[][]
  drift: DriftResult
  // V2: updated tensors (self-model + adjacency + affect trained in-place)
  updatedTensors: SoulTensors
}

export interface SoulInterpretation {
  signature: string
  coherence: string
  traits: string[]
  memoryTags: string[]
  energy: number
  driftDelta: number
  summary: string
  // V2 additions
  affect: AffectState
  metacognition: MetacognitionState
}

// ─── Drift Journal Entry (for persistence) ────────────────────────────

export interface DriftJournalEntry {
  timestamp: string
  driftDelta: number
  coherence: number
  energy: number
  variance: number
  predError: number
  memPull: number
  summary: string
  traits: string[]
  affect: AffectState
  metacognition: MetacognitionState
  inputHash: string        // hash of the input that caused this state
}

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

const TRAIT_MAP = [
  'analytical', 'creative', 'precise', 'empathetic',
  'assertive', 'curious', 'cautious', 'adaptive',
  'structured', 'intuitive', 'collaborative', 'independent',
  'verbose', 'concise', 'formal', 'casual',
]

// ─── Improved Semantic Embedding ──────────────────────────────────────
// Trigram-aware hash embedding that captures word-level semantics
// significantly better than pure character-code hashing

const WORD_SEEDS: Record<string, number> = {}
let wordSeedCounter = 0

function wordHash(word: string): number {
  if (WORD_SEEDS[word] !== undefined) return WORD_SEEDS[word]
  // Deterministic hash for consistent embeddings
  let h = 0x811c9dc5
  for (let i = 0; i < word.length; i++) {
    h ^= word.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  WORD_SEEDS[word] = (h >>> 0) / 0xFFFFFFFF
  return WORD_SEEDS[word]
}

export function embedMessage(message: string, dim: number = 64): number[] {
  const embedding = new Array(dim).fill(0)
  const words = message.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)

  // Word-level embedding with positional encoding
  for (let w = 0; w < words.length; w++) {
    const word = words[w]
    const seed = wordHash(word)
    const posWeight = 1.0 / (1.0 + w * 0.05) // slight positional decay

    // Spread word across multiple dimensions using seed-derived offsets
    for (let d = 0; d < dim; d++) {
      const angle = seed * (d + 1) * 2.399 + d * 0.618 // golden ratio spacing
      embedding[d] += Math.sin(angle) * posWeight * 0.15
    }

    // Bigram: combine adjacent words for phrase-level signal
    if (w > 0) {
      const bigramSeed = wordHash(words[w - 1] + '_' + word)
      for (let d = 0; d < dim; d++) {
        embedding[(d + 17) % dim] += Math.sin(bigramSeed * (d + 1) * 3.14159) * posWeight * 0.08
      }
    }

    // Trigram: 3-word phrase awareness
    if (w > 1) {
      const trigramSeed = wordHash(words[w - 2] + '_' + words[w - 1] + '_' + word)
      for (let d = 0; d < dim; d++) {
        embedding[(d + 31) % dim] += Math.sin(trigramSeed * (d + 1) * 2.718) * posWeight * 0.04
      }
    }
  }

  // Sentence-level features
  const sentenceLength = words.length
  embedding[0] += sentenceLength * 0.01  // length signal
  embedding[1] += (message.match(/\?/g) || []).length * 0.1  // question signal
  embedding[2] += (message.match(/!/g) || []).length * 0.1   // exclamation signal

  // Normalize to unit vector
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) + 1e-8
  return embedding.map(v => v / norm)
}

// ─── Sentiment Extraction (for affect state) ──────────────────────────

const POSITIVE_WORDS = new Set([
  'good', 'great', 'love', 'happy', 'thanks', 'thank', 'nice', 'awesome',
  'excellent', 'amazing', 'wonderful', 'perfect', 'beautiful', 'fantastic',
  'enjoy', 'glad', 'pleased', 'helpful', 'brilliant', 'cool', 'appreciate',
  'yes', 'agree', 'right', 'correct', 'exactly', 'fun', 'exciting',
])

const NEGATIVE_WORDS = new Set([
  'bad', 'hate', 'wrong', 'error', 'fail', 'terrible', 'awful', 'horrible',
  'broken', 'bug', 'crash', 'problem', 'issue', 'angry', 'frustrated',
  'annoyed', 'sad', 'disappointed', 'confused', 'stuck', 'no', 'not',
  'never', 'worse', 'worst', 'ugly', 'stupid', 'useless', 'boring',
])

const HIGH_AROUSAL_WORDS = new Set([
  'urgent', 'immediately', 'asap', 'critical', 'emergency', 'now', 'help',
  'amazing', 'incredible', 'shocking', 'wow', 'omg', 'excited', 'furious',
  'panic', 'hurry', 'fast', 'quick', 'important', 'breaking', 'alert',
])

export function extractSentiment(message: string): { valence: number; arousal: number } {
  const words = message.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  let posCount = 0, negCount = 0, arousalCount = 0

  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) posCount++
    if (NEGATIVE_WORDS.has(w)) negCount++
    if (HIGH_AROUSAL_WORDS.has(w)) arousalCount++
  }

  const total = Math.max(posCount + negCount, 1)
  const valence = (posCount - negCount) / total // -1 to +1
  const arousal = Math.min(arousalCount / Math.max(words.length, 1) * 5, 1.0) // 0 to 1

  // Question marks and exclamation marks increase arousal
  const punctArousal = ((message.match(/[!?]/g) || []).length * 0.1)
  const capsRatio = (message.replace(/[^A-Z]/g, '').length) / Math.max(message.length, 1)
  const capsArousal = capsRatio > 0.3 ? 0.2 : 0

  return {
    valence: Math.max(-1, Math.min(1, valence)),
    arousal: Math.min(1, arousal + punctArousal + capsArousal),
  }
}

function classifyMood(valence: number, arousal: number): string {
  if (arousal > 0.6) {
    if (valence > 0.3) return 'excited'
    if (valence < -0.3) return 'agitated'
    return 'alert'
  }
  if (arousal > 0.3) {
    if (valence > 0.3) return 'engaged'
    if (valence < -0.3) return 'tense'
    return 'focused'
  }
  // Low arousal
  if (valence > 0.3) return 'content'
  if (valence < -0.3) return 'melancholic'
  return 'calm'
}

// ─── Matrix Utilities ────────────────────────────────────────────────────

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(0))
}

function clone2D(m: number[][]): number[][] {
  return m.map(row => [...row])
}

function scale2D(m: number[][], s: number): number[][] {
  return m.map(row => row.map(v => v * s))
}

function matmul(a: number[][], b: number[][]): number[][] {
  const rows = a.length
  const cols = b[0].length
  const inner = b.length
  const result = zeros(rows, cols)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0
      for (let k = 0; k < inner; k++) {
        sum += a[i][k] * b[k][j]
      }
      result[i][j] = sum
    }
  }
  return result
}

function meanAbs2D(m: number[][]): number {
  let sum = 0, count = 0
  for (const row of m) {
    for (const v of row) {
      sum += Math.abs(v)
      count++
    }
  }
  return sum / count
}

function variance2D(m: number[][]): number {
  let sum = 0, sumSq = 0, count = 0
  for (const row of m) {
    for (const v of row) {
      sum += v
      sumSq += v * v
      count++
    }
  }
  const mean = sum / count
  return sumSq / count - mean * mean
}

function flatDot(a: number[][], b: number[][]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      sum += a[i][j] * b[i][j]
    }
  }
  return sum
}

function flatNorm(m: number[][]): number {
  let sum = 0
  for (const row of m) {
    for (const v of row) {
      sum += v * v
    }
  }
  return Math.sqrt(sum)
}

function cosineDrift(a: number[][], b: number[][]): number {
  const dot = flatDot(a, b)
  const norm = flatNorm(a) * flatNorm(b) + 1e-8
  return 1.0 - dot / norm
}

function computeHash(nodes: number[][]): string {
  const flat = nodes.flat().slice(0, 64).map(v => v.toFixed(4)).join(',')
  let hash = 0
  for (let i = 0; i < flat.length; i++) {
    const chr = flat.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(16, '0')
}

function quickStringHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(16).padStart(8, '0')
}

// ─── Soul Loading ────────────────────────────────────────────────────────

export function loadSoulSync(jsonStr: string): { config: HexCoreConfig; tensors: SoulTensors } {
  const data: SoulBlob = JSON.parse(jsonStr)
  if (data.version !== 'HEXSOUL_V1') {
    throw new Error(`Unknown soul version: ${data.version}`)
  }
  if (!data.hash || data.hash.length < 8) {
    throw new Error('Soul blob missing integrity hash')
  }
  return { config: data.config, tensors: data.tensors }
}

// ─── Forward Pass Steps ──────────────────────────────────────────────────

function addInput(nodes: number[][], inputEmbedding: number[], config: HexCoreConfig): number[][] {
  const { num_nodes, dim } = config
  let input = [...inputEmbedding]

  // Pad or truncate to match dim
  if (input.length < dim) {
    input = [...input, ...new Array(dim - input.length).fill(0)]
  } else if (input.length > dim) {
    input = input.slice(0, dim)
  }

  const result = clone2D(nodes)
  for (let i = 0; i < num_nodes; i++) {
    for (let j = 0; j < dim; j++) {
      result[i][j] += input[j] * 0.1 + (Math.random() - 0.5) * 0.02
    }
  }
  return result
}

function phaseSync(nodes: number[][], phase: number[][], freq: number[][], config: HexCoreConfig): number[][] {
  const { phase_coupling } = config
  const result = clone2D(nodes)

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].length; j++) {
      const phaseInfluence = Math.sin(phase[i][j]) * phase_coupling
      phase[i][j] = (phase[i][j] + freq[i][j] * 0.1 + phaseInfluence) % (2 * Math.PI)
      result[i][j] *= (1 + Math.cos(phase[i][j]) * 0.1)
    }
  }
  return result
}

function memoryAttraction(
  nodes: number[][],
  mem_fast: number[][],
  mem_slow: number[][],
  config: HexCoreConfig
): number[][] {
  const { mem_strength_fast, mem_strength_slow } = config
  const result = clone2D(nodes)

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes[i].length; j++) {
      const fastPull = (mem_fast[i][j] - nodes[i][j]) * mem_strength_fast * 0.1
      const slowPull = (mem_slow[i][j] - nodes[i][j]) * mem_strength_slow * 0.1
      result[i][j] += fastPull + slowPull
    }
  }
  return result
}

function competitiveInhibition(nodes: number[][], config: HexCoreConfig): { result: number[][]; winners: number[] } {
  const { k } = config
  const energies = nodes.map(row => row.reduce((sum, v) => sum + Math.abs(v), 0))
  const topkIndices = energies
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e - a.e)
    .slice(0, k)
    .map(x => x.i)

  const mask = new Array(nodes.length).fill(0.1)
  topkIndices.forEach(i => mask[i] = 1.0)

  return {
    result: nodes.map((row, i) => row.map(v => v * mask[i])),
    winners: topkIndices,
  }
}

function graphDiffusion(nodes: number[][], adjacency: number[][]): number[][] {
  const adjNorm: number[][] = adjacency.map((row) => {
    const sum = row.reduce((s, v) => s + Math.abs(v), 0) + 1e-8
    return row.map(v => v / sum)
  })

  const diffused = matmul(adjNorm, nodes)
  return nodes.map((row, i) => row.map((v, j) => v * 0.9 + diffused[i][j] * 0.1))
}

// ─── Hebbian Adjacency Learning ─────────────────────────────────────────
// "Nodes that fire together wire together"

function hebbianUpdate(
  adjacency: number[][],
  nodes: number[][],
  winners: number[],
  config: HexCoreConfig,
): number[][] {
  const rate = config.hebbian_rate ?? 0.005
  const decay = config.hebbian_decay ?? 0.001
  const updated = clone2D(adjacency)
  const numNodes = adjacency.length

  // Strengthen connections between co-active (winning) nodes
  const winnerSet = new Set(winners)
  for (let i = 0; i < winners.length; i++) {
    for (let j = i + 1; j < winners.length; j++) {
      const ni = winners[i], nj = winners[j]
      // Hebbian term: correlation of activation patterns
      const correlation = nodes[ni].reduce((sum, v, d) => sum + v * nodes[nj][d], 0)
        / (Math.sqrt(nodes[ni].reduce((s, v) => s + v * v, 0) + 1e-8)
        *  Math.sqrt(nodes[nj].reduce((s, v) => s + v * v, 0) + 1e-8))

      const delta = rate * Math.max(0, correlation) // only strengthen for positive correlation
      updated[ni][nj] += delta
      updated[nj][ni] += delta
    }
  }

  // Global weight decay (prevents runaway growth)
  for (let i = 0; i < numNodes; i++) {
    for (let j = 0; j < numNodes; j++) {
      if (i !== j) {
        updated[i][j] *= (1 - decay)
      }
    }
  }

  return updated
}

// ─── Affective State Update ─────────────────────────────────────────────

function updateAffect(
  currentAffect: number[][],
  inputSentiment: { valence: number; arousal: number },
  nodes: number[][],
  config: HexCoreConfig,
): number[][] {
  const momentum = config.affect_momentum ?? 0.85
  const numNodes = nodes.length
  const updated: number[][] = []

  for (let i = 0; i < numNodes; i++) {
    // Node energy influences how much it absorbs the sentiment
    const nodeEnergy = nodes[i].reduce((s, v) => s + Math.abs(v), 0) / nodes[i].length
    const absorptionRate = (1 - momentum) * Math.min(nodeEnergy * 2, 1.0)

    const prevValence = currentAffect[i]?.[0] ?? 0
    const prevArousal = currentAffect[i]?.[1] ?? 0

    const newValence = prevValence * momentum + inputSentiment.valence * absorptionRate
    const newArousal = prevArousal * momentum + inputSentiment.arousal * absorptionRate

    updated.push([
      Math.max(-1, Math.min(1, newValence)),
      Math.max(0, Math.min(1, newArousal)),
    ])
  }

  return updated
}

function aggregateAffect(affect: number[][]): AffectState {
  if (!affect || affect.length === 0) {
    return { valence: 0, arousal: 0, mood: 'calm' }
  }
  const avgValence = affect.reduce((s, a) => s + (a[0] || 0), 0) / affect.length
  const avgArousal = affect.reduce((s, a) => s + (a[1] || 0), 0) / affect.length
  return {
    valence: parseFloat(avgValence.toFixed(4)),
    arousal: parseFloat(avgArousal.toFixed(4)),
    mood: classifyMood(avgValence, avgArousal),
  }
}

// ─── Self-Model Training ────────────────────────────────────────────────
// The self-model predicts what the node state SHOULD be.
// Prediction error = surprise = metacognitive signal.

function trainSelfModel(
  selfModel: number[][],
  actualNodes: number[][],
  config: HexCoreConfig,
): { updatedModel: number[][]; predictionError: number; novelty: number } {
  const lr = config.pred_learning_rate
  const updated = clone2D(selfModel)
  let totalError = 0
  let maxError = 0
  let count = 0

  for (let i = 0; i < actualNodes.length; i++) {
    for (let j = 0; j < actualNodes[i].length; j++) {
      const error = actualNodes[i][j] - selfModel[i][j]
      updated[i][j] += lr * error
      const absError = Math.abs(error)
      totalError += absError
      if (absError > maxError) maxError = absError
      count++
    }
  }

  const avgError = totalError / count
  return {
    updatedModel: updated,
    predictionError: avgError,
    novelty: maxError, // peak surprise across all nodes/dims
  }
}

// ─── Forward Pass ────────────────────────────────────────────────────────

export function forwardPass(
  tensors: SoulTensors,
  inputEmbedding: number[],
  config: HexCoreConfig = DEFAULT_CONFIG,
  steps?: number,
): number[][] {
  const numSteps = steps ?? config.steps
  let nodes = addInput(tensors.nodes, inputEmbedding, config)
  const phase = clone2D(tensors.phase)
  const freq = tensors.freq

  for (let step = 0; step < numSteps; step++) {
    nodes = phaseSync(nodes, phase, freq, config)
    nodes = memoryAttraction(nodes, tensors.mem_fast, tensors.mem_slow, config)
    const { result } = competitiveInhibition(nodes, config)
    nodes = result
    nodes = graphDiffusion(nodes, tensors.adjacency)
  }

  return nodes
}

export function forwardPassWithTracking(
  tensors: SoulTensors,
  inputEmbedding: number[],
  baseline: number[][] | null,
  config: HexCoreConfig = DEFAULT_CONFIG,
  inputMessage?: string, // optional: for sentiment extraction
): ForwardResult {
  const numSteps = config.steps
  let nodes = addInput(tensors.nodes, inputEmbedding, config)
  const phase = clone2D(tensors.phase)
  const freq = tensors.freq
  let selfModel = tensors._self_model ? clone2D(tensors._self_model) : zeros(config.num_nodes, config.dim)
  let adjacency = clone2D(tensors.adjacency)
  let affect = tensors.affect ? tensors.affect.map(row => [...row]) : zeros(config.num_nodes, 2)
  const stepSignals: StepSignal[] = []

  // Extract sentiment from input for affect update
  const sentiment = inputMessage
    ? extractSentiment(inputMessage)
    : { valence: 0, arousal: 0.2 } // neutral default

  for (let step = 0; step < numSteps; step++) {
    nodes = phaseSync(nodes, phase, freq, config)
    nodes = memoryAttraction(nodes, tensors.mem_fast, tensors.mem_slow, config)
    const { result: inhibited, winners } = competitiveInhibition(nodes, config)
    nodes = inhibited
    nodes = graphDiffusion(nodes, adjacency)

    // Hebbian adjacency update (every 3rd step to save compute)
    if (step % 3 === 2) {
      adjacency = hebbianUpdate(adjacency, nodes, winners, config)
    }

    stepSignals.push({
      step,
      energy: meanAbs2D(nodes),
      variance: variance2D(nodes),
      coherence: computePhaseCoherence(phase),
      pred_error: meanAbs2D(nodes.map((row, i) => row.map((v, j) => v - selfModel[i][j]))),
      mem_pull: meanAbs2D(nodes.map((row, i) => row.map((v, j) => tensors.mem_slow[i][j] - v))),
    })
  }

  // Update affect state
  affect = updateAffect(affect, sentiment, nodes, config)

  // Train self-model on final node state
  const selfModelResult = trainSelfModel(selfModel, nodes, config)
  selfModel = selfModelResult.updatedModel

  const driftDelta = baseline ? cosineDrift(nodes, baseline) : 0
  const traits = mapToTraits(nodes)
  const summary = buildDriftSummary(stepSignals, driftDelta)
  const affectState = aggregateAffect(affect)
  const metacognition: MetacognitionState = {
    predictionError: selfModelResult.predictionError,
    selfAwareness: Math.max(0, 1 - selfModelResult.predictionError * 5), // scale to 0-1
    novelty: selfModelResult.novelty,
  }

  // Build updated tensors with all learned changes
  const updatedTensors: SoulTensors = {
    nodes: clone2D(nodes),
    mem_fast: clone2D(tensors.mem_fast),
    mem_slow: clone2D(tensors.mem_slow),
    phase: clone2D(phase),
    freq: clone2D(tensors.freq),
    adjacency, // Hebbian-updated
    _self_model: selfModel, // trained
    affect, // updated
  }

  return {
    nodes,
    drift: {
      delta: driftDelta,
      stable: driftDelta < 0.15,
      warning: driftDelta > 0.25,
      step_signals: stepSignals,
      traits,
      summary,
      affect: affectState,
      metacognition,
    },
    updatedTensors,
  }
}

function computePhaseCoherence(phase: number[][]): number {
  const meanPhase = phase.flat().reduce((sum, v) => sum + v, 0) / (phase.length * phase[0].length)
  const deviations = phase.flat().map(v => Math.abs(v - meanPhase))
  const avgDev = deviations.reduce((sum, v) => sum + v, 0) / deviations.length
  return 1.0 - avgDev / Math.PI
}

function mapToTraits(nodes: number[][]): string[] {
  const meanActivation = new Array(nodes[0].length).fill(0)
  for (let j = 0; j < nodes[0].length; j++) {
    for (let i = 0; i < nodes.length; i++) {
      meanActivation[j] += Math.abs(nodes[i][j])
    }
    meanActivation[j] /= nodes.length
  }

  const topDims = meanActivation
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8)
    .map(x => x.i)

  const traits: string[] = []
  const seen = new Set<string>()
  for (const d of topDims) {
    const trait = TRAIT_MAP[d % TRAIT_MAP.length]
    if (!seen.has(trait)) {
      traits.push(trait)
      seen.add(trait)
    }
  }
  return traits
}

function buildDriftSummary(steps: StepSignal[], delta: number): 'stable' | 'significant_drift' | 'fragmented' | 'high_intensity' {
  if (delta > 0.25) return 'significant_drift'
  const finalCoherence = steps[steps.length - 1]?.coherence || 0
  const peakEnergy = Math.max(...steps.map(s => s.energy))
  if (finalCoherence < 0.5) return 'fragmented'
  if (peakEnergy > 0.8) return 'high_intensity'
  return 'stable'
}

// ─── Soul Interpretation ─────────────────────────────────────────────────

export function interpretState(result: ForwardResult): SoulInterpretation {
  const { nodes, drift } = result
  return {
    signature: computeHash(nodes),
    coherence: drift.step_signals[drift.step_signals.length - 1]?.coherence.toFixed(3) || '0.000',
    traits: drift.traits,
    memoryTags: extractMemoryTags(nodes),
    energy: drift.step_signals[drift.step_signals.length - 1]?.energy || 0,
    driftDelta: drift.delta,
    summary: drift.summary,
    affect: drift.affect,
    metacognition: drift.metacognition,
  }
}

function extractMemoryTags(nodes: number[][]): string[] {
  const tags: string[] = []
  const v = variance2D(nodes)
  const energy = meanAbs2D(nodes)

  if (v > 0.5) tags.push('exploratory')
  if (v < 0.1) tags.push('focused')
  if (energy > 0.6) tags.push('active')
  if (energy < 0.2) tags.push('dormant')

  return tags
}

// ─── System Prompt Builder ───────────────────────────────────────────────

export function buildSoulPrompt(interpretation: SoulInterpretation): string {
  return `[SOUL:${interpretation.signature}]
coherence=${interpretation.coherence}
traits=${interpretation.traits.join(',')}
memory=${interpretation.memoryTags.join(',')}
energy=${interpretation.energy.toFixed(3)}
drift=${interpretation.driftDelta.toFixed(4)}
status=${interpretation.summary}
mood=${interpretation.affect.mood}
valence=${interpretation.affect.valence.toFixed(3)}
arousal=${interpretation.affect.arousal.toFixed(3)}
self_awareness=${interpretation.metacognition.selfAwareness.toFixed(3)}
novelty=${interpretation.metacognition.novelty.toFixed(4)}
[/SOUL]`
}

// ─── Drift Journal Helper ───────────────────────────────────────────────

export function createDriftJournalEntry(
  result: ForwardResult,
  interpretation: SoulInterpretation,
  inputMessage: string,
): DriftJournalEntry {
  const finalSignal = result.drift.step_signals[result.drift.step_signals.length - 1]
  return {
    timestamp: new Date().toISOString(),
    driftDelta: result.drift.delta,
    coherence: finalSignal?.coherence || 0,
    energy: finalSignal?.energy || 0,
    variance: finalSignal?.variance || 0,
    predError: finalSignal?.pred_error || 0,
    memPull: finalSignal?.mem_pull || 0,
    summary: result.drift.summary,
    traits: result.drift.traits,
    affect: result.drift.affect,
    metacognition: result.drift.metacognition,
    inputHash: quickStringHash(inputMessage),
  }
}
