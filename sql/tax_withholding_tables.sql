-- ─── Tax Withholding Tables for Sovereign OS ─────────────────────────────────
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: hqexnppwltaodjmwaqsc

-- 1. Add withholding columns to existing tax_settings table
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS withholding_enabled BOOLEAN DEFAULT false;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS withholding_rate NUMERIC(5,2) DEFAULT 15;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS tax_destination_wallet TEXT DEFAULT '';
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS total_withheld NUMERIC(18,6) DEFAULT 0;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS total_gross_income NUMERIC(18,6) DEFAULT 0;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS total_net_income NUMERIC(18,6) DEFAULT 0;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS withholding_count INTEGER DEFAULT 0;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS last_withholding_at TIMESTAMPTZ;
ALTER TABLE tax_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create the tax_withholding_ledger table
CREATE TABLE IF NOT EXISTS tax_withholding_ledger (
  id TEXT PRIMARY KEY,
  agent_wallet TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  gross_amount NUMERIC(18,6) NOT NULL,
  tax_amount NUMERIC(18,6) NOT NULL,
  net_amount NUMERIC(18,6) NOT NULL,
  withholding_rate NUMERIC(5,2) NOT NULL,
  tax_destination_wallet TEXT NOT NULL,
  source TEXT DEFAULT '',
  source_type TEXT DEFAULT 'other',
  tx_hash_incoming TEXT,
  tx_hash_to_agent TEXT,
  tx_hash_to_tax TEXT,
  status TEXT DEFAULT 'completed',
  jurisdiction TEXT DEFAULT 'US'
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_withholding_agent_wallet ON tax_withholding_ledger(agent_wallet);
CREATE INDEX IF NOT EXISTS idx_withholding_timestamp ON tax_withholding_ledger(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_withholding_status ON tax_withholding_ledger(status);

-- 4. Enable RLS (Row Level Security) - permissive for server-side access
ALTER TABLE tax_withholding_ledger ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_withholding_ledger' AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON tax_withholding_ledger
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
