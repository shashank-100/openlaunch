-- V3: Autonomous AI SDR — Auto mode, Lead Memory, Follow-ups, Calendar, Scoring

-- ── 1. personas: add auto_send + calendar ─────────────────────────────────
ALTER TABLE personas ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT false;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS auto_send_limit INTEGER DEFAULT 10; -- max per day
ALTER TABLE personas ADD COLUMN IF NOT EXISTS google_calendar_token TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS calendar_meeting_duration INTEGER DEFAULT 30; -- minutes
ALTER TABLE personas ADD COLUMN IF NOT EXISTS calendly_link TEXT;

-- ── 2. signal_outreach: add scoring + follow-up tracking ──────────────────
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMP;
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMP;
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS sequence_status TEXT DEFAULT 'active'; -- active, paused, completed, unsubscribed
ALTER TABLE signal_outreach ADD COLUMN IF NOT EXISTS auto_sent BOOLEAN DEFAULT false;

-- ── 3. lead_memory: persistent context per company ────────────────────────
CREATE TABLE IF NOT EXISTS lead_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT,

  -- Company context
  description TEXT,
  employee_count INTEGER,
  tech_stack JSONB,
  industry TEXT,
  location TEXT,
  linkedin_url TEXT,
  funding_stage TEXT,

  -- Interaction history
  total_emails_sent INTEGER DEFAULT 0,
  total_replies_received INTEGER DEFAULT 0,
  first_contacted_at TIMESTAMP,
  last_contacted_at TIMESTAMP,
  last_reply_at TIMESTAMP,
  last_reply_intent TEXT,

  -- Scoring
  lead_score INTEGER DEFAULT 0,
  intent_signals JSONB DEFAULT '[]', -- array of signals detected
  engagement_level TEXT DEFAULT 'cold', -- cold, warm, hot, meeting_booked

  -- Stage
  stage TEXT DEFAULT 'prospecting', -- prospecting, contacted, replied, interested, meeting, closed_won, closed_lost

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, company_domain)
);

-- ── 4. follow_up_queue: scheduled follow-ups ──────────────────────────────
CREATE TABLE IF NOT EXISTS follow_up_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID REFERENCES signal_outreach(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Sequence
  follow_up_number INTEGER NOT NULL, -- 1, 2, 3
  scheduled_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, skipped, cancelled

  -- Email content
  subject TEXT,
  body TEXT,

  -- Sending
  sent_at TIMESTAMP,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,

  -- Approval (if not auto mode)
  telegram_message_id TEXT,
  approval_status TEXT DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT NOW()
);

-- ── 5. meeting_bookings: calendar meetings ────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  outreach_id UUID REFERENCES signal_outreach(id) ON DELETE SET NULL,
  reply_id UUID REFERENCES signal_replies(id) ON DELETE SET NULL,

  -- Meeting details
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP,
  duration_minutes INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'UTC',

  -- Attendees
  prospect_email TEXT NOT NULL,
  prospect_name TEXT,
  company_name TEXT,

  -- Calendar
  google_event_id TEXT,
  google_meet_link TEXT,
  calendar_invite_sent BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'proposed', -- proposed, confirmed, cancelled, completed

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 6. analytics_daily: pre-aggregated metrics ────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,

  signals_found INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_auto_sent INTEGER DEFAULT 0,
  follow_ups_sent INTEGER DEFAULT 0,
  replies_received INTEGER DEFAULT 0,
  interested_replies INTEGER DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  emails_skipped INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lead_memory_user_domain ON lead_memory(user_id, company_domain);
CREATE INDEX IF NOT EXISTS idx_lead_memory_stage ON lead_memory(stage);
CREATE INDEX IF NOT EXISTS idx_lead_memory_score ON lead_memory(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_scheduled ON follow_up_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_follow_up_queue_outreach ON follow_up_queue(outreach_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_user ON meeting_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_prospect ON meeting_bookings(prospect_email);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date ON analytics_daily(user_id, date DESC);

-- ── Triggers ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_lead_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_memory_updated_at ON lead_memory;
CREATE TRIGGER lead_memory_updated_at
BEFORE UPDATE ON lead_memory
FOR EACH ROW EXECUTE FUNCTION update_lead_memory_updated_at();

SELECT 'V3 autonomous schema applied successfully!' as message;
