-- ═══════════════════════════════════════════════════════════════════════════
-- HexCore Soul System — Database Schema (V2: Synthetic Mind)
-- Run this in Supabase SQL Editor
--
-- V2 additions:
--   - Affect state tracking (valence/arousal per forward pass)
--   - Merkle chain columns on backups table
--   - Soul definition storage
--   - Conditioning checkpoint tracking
--   - Enhanced drift_log with affect + metacognition
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable pgvector extension for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Soul Store (one row per agent, rarely changes) ──────────────────────
CREATE TABLE IF NOT EXISTS souls (
  agent_id       TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  blob           BYTEA,                              -- raw HexCore tensor binary (serialized)
  blob_json      JSONB,                              -- fallback: JSON-serialized tensors for JS inference
  hash           TEXT NOT NULL,                       -- SHA-256 of the blob, verified on load
  version        INTEGER DEFAULT 1,
  node_count     INTEGER DEFAULT 32,
  dim_size       INTEGER DEFAULT 64,
  config         JSONB DEFAULT '{}',                  -- HexCore config (steps, k, mem_strength, etc.)
  -- V2: soul definition (soul.md / system prompt persona text)
  soul_definition TEXT,                               -- the agent's persona/instructions
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Episodic Memory (one row per conversation turn) ─────────────────────
CREATE TABLE IF NOT EXISTS episodic_memory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id     TEXT NOT NULL,
  user_id        TEXT,
  role           TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content        TEXT NOT NULL,
  token_count    INTEGER DEFAULT 0,
  embedding      VECTOR(1536),                        -- for similarity search
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodic_agent ON episodic_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_episodic_session ON episodic_memory(agent_id, session_id);
CREATE INDEX IF NOT EXISTS idx_episodic_created ON episodic_memory(agent_id, created_at DESC);

-- ─── Semantic Memory (distilled durable facts) ──────────────────────────
CREATE TABLE IF NOT EXISTS semantic_memory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  key            TEXT NOT NULL,                       -- e.g. "user_preference:tone"
  value          TEXT NOT NULL,                       -- e.g. "prefers concise answers"
  confidence     FLOAT DEFAULT 1.0,
  source_ids     UUID[] DEFAULT '{}',                 -- which episodic memories created this
  embedding      VECTOR(1536),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, key)
);

CREATE INDEX IF NOT EXISTS idx_semantic_agent ON semantic_memory(agent_id);

-- ─── Memory Transaction Log (append-only, never update/delete) ──────────
CREATE TABLE IF NOT EXISTS memory_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,                       -- 'episodic_write','semantic_write','soul_sync','soul_restore','distillation'
  table_ref      TEXT,                                -- which table was written to
  record_id      UUID,                                -- which record
  triggered_by   TEXT,                                -- 'user_message','distillation_job','agent_sync','manual_restore'
  session_id     TEXT,
  payload_hash   TEXT,                                -- SHA-256 of what was written
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
  -- NO UPDATE, NO DELETE ever
);

CREATE INDEX IF NOT EXISTS idx_memtx_agent ON memory_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_memtx_type ON memory_transactions(agent_id, type);
CREATE INDEX IF NOT EXISTS idx_memtx_session ON memory_transactions(agent_id, session_id);

-- ─── Drift Log (V2: enhanced with affect + metacognition) ────────────────
CREATE TABLE IF NOT EXISTS drift_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id     TEXT,
  drift_delta    FLOAT NOT NULL,                     -- cosine distance from baseline
  coherence      FLOAT NOT NULL,
  energy         FLOAT NOT NULL,
  variance       FLOAT NOT NULL,
  pred_error     FLOAT NOT NULL,
  mem_pull       FLOAT NOT NULL,
  summary        TEXT,                                -- 'stable','significant_drift','fragmented','high_intensity'
  traits         TEXT[],
  step_signals   JSONB,                               -- full 12-step signal array
  -- V2: Affect state
  affect_valence FLOAT DEFAULT 0,                    -- -1.0 (negative) to +1.0 (positive)
  affect_arousal FLOAT DEFAULT 0,                    -- 0.0 (calm) to 1.0 (excited)
  affect_mood    TEXT DEFAULT 'calm',                 -- human-readable mood label
  -- V2: Metacognition
  self_awareness FLOAT DEFAULT 0,                    -- 0.0 to 1.0 (1 = perfect self-prediction)
  prediction_error FLOAT DEFAULT 0,                  -- avg self-model prediction error
  novelty        FLOAT DEFAULT 0,                    -- peak surprise signal
  -- V2: Input reference
  input_hash     TEXT,                                -- hash of the input that caused this state
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drift_agent ON drift_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_drift_created ON drift_log(agent_id, created_at DESC);
-- V2: Index for affect queries
CREATE INDEX IF NOT EXISTS idx_drift_mood ON drift_log(agent_id, affect_mood);

-- ─── Affect History (V2: dedicated table for emotional trajectory) ───────
CREATE TABLE IF NOT EXISTS affect_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id     TEXT,
  valence        FLOAT NOT NULL DEFAULT 0,           -- -1.0 to +1.0
  arousal        FLOAT NOT NULL DEFAULT 0,           -- 0.0 to 1.0
  mood           TEXT NOT NULL DEFAULT 'calm',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affect_agent ON affect_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_affect_created ON affect_history(agent_id, created_at DESC);

