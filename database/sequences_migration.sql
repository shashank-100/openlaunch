-- Sequences table for multi-touch follow-up automation
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  prospect_email TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  -- Each step: { subject, body, delay_days }
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied')),
  next_step_at TIMESTAMPTZ,
  last_step_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sequences_status_next ON sequences(status, next_step_at);
CREATE INDEX IF NOT EXISTS sequences_account ON sequences(account_id);

-- Stop sequence if prospect replies (set status = 'replied')
-- This is checked by inbox-monitor skill
