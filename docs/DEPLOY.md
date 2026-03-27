# Quick Deployment Guide

## Status: Backend Deployed ✅

Backend is deploying to Railway at:
https://railway.com/project/c14796a3-a57d-4005-9d1c-2897055be272

## Next Steps

### 1. Set Backend Environment Variables

Go to Railway dashboard and set these variables:

```
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY29tcWhodHJ3Znlnc2hoeWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NTU4MSwiZXhwIjoyMDg2NzMxNTgxfQ.HIldLOyZx4jvhdgSYNSzbI6zmOhkJM7Ptf0LfKyajSE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
TAVILY_API_KEY=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
TELEGRAM_BOT_TOKEN=8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw
TELEGRAM_CHAT_ID=2042406431
PORT=8000
```

### 2. Deploy Daemon

```bash
cd openclaw-daemon
railway up
```

Then set daemon variables in Railway dashboard:
```
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=<same as above>
OPENAI_API_KEY=<same as above>
TAVILY_API_KEY=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
TELEGRAM_BOT_TOKEN=8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw
TELEGRAM_CHAT_ID=2042406431
OPENCLAW_GATEWAY_TOKEN=56d24bb9286e30866a62ea68140e0e57e2de8505144173425acdf95122599f5c
```

### 3. Deploy Frontend

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel:
```
NEXT_PUBLIC_BACKEND_URL=<your-railway-backend-url>
NEXT_PUBLIC_SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY29tcWhodHJ3Znlnc2hoeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTU1ODEsImV4cCI6MjA4NjczMTU4MX0.mwxIi4eMnnG5bkA_fyUYyi3Ppw-mm8ykywfFy8kjEak
```

### 4. Run Database Migrations

Go to: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql/new

Paste and run:
```sql
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
```

### 5. Test!

1. Visit your frontend URL
2. Enter pitch: "We sell data integration tools for modern data teams"
3. Wait for discovery to complete
4. Check Telegram for alerts

---

## Troubleshooting

**Backend not starting?**
- Check Railway logs for errors
- Verify all environment variables are set
- Check health endpoint: `<backend-url>/health`

**Daemon not running?**
- Check Railway logs
- Verify OPENCLAW_GATEWAY_TOKEN is set
- Test Telegram bot: `curl https://api.telegram.org/bot<TOKEN>/getMe`

**Frontend not connecting?**
- Verify NEXT_PUBLIC_BACKEND_URL points to Railway backend
- Check browser console for CORS errors
- Verify Supabase anon key is correct
