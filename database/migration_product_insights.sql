-- Add product-led intelligence fields to signals table
ALTER TABLE signals ADD COLUMN IF NOT EXISTS product_insight TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS opportunity TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS target_persona TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS should_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS tech_stack JSONB;
