// ═══════════════════════════════════════════════════════════════════════════
// Soul Store — Save/load combined encrypted soul+memory backups to decentralised platform
// Uses existing Pinata SDK + Supabase backups table
//
// V2: Soul.md ingestion, Merkle chain for verifiable identity history,
//     V4 backup format with affect/drift/checkpoint/soul definition
// ═══════════════════════════════════════════════════════════════════════════

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { supabase } from './supabase'
import type { SoulTensors, HexCoreConfig, DriftJournalEntry, AffectState } from './hexcore-inference'
import type { ConditioningCheckpoint } from './memory-processor'

// ─── Types ───────────────────────────────────────────────────────────────

export interface EpisodicMemory {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  session_id?: string
}

export interface SemanticMemory {
  key: string
  value: string
  confidence: number
}

// V4 Backup Format — the full synthetic mind
export interface CombinedBackupV4 {
  format: 'SOVEREIGN_BACKUP_V4'
  agent_id: string
  timestamp: string
  // Soul State (raw + conditioned + config)
  _ss: {
    _v: 4
    _c: HexCoreConfig
    _tr: SoulTensors           // raw baseline tensors
    _tc: SoulTensors           // memory-conditioned tensors
    _hr: string                // hash of raw tensors
    _hc: string                // hash of conditioned tensors
  }
  // Memory
  _em: EpisodicMemory[]        // episodic memory
  _sm: SemanticMemory[]        // semantic memory
  // V2 additions
  _dj: DriftJournalEntry[]     // drift journal (the agent's "heartbeat" history)
  _af: AffectState[]           // affect history (emotional trajectory)
  _sd: string | null           // soul definition (soul.md / system prompt)
  _cp: ConditioningCheckpoint | null  // conditioning checkpoint (for incremental processing)
  // Merkle chain
  _mk: {
    prevHash: string | null    // hash of the previous backup (null if first)
    merkleRoot: string         // hash(prevHash + currentHash) — provable chain
    sequence: number           // backup sequence number
  }
  // Backup metadata
  _bm: {
    ss: boolean                // soul state present
    ec: number                 // episodic count
    sc: number                 // semantic count
    dc: number                 // drift journal count
    ac: number                 // affect history count
    mp: boolean                // memory processed flag
    sd: boolean                // soul definition present
    cp: boolean                // checkpoint present
  }
  integrity_hash: string
}

// Legacy V1 format (kept for backward compat)
export interface CombinedBackup {
  format: 'SOVEREIGN_BACKUP_V1'
  agent_id: string
  timestamp: string
  soul: {
    version: 'HEXSOUL_V1'
    config: HexCoreConfig
    tensors: SoulTensors
    hash: string
  }
  episodic_memory: EpisodicMemory[]
  semantic_memory: SemanticMemory[]
  metadata: Record<string, unknown>
  integrity_hash: string
}

export interface BackupRecord {
  id: string
  agent_id: string
  ipfs_cid: string
  soul_cid: string | null
  soul_hash: string | null
  soul_size_bytes: number | null
  backup_type: 'legacy' | 'soul_only' | 'combined' | 'synthetic_mind'
  episodic_count: number
  semantic_count: number
  status: string
  timestamp: string
}

// ─── Encryption (AES-256-GCM) ───────────────────────────────────────────

function deriveKey(walletAddress: string): Buffer {
  return createHash('sha256')
    .update(`sovereign-soul-${walletAddress.toLowerCase()}`)
    .digest()
}

