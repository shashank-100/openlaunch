-- Migration: Add Auto-Outreach toggle to accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auto_outreach_enabled BOOLEAN DEFAULT FALSE;
