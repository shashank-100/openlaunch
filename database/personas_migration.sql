CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT,
  role TEXT,
  pitch TEXT,
  icp_company_size TEXT,
  icp_industry TEXT,
  icp_role TEXT,
  icp_pain TEXT,
  tone TEXT,
  never_say TEXT,
  example_email TEXT,
  cta_style TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