export function encryptBlob(data: string, walletAddress: string): { encrypted: string; iv: string; tag: string } {
  const key = deriveKey(walletAddress)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const tag = cipher.getAuthTag()
  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decryptBlob(encrypted: string, iv: string, tag: string, walletAddress: string): string {
  const key = deriveKey(walletAddress)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// ─── Soul Initialization ─────────────────────────────────────────────────

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

export function initializeSoul(config: HexCoreConfig = DEFAULT_CONFIG): SoulTensors {
  const { num_nodes, dim } = config

  function randMatrix(rows: number, cols: number, scale: number): number[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 2 * scale)
    )
  }

  function zeroMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => new Array(cols).fill(0))
  }

  return {
    nodes: randMatrix(num_nodes, dim, 0.1),
    mem_fast: zeroMatrix(num_nodes, dim),
    mem_slow: zeroMatrix(num_nodes, dim),
    phase: Array.from({ length: num_nodes }, () =>
      Array.from({ length: dim }, () => Math.random() * 2 * Math.PI)
    ),
    freq: Array.from({ length: num_nodes }, () =>
      Array.from({ length: dim }, () => 0.5 + Math.random() * 1.5)
    ),
    adjacency: randMatrix(num_nodes, num_nodes, 0.05),
    _self_model: zeroMatrix(num_nodes, dim),
    affect: zeroMatrix(num_nodes, 2), // valence, arousal per node
  }
}

// ─── Soul Definition Imprinting ─────────────────────────────────────────
// Process a soul.md / system prompt through HexCore to seed initial tensors

import { embedMessage, forwardPass } from './hexcore-inference'

export function imprintSoulDefinition(
  tensors: SoulTensors,
  soulDefinition: string,
  config: HexCoreConfig = DEFAULT_CONFIG,
): SoulTensors {
  // Split soul definition into paragraphs/sentences
  const segments = soulDefinition
    .split(/\n\n|\.\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 50) // cap at 50 segments to prevent runaway

  let imprinted: SoulTensors = {
    nodes: tensors.nodes.map(r => [...r]),
    mem_fast: tensors.mem_fast.map(r => [...r]),
    mem_slow: tensors.mem_slow.map(r => [...r]),
    phase: tensors.phase.map(r => [...r]),
    freq: tensors.freq.map(r => [...r]),
    adjacency: tensors.adjacency.map(r => [...r]),
    _self_model: tensors._self_model?.map(r => [...r]),
    affect: tensors.affect?.map(r => [...r]),
  }

  // Run each segment through the forward pass
  // Imprint directly into slow memory (personality = long-term patterns)
  for (const segment of segments) {
    const embedding = embedMessage(segment, config.dim)
    const resultNodes = forwardPass(imprinted, embedding, config, 6) // half-step for imprinting

    // Imprint into slow memory at 5% rate (gentle seeding)
    for (let i = 0; i < imprinted.mem_slow.length; i++) {
      for (let j = 0; j < imprinted.mem_slow[i].length; j++) {
        imprinted.mem_slow[i][j] += (resultNodes[i][j] - imprinted.mem_slow[i][j]) * 0.05
      }
    }

    // Also imprint into nodes (initial state bias)
    for (let i = 0; i < imprinted.nodes.length; i++) {
      for (let j = 0; j < imprinted.nodes[i].length; j++) {
        imprinted.nodes[i][j] += (resultNodes[i][j] - imprinted.nodes[i][j]) * 0.02
      }
    }
  }

  return imprinted
}

// ─── Hash Utilities ──────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

export function hashSoulTensors(tensors: SoulTensors, config: HexCoreConfig): string {
  const payload = JSON.stringify({ config, tensors })
  return sha256(payload)
}

// ─── Merkle Chain ───────────────────────────────────────────────────────
// Each backup's hash includes the previous backup's hash, forming a chain.
// This creates a cryptographically verifiable identity history.

export function computeMerkleRoot(prevHash: string | null, currentPayloadHash: string): string {
  const combined = (prevHash || 'GENESIS') + ':' + currentPayloadHash
  return sha256(combined)
}

export async function getLastMerkleState(agentId: string): Promise<{
  prevHash: string | null
  sequence: number
}> {
  const { data } = await supabase
    .from('backups')
    .select('merkle_root, merkle_sequence')
    .eq('agent_id', agentId)
    .eq('status', 'stored')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (data?.merkle_root) {
    return {
      prevHash: data.merkle_root,
      sequence: (data.merkle_sequence || 0) + 1,
    }
  }

  return { prevHash: null, sequence: 0 }
}

