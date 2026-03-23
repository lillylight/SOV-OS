-- ─── Tax Transactions Table for Sovereign OS ────────────────────────────────
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- This table stores auto-categorized tax transactions for agent income/expenses

-- 1. Create tax_transactions table
CREATE TABLE IF NOT EXISTS tax_transactions (
  id TEXT PRIMARY KEY,
  agent_wallet TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  tx_hash TEXT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'expense',
  subcategory TEXT NOT NULL DEFAULT 'uncategorised',
  description TEXT DEFAULT '',
  confidence INTEGER DEFAULT 50,
  manually_categorised BOOLEAN DEFAULT false,
  jurisdiction TEXT DEFAULT 'US'
);

-- 2. Create tax_settings table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS tax_settings (
  wallet_address TEXT PRIMARY KEY,
  jurisdiction TEXT DEFAULT 'US',
  withholding_enabled BOOLEAN DEFAULT false,
  withholding_rate NUMERIC(5,2) DEFAULT 15,
  tax_destination_wallet TEXT DEFAULT '',
  total_withheld NUMERIC(18,6) DEFAULT 0,
  total_gross_income NUMERIC(18,6) DEFAULT 0,
  total_net_income NUMERIC(18,6) DEFAULT 0,
  withholding_count INTEGER DEFAULT 0,
  last_withholding_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tax_tx_agent_wallet ON tax_transactions(agent_wallet);
CREATE INDEX IF NOT EXISTS idx_tax_tx_timestamp ON tax_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tax_tx_category ON tax_transactions(category);

-- 4. Enable RLS (permissive for server-side access)
ALTER TABLE tax_transactions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_transactions' AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON tax_transactions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tax_settings' AND policyname = 'Allow all for service role'
  ) THEN
    CREATE POLICY "Allow all for service role" ON tax_settings
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
