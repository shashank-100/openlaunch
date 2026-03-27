-- Signal-Based Outreach System Schema

-- Track signal-based outreach campaigns
CREATE TABLE IF NOT EXISTS signal_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Signal details
  signal_type TEXT NOT NULL, -- 'funding', 'hiring', 'product_launch', 'partnership', 'expansion'
  signal_summary TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  source_url TEXT,
  published_date TIMESTAMP,
  relevance_score INTEGER, -- 1-10

  -- Company research
  company_description TEXT,
  employee_count INTEGER,
  tech_stack JSONB,

  -- Email content
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,

  -- Target prospect
  target_persona TEXT, -- 'VP Sales', 'CTO', etc.
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_title TEXT,
  recipient_linkedin TEXT,

  -- Telegram approval workflow
  telegram_message_id TEXT,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'edited', 'rejected'
  approved_at TIMESTAMP,

  -- Email sending status
  sent_at TIMESTAMP,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  send_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track replies to signal-based outreach
CREATE TABLE IF NOT EXISTS signal_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID REFERENCES signal_outreach(id) ON DELETE CASCADE,

  -- Reply details
  gmail_message_id TEXT NOT NULL UNIQUE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_body TEXT NOT NULL,
  received_at TIMESTAMP NOT NULL,

  -- Intent classification
  reply_intent TEXT, -- 'interested', 'not_interested', 'meeting_request', 'question', 'objection'
  intent_confidence REAL,

  -- Auto-response
  response_drafted BOOLEAN DEFAULT false,
  response_subject TEXT,
  response_body TEXT,
  response_tone TEXT, -- 'professional', 'casual', 'urgent'

  -- Approval workflow
  telegram_message_id TEXT,
  response_approved BOOLEAN DEFAULT false,
  response_sent_at TIMESTAMP,
  response_gmail_message_id TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track signal scanner runs
CREATE TABLE IF NOT EXISTS signal_scanner_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Results
  queries_generated INTEGER DEFAULT 0,
  search_results_found INTEGER DEFAULT 0,
  signals_analyzed INTEGER DEFAULT 0,
  relevant_signals_found INTEGER DEFAULT 0,
  emails_drafted INTEGER DEFAULT 0,
  sent_to_telegram INTEGER DEFAULT 0,

  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_outreach_user_id ON signal_outreach(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_outreach_approval_status ON signal_outreach(approval_status);
CREATE INDEX IF NOT EXISTS idx_signal_outreach_sent_at ON signal_outreach(sent_at);
CREATE INDEX IF NOT EXISTS idx_signal_outreach_created_at ON signal_outreach(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_outreach_gmail_thread ON signal_outreach(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_signal_replies_outreach_id ON signal_replies(outreach_id);
CREATE INDEX IF NOT EXISTS idx_signal_replies_intent ON signal_replies(reply_intent);
CREATE INDEX IF NOT EXISTS idx_signal_replies_received_at ON signal_replies(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_scanner_jobs_user_id ON signal_scanner_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_scanner_jobs_created_at ON signal_scanner_jobs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signal_outreach_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_signal_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS signal_outreach_updated_at ON signal_outreach;
CREATE TRIGGER signal_outreach_updated_at
BEFORE UPDATE ON signal_outreach
FOR EACH ROW
EXECUTE FUNCTION update_signal_outreach_updated_at();

DROP TRIGGER IF EXISTS signal_replies_updated_at ON signal_replies;
CREATE TRIGGER signal_replies_updated_at
BEFORE UPDATE ON signal_replies
FOR EACH ROW
EXECUTE FUNCTION update_signal_replies_updated_at();

-- Success message
SELECT 'Signal outreach tables created successfully!' as message;