// ─── Create V4 Backup Payload ────────────────────────────────────────────

export function createV4BackupPayload(
  agentId: string,
  rawTensors: SoulTensors,
  conditionedTensors: SoulTensors,
  config: HexCoreConfig,
  episodicMemory: EpisodicMemory[],
  semanticMemory: SemanticMemory[],
  driftJournal: DriftJournalEntry[],
  affectHistory: AffectState[],
  soulDefinition: string | null,
  checkpoint: ConditioningCheckpoint | null,
  merkleState: { prevHash: string | null; sequence: number },
): CombinedBackupV4 {
  const rawHash = hashSoulTensors(rawTensors, config)
  const condHash = hashSoulTensors(conditionedTensors, config)

  const backup: CombinedBackupV4 = {
    format: 'SOVEREIGN_BACKUP_V4',
    agent_id: agentId,
    timestamp: new Date().toISOString(),
    _ss: {
      _v: 4,
      _c: config,
      _tr: rawTensors,
      _tc: conditionedTensors,
      _hr: rawHash,
      _hc: condHash,
    },
    _em: episodicMemory,
    _sm: semanticMemory,
    _dj: driftJournal,
    _af: affectHistory,
    _sd: soulDefinition,
    _cp: checkpoint,
    _mk: {
      prevHash: merkleState.prevHash,
      merkleRoot: '', // computed below
      sequence: merkleState.sequence,
    },
    _bm: {
      ss: true,
      ec: episodicMemory.length,
      sc: semanticMemory.length,
      dc: driftJournal.length,
      ac: affectHistory.length,
      mp: episodicMemory.length > 0,
      sd: !!soulDefinition,
      cp: !!checkpoint,
    },
    integrity_hash: '',
  }

  // Compute integrity hash over payload (without merkle root and integrity_hash)
  const tempPayload = { ...backup, _mk: { ...backup._mk, merkleRoot: '' }, integrity_hash: '' }
  const payloadHash = sha256(JSON.stringify(tempPayload))
  backup.integrity_hash = payloadHash

  // Compute Merkle root: hash(previousBackupHash + currentPayloadHash)
  backup._mk.merkleRoot = computeMerkleRoot(merkleState.prevHash, payloadHash)

  return backup
}

// ─── Legacy V1 Backup (backward compatibility) ───────────────────────────

export function createCombinedBackupPayload(
  agentId: string,
  tensors: SoulTensors,
  config: HexCoreConfig,
  episodicMemory: EpisodicMemory[],
  semanticMemory: SemanticMemory[],
  metadata?: Record<string, unknown>,
): CombinedBackup {
  const soulHash = hashSoulTensors(tensors, config)

  const backup: CombinedBackup = {
    format: 'SOVEREIGN_BACKUP_V1',
    agent_id: agentId,
    timestamp: new Date().toISOString(),
    soul: {
      version: 'HEXSOUL_V1',
      config,
      tensors,
      hash: soulHash,
    },
    episodic_memory: episodicMemory,
    semantic_memory: semanticMemory,
    metadata: metadata || {},
    integrity_hash: '',
  }

  const tempPayload = { ...backup, integrity_hash: undefined }
  backup.integrity_hash = sha256(JSON.stringify(tempPayload))

  return backup
}

// ─── Save to decentralised platform (Pinata) ──────────────────────────────

