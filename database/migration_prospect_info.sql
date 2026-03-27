-- Add prospect info to signals table
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS prospect_name TEXT,
  ADD COLUMN IF NOT EXISTS prospect_email TEXT;
