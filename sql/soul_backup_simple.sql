-- ═══════════════════════════════════════════════════════════════════════════
-- Soul Backup — Simplified Schema
-- Just add soul_cid to existing backups table
-- ═══════════════════════════════════════════════════════════════════════════

-- Add combined backup columns to existing backups table
ALTER TABLE backups ADD COLUMN IF NOT EXISTS soul_cid TEXT;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS soul_hash TEXT;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS soul_size_bytes INTEGER;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS backup_type TEXT DEFAULT 'legacy';
ALTER TABLE backups ADD COLUMN IF NOT EXISTS episodic_count INTEGER DEFAULT 0;
ALTER TABLE backups ADD COLUMN IF NOT EXISTS semantic_count INTEGER DEFAULT 0;

-- Index for fast soul lookups
CREATE INDEX IF NOT EXISTS idx_backups_soul_cid ON backups(soul_cid) WHERE soul_cid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(backup_type);

COMMENT ON COLUMN backups.soul_cid IS 'IPFS CID of encrypted combined backup (soul + memories)';
COMMENT ON COLUMN backups.soul_hash IS 'SHA-256 hash of combined backup for integrity verification';
COMMENT ON COLUMN backups.soul_size_bytes IS 'Size of combined backup in bytes';
COMMENT ON COLUMN backups.backup_type IS 'Type: legacy (old system), soul_only, or combined (soul+memory)';
COMMENT ON COLUMN backups.episodic_count IS 'Number of conversation turns in this backup';
COMMENT ON COLUMN backups.semantic_count IS 'Number of semantic facts in this backup';