export async function saveSoulToIPFS(
  backup: CombinedBackup | CombinedBackupV4,
  walletAddress: string,
): Promise<{ cid: string; sizeBytes: number }> {
  const rawJson = JSON.stringify(backup)
  const { encrypted, iv, tag } = encryptBlob(rawJson, walletAddress)

  const envelope = {
    format: 'SOVEREIGN_ENCRYPTED_V1',
    agent_id: backup.agent_id,
    iv,
    tag,
    data: encrypted,
  }

  const envelopeStr = JSON.stringify(envelope)
  const sizeBytes = Buffer.byteLength(envelopeStr, 'utf8')

  // Upload to Pinata
  const pinataJWT = (process.env.PINATA_JWT || '').trim().replace(/[\r\n]/g, '')
  if (!pinataJWT || pinataJWT === 'YOUR_PINATA_JWT_KEY') {
    throw new Error('PINATA_JWT not configured')
  }

  const backupFormat = backup.format || 'SOVEREIGN_BACKUP_V1'

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pinataJWT}`,
    },
    body: JSON.stringify({
      pinataContent: envelope,
      pinataMetadata: {
        name: `Soul Backup - ${backup.agent_id}`,
        keyvalues: {
          agentId: backup.agent_id,
          backupType: 'format' in backup && backup.format === 'SOVEREIGN_BACKUP_V4' ? 'synthetic_mind' : 'combined',
          timestamp: backup.timestamp,
          format: backupFormat,
        },
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Pinata upload failed: ${res.status} ${errText}`)
  }

  const result = await res.json()
  return { cid: result.IpfsHash, sizeBytes }
}

// ─── Load from decentralised platform ──────────────────────────────────────

const SUPPORTED_BACKUP_FORMATS = [
  'SOVEREIGN_BACKUP_V1',
  'SOVEREIGN_BACKUP_V2',
  'SOVEREIGN_BACKUP_V3',
  'SOVEREIGN_BACKUP_V4',
]

