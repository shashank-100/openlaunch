-- Migration: Target Account List + Signal Monitoring
-- Run this in Supabase SQL editor

-- 1. Target accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  domain TEXT,
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  monitoring_frequency TEXT CHECK (monitoring_frequency IN ('hourly', 'daily', 'weekly')) DEFAULT 'daily',
  last_monitored_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_monitoring ON accounts(monitoring_enabled, last_monitored_at);

-- 2. Add account_id + dedup hash to signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS signal_hash TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE;

CREATE INDEX idx_signals_account_id ON signals(account_id);
CREATE UNIQUE INDEX idx_signals_hash ON signals(signal_hash) WHERE signal_hash IS NOT NULL;
