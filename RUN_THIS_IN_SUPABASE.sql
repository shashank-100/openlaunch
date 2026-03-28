-- ============================================================================
-- Email Intelligence Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql
-- ============================================================================

-- Store email threads and conversations
CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id TEXT NOT NULL, -- Gmail thread ID
  subject TEXT,
  participants JSONB, -- Array of {name, email}
  last_message_date TIMESTAMP,
  message_count INTEGER DEFAULT 1,

  -- Lead qualification
  is_lead BOOLEAN DEFAULT false,
  lead_score INTEGER, -- 1-10 score
  qualification_status TEXT, -- 'qualified', 'unqualified', 'pending', 'contacted'
  qualification_reason TEXT, -- Why this is/isn't a good lead
  company_name TEXT,
  company_domain TEXT,

  -- Intelligence fields
  pain_points JSONB, -- Array of identified pain points
  buying_signals JSONB, -- Array of detected buying signals
  next_action TEXT, -- What to do next
  urgency TEXT, -- 'high', 'medium', 'low'

  -- Company research
  company_info JSONB, -- Researched company data
  tech_stack JSONB,
  employee_count INTEGER,
  funding_stage TEXT,

  -- Conversation analysis
  conversation_summary TEXT, -- AI summary of thread
  key_topics JSONB, -- Main topics discussed
  sentiment TEXT, -- 'positive', 'neutral', 'negative'

  -- Meeting booking
  meeting_requested BOOLEAN DEFAULT false,
  meeting_scheduled BOOLEAN DEFAULT false,
  meeting_datetime TIMESTAMP,
  calendar_event_id TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_checked_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, thread_id)
);

-- Store individual email messages
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,

  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails JSONB,
  cc_emails JSONB,

  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- First 200 chars

  sent_at TIMESTAMP NOT NULL,
  is_from_me BOOLEAN DEFAULT false,

  -- Extracted data
  mentioned_pain_points JSONB,
  mentioned_competitors JSONB,
  mentioned_budget TEXT,
  mentioned_timeline TEXT,
  questions_asked JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Store generated follow-ups
CREATE TABLE IF NOT EXISTS email_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,

  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT, -- 'professional', 'casual', 'urgent'

  -- Context used
  references_conversation BOOLEAN DEFAULT true,
  context_points JSONB, -- What from the convo was referenced

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'scheduled'
  sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Store email monitoring jobs
CREATE TABLE IF NOT EXISTS email_monitor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  emails_checked INTEGER DEFAULT 0,
  new_threads_found INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  followups_generated INTEGER DEFAULT 0,

  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_qualification ON email_threads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_email_threads_urgency ON email_threads(urgency);
CREATE INDEX IF NOT EXISTS idx_email_threads_lead_score ON email_threads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_sent_at ON email_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_followups_thread_id ON email_followups(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_monitor_jobs_user_id ON email_monitor_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_monitor_jobs_created_at ON email_monitor_jobs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_threads_updated_at ON email_threads;
CREATE TRIGGER email_threads_updated_at
BEFORE UPDATE ON email_threads
FOR EACH ROW
EXECUTE FUNCTION update_email_thread_updated_at();

-- Success message
SELECT 'Email intelligence tables created successfully!' as message;
