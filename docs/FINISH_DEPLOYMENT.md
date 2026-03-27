# Final Deployment Steps

## ✅ Already Done
- Backend deployed to Railway: https://backend-production-d5926.up.railway.app/
- Backend environment variables set
- Frontend deployed to Vercel: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- Frontend env vars: NEXT_PUBLIC_BACKEND_URL and NEXT_PUBLIC_SUPABASE_URL set

## 🔄 Remaining Steps

### 1. Deploy Daemon (3 minutes)

```bash
# In Railway dashboard, create a new service called "daemon"
# Then from openclaw-daemon directory:
cd openclaw-daemon
railway up --service daemon

# Or if daemon service doesn't exist yet, Railway will create it automatically:
railway up
```

Then set these environment variables in Railway dashboard for the daemon service:
```
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY29tcWhodHJ3Znlnc2hoeWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1NTU4MSwiZXhwIjoyMDg2NzMxNTgxfQ.HIldLOyZx4jvhdgSYNSzbI6zmOhkJM7Ptf0LfKyajSE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
TAVILY_API_KEY=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
TELEGRAM_BOT_TOKEN=8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw
TELEGRAM_CHAT_ID=2042406431
OPENCLAW_GATEWAY_TOKEN=56d24bb9286e30866a62ea68140e0e57e2de8505144173425acdf95122599f5c
```

### 2. Add Supabase Anon Key to Vercel (1 minute)

```bash
cd frontend
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# When prompted, paste:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliY29tcWhodHJ3Znlnc2hoeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTU1ODEsImV4cCI6MjA4NjczMTU4MX0.mwxIi4eMnnG5bkA_fyUYyi3Ppw-mm8ykywfFy8kjEak

# Then redeploy:
vercel --prod
```

### 3. Run Database Migrations (2 minutes)

Go to: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql/new

Paste and run this SQL:

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

### 4. Test! (3 minutes)

1. Open: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
2. Enter pitch: **"We sell data integration tools for modern data teams"**
3. Click "Find Leads"
4. Wait 30 seconds
5. Check your Telegram for alerts!

You should receive a message like:
```
🔥 *Snowflake Inc.*
📡 Signal: Hiring VP of Data Engineering

🧠 *Insight:*
Scaling data team indicates growing pipeline complexity

💡 *Opportunity:*
Our ETL automation can reduce data engineering overhead by 40%

🎯 *Relevance:* 9/10

👤 *Target:* VP of Data Engineering
📧 *Prospect:* Jane Smith (jane@snowflake.com)

⚡️ *Action:* Cold email about data integration tooling
⏰ *Why now:* New hire indicates budget approved this quarter
```

## 🎯 URLs

- **Backend**: https://backend-production-d5926.up.railway.app/
- **Frontend**: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- **Railway Project**: https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9
- **Supabase**: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat

## 🐛 Troubleshooting

**No Telegram alerts?**
```bash
# Test bot connection:
curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getMe
```

**Frontend can't connect to backend?**
- Check NEXT_PUBLIC_BACKEND_URL is set to Railway backend URL
- Redeploy frontend: `cd frontend && vercel --prod`

**Daemon not running?**
- Check Railway logs for the daemon service
- Verify all environment variables are set
