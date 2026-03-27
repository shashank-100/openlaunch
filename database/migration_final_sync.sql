-- Add missing prospect fields to signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS prospect_title TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS prospect_linkedin TEXT;

-- Add channel to outreach tracking
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
ALTER TABLE outreach ALTER COLUMN to_email DROP NOT NULL; -- Allow null for LinkedIn/Twitter outreach
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS to_handle TEXT; -- For social handles or LinkedIn URLs
