-- Add decision layer fields to signals table
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS should_contact BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS target_persona TEXT,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2);
