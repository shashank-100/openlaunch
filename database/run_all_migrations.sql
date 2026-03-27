-- Combined migrations for Geodo V2.5
-- Run this in Supabase SQL Editor

-- Migration 1: Add user_pitch to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_pitch TEXT;

-- Migration 2: Add prospect fields to signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS prospect_title TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS prospect_linkedin TEXT;

-- Migration 3: Add product-led intelligence fields to signals
ALTER TABLE signals ADD COLUMN IF NOT EXISTS product_insight TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS opportunity TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS target_persona TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS should_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS tech_stack JSONB;

-- Migration 4: Update outreach table for multi-channel support
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
ALTER TABLE outreach ALTER COLUMN to_email DROP NOT NULL;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS to_handle TEXT;
