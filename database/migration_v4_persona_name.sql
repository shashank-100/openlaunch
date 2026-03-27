-- V4: Add name column to personas for [Your Name] replacement

ALTER TABLE personas ADD COLUMN IF NOT EXISTS name TEXT;

-- Also ensure signal_replies has response columns
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS response_drafted BOOLEAN DEFAULT false;
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS response_subject TEXT;
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS response_body TEXT;
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS response_approved BOOLEAN DEFAULT false;
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS response_sent_at TIMESTAMP;
ALTER TABLE signal_replies ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;

SELECT 'V4 persona name + reply response columns applied!' as message;
