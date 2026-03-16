-- Geodo 2.0 — Clean Schema
-- Run this in Supabase SQL editor

-- Drop old tables (clean slate)
DROP TABLE IF EXISTS outreach CASCADE;
DROP TABLE IF EXISTS signals CASCADE;
DROP TABLE IF EXISTS briefs CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- 1. Accounts — companies being watched
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  company_name TEXT NOT NULL,
  domain TEXT,
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  monitoring_frequency TEXT CHECK (monitoring_frequency IN ('hourly', 'daily', 'weekly')) DEFAULT 'daily',
  last_monitored_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_monitoring ON accounts(monitoring_enabled, last_monitored_at);

-- 2. Signals — one row per detected event, contains full outreach context
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('hiring', 'funding', 'leadership', 'product', 'competitive', 'general')),
  signal_summary TEXT NOT NULL,
  pain_point TEXT,
  outreach_angle TEXT,
  email_subject TEXT,
  email_body TEXT,
  source_url TEXT,
  signal_hash TEXT UNIQUE,
  is_new BOOLEAN DEFAULT TRUE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signals_account ON signals(account_id);
CREATE INDEX idx_signals_detected ON signals(detected_at DESC);
CREATE INDEX idx_signals_new ON signals(is_new) WHERE is_new = TRUE;

-- 3. Briefs — 5-section brief tied to a signal (generated on demand)
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  what_they_do TEXT,
  the_signal TEXT,
  the_pain TEXT,
  your_angle TEXT,
  the_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_briefs_signal ON briefs(signal_id);

-- 4. Outreach — sent emails + tracking
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'replied', 'bounced'))
);

CREATE INDEX idx_outreach_account ON outreach(account_id);