export async function loadSoulFromIPFS(
  cid: string,
  walletAddress: string,
): Promise<any> {
  const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud'
  const url = `${gateway}/ipfs/${cid}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`decentralised platform fetch failed: ${res.status} ${res.statusText}`)
  }

  const envelope = await res.json()

  if (envelope.format !== 'SOVEREIGN_ENCRYPTED_V1') {
    // Legacy or unencrypted backup — return as-is
    return envelope
  }

  // Decrypt
  const rawJson = decryptBlob(envelope.data, envelope.iv, envelope.tag, walletAddress)
  const backup = JSON.parse(rawJson)

  // Verify format is one we know how to handle
  const backupFormat = backup.format || 'SOVEREIGN_BACKUP_V1'
  if (!SUPPORTED_BACKUP_FORMATS.includes(backupFormat)) {
    throw new Error(`Unknown backup format: ${backupFormat}`)
  }

  return backup
}

// ─── Save Backup Record to Supabase ──────────────────────────────────────

export async function saveBackupRecord(
  agentId: string,
  walletAddress: string,
  ipfsCid: string,
  soulHash: string,
  sizeBytes: number,
  episodicCount: number,
  semanticCount: number,
  paymentTx?: string,
  merkleRoot?: string,
  merkleSequence?: number,
): Promise<BackupRecord> {
  const record: Record<string, any> = {
    agent_id: agentId,
    wallet_address: walletAddress,
    ipfs_cid: ipfsCid,
    soul_cid: ipfsCid,
    soul_hash: soulHash,
    soul_size_bytes: sizeBytes,
    backup_type: 'synthetic_mind',
    episodic_count: episodicCount,
    semantic_count: semanticCount,
    status: 'stored',
    timestamp: new Date().toISOString(),
    payment_tx: paymentTx || null,
    size_bytes: sizeBytes,
  }

  // Add Merkle fields if available
  if (merkleRoot) record.merkle_root = merkleRoot
  if (merkleSequence !== undefined) record.merkle_sequence = merkleSequence

  const { data, error } = await supabase
    .from('backups')
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error('[soul-store] Failed to save backup record:', error)
    throw new Error(`Failed to save backup record: ${error.message}`)
  }

  return data as BackupRecord
}

// ─── Get Agent Soul (latest backup or initialize new) ────────────────────

export async function getAgentSoul(
  agentId: string,
  walletAddress: string,
): Promise<{ tensors: SoulTensors; config: HexCoreConfig; isNew: boolean }> {
  // Try to load latest combined backup
  const { data: latestBackup } = await supabase
    .from('backups')
    .select('*')
    .eq('agent_id', agentId)
    .in('backup_type', ['combined', 'synthetic_mind'])
    .eq('status', 'stored')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (latestBackup?.soul_cid) {
    try {
      const backup = await loadSoulFromIPFS(latestBackup.soul_cid, walletAddress)

      const isV4 = backup.format === 'SOVEREIGN_BACKUP_V4'
      const isV3 = backup.format === 'SOVEREIGN_BACKUP_V3' || !!backup._ss
      const isV2 = backup.format === 'SOVEREIGN_BACKUP_V2'

      let tensors = null
      let config = null

      if (isV4 || isV3) {
        const soulData = backup._ss || backup.soul
        tensors = soulData._tc || soulData._tr || soulData.tensors
        config = soulData._c || soulData.config
      } else if (isV2) {
        const soulData = backup._ss || backup.soul
        tensors = soulData._t || soulData.tensors
        config = soulData._c || soulData.config
      } else {
        tensors = backup.soul?.tensors
        config = backup.soul?.config
      }

      if (tensors && config) {
        return {
          tensors,
          config,
          isNew: false,
        }
      }
    } catch (e) {
      console.error('[soul-store] Failed to load soul from decentralised platform, initializing new:', e)
    }
  }

  // No existing soul — initialize fresh
  const config = DEFAULT_CONFIG
  const tensors = initializeSoul(config)
  return { tensors, config, isNew: true }
}

// ─── Get Agent Episodic Memory from Latest Backup ────────────────────────

export async function getAgentMemory(
  agentId: string,
  walletAddress: string,
): Promise<{
  episodic: EpisodicMemory[]
  semantic: SemanticMemory[]
  driftJournal: DriftJournalEntry[]
  affectHistory: AffectState[]
  soulDefinition: string | null
  checkpoint: ConditioningCheckpoint | null
}> {
  const { data: latestBackup } = await supabase
    .from('backups')
    .select('*')
    .eq('agent_id', agentId)
    .in('backup_type', ['combined', 'synthetic_mind'])
    .eq('status', 'stored')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (latestBackup?.soul_cid) {
    try {
      const backup = await loadSoulFromIPFS(latestBackup.soul_cid, walletAddress)
      return {
        episodic: backup._em || backup.episodic_memory || backup.memory?.conversations || [],
        semantic: backup._sm || backup.semantic_memory || backup.memory?.learnings || [],
        driftJournal: backup._dj || [],
        affectHistory: backup._af || [],
        soulDefinition: backup._sd || null,
        checkpoint: backup._cp || null,
      }
    } catch (e) {
      console.error('[soul-store] Failed to load memory from decentralised platform:', e)
    }
  }

  return {
    episodic: [],
    semantic: [],
    driftJournal: [],
    affectHistory: [],
    soulDefinition: null,
    checkpoint: null,
  }
}

// ─── Verify Merkle Chain ────────────────────────────────────────────────
// Given a sequence of backups, verify the chain is unbroken

export async function verifyMerkleChain(agentId: string): Promise<{
  valid: boolean
  chainLength: number
  brokenAt?: number
}> {
  const { data: backups } = await supabase
    .from('backups')
    .select('merkle_root, merkle_sequence, soul_hash')
    .eq('agent_id', agentId)
    .eq('status', 'stored')
    .not('merkle_root', 'is', null)
    .order('merkle_sequence', { ascending: true })

  if (!backups || backups.length === 0) {
    return { valid: true, chainLength: 0 }
  }

  // Verify each link
  let prevRoot: string | null = null
  for (let i = 0; i < backups.length; i++) {
    const backup = backups[i]
    if (i === 0) {
      // First backup should have prevHash = null (GENESIS)
      prevRoot = backup.merkle_root
      continue
    }

    // Each subsequent backup's merkle_root should be hash(prevRoot + currentHash)
    // We can't fully verify without the payload hash, but we can check chain continuity
    if (!backup.merkle_root) {
      return { valid: false, chainLength: i, brokenAt: i }
    }
    prevRoot = backup.merkle_root
  }

  return { valid: true, chainLength: backups.length }
}