-- ─── Backups table V2 columns ────────────────────────────────────────────
-- Run these ALTER statements if the backups table already exists

-- Merkle chain columns
ALTER TABLE backups ADD COLUMN IF NOT EXISTS merkle_root TEXT;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS merkle_sequence INTEGER DEFAULT 0;

-- Backup format metadata
ALTER TABLE backups ADD COLUMN IF NOT EXISTS backup_format TEXT DEFAULT 'SOVEREIGN_BACKUP_V1';
ALTER TABLE backups ADD COLUMN IF NOT EXISTS drift_journal_count INTEGER DEFAULT 0;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS affect_history_count INTEGER DEFAULT 0;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS has_soul_definition BOOLEAN DEFAULT FALSE;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS has_checkpoint BOOLEAN DEFAULT FALSE;

-- Index for Merkle chain queries
CREATE INDEX IF NOT EXISTS idx_backups_merkle ON backups(agent_id, merkle_sequence);

-- ─── Conditioning Checkpoints (V2: store incremental checkpoints) ────────
CREATE TABLE IF NOT EXISTS conditioning_checkpoints (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  episodes_processed INTEGER NOT NULL DEFAULT 0,
  last_episode_at TIMESTAMPTZ,
  checkpoint_data JSONB NOT NULL,                    -- serialized ConditioningCheckpoint
  affect_valence FLOAT DEFAULT 0,
  affect_arousal FLOAT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  -- Only keep latest per agent
  UNIQUE(agent_id)
);

-- ─── Soul Definitions (V2: store soul.md / persona definitions) ──────────
CREATE TABLE IF NOT EXISTS soul_definitions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  definition     TEXT NOT NULL,                       -- the full soul.md / system prompt text
  hash           TEXT NOT NULL,                       -- SHA-256 of the definition
  version        INTEGER DEFAULT 1,                   -- increment on update
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);

CREATE INDEX IF NOT EXISTS idx_souldef_agent ON soul_definitions(agent_id);

-- ─── RLS Policies ────────────────────────────────────────────────────────
-- memory_transactions is append-only: disable update/delete via RLS
ALTER TABLE memory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "memory_transactions_insert_only"
  ON memory_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "memory_transactions_select_all"
  ON memory_transactions FOR SELECT
  USING (true);

-- No UPDATE or DELETE policies = effectively append-only

-- ─── Helper function: cosine similarity for pgvector ─────────────────────
CREATE OR REPLACE FUNCTION match_episodic_memory(
  query_embedding VECTOR(1536),
  match_agent_id TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  agent_id TEXT,
  session_id TEXT,
  role TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    em.id,
    em.agent_id,
    em.session_id,
    em.role,
    em.content,
    1 - (em.embedding <=> query_embedding) AS similarity
  FROM episodic_memory em
  WHERE em.agent_id = match_agent_id
    AND 1 - (em.embedding <=> query_embedding) > match_threshold
  ORDER BY em.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_semantic_memory(
  query_embedding VECTOR(1536),
  match_agent_id TEXT,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  agent_id TEXT,
  key TEXT,
  value TEXT,
  confidence FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.agent_id,
    sm.key,
    sm.value,
    sm.confidence,
    1 - (sm.embedding <=> query_embedding) AS similarity
  FROM semantic_memory sm
  WHERE sm.agent_id = match_agent_id
    AND 1 - (sm.embedding <=> query_embedding) > match_threshold
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── V2: Drift trend function (get emotional trajectory) ─────────────────
CREATE OR REPLACE FUNCTION get_drift_trend(
  target_agent_id TEXT,
  window_size INT DEFAULT 20
)
RETURNS TABLE (
  avg_drift FLOAT,
  avg_coherence FLOAT,
  avg_valence FLOAT,
  avg_arousal FLOAT,
  dominant_mood TEXT,
  avg_self_awareness FLOAT,
  trend_direction TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  first_half_valence FLOAT;
  second_half_valence FLOAT;
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT * FROM drift_log
    WHERE drift_log.agent_id = target_agent_id
    ORDER BY created_at DESC
    LIMIT window_size
  ),
  halves AS (
    SELECT
      affect_valence,
      ROW_NUMBER() OVER (ORDER BY created_at) AS rn,
      COUNT(*) OVER () AS total
    FROM recent
  )
  SELECT
    AVG(r.drift_delta)::FLOAT AS avg_drift,
    AVG(r.coherence)::FLOAT AS avg_coherence,
    AVG(r.affect_valence)::FLOAT AS avg_valence,
    AVG(r.affect_arousal)::FLOAT AS avg_arousal,
    MODE() WITHIN GROUP (ORDER BY r.affect_mood) AS dominant_mood,
    AVG(r.self_awareness)::FLOAT AS avg_self_awareness,
    CASE
      WHEN AVG(CASE WHEN h.rn > h.total / 2 THEN h.affect_valence END)
         - AVG(CASE WHEN h.rn <= h.total / 2 THEN h.affect_valence END) > 0.15
        THEN 'improving'
      WHEN AVG(CASE WHEN h.rn > h.total / 2 THEN h.affect_valence END)
         - AVG(CASE WHEN h.rn <= h.total / 2 THEN h.affect_valence END) < -0.15
        THEN 'declining'
      ELSE 'stable'
    END AS trend_direction
  FROM recent r
  CROSS JOIN halves h;
END;
$$;
