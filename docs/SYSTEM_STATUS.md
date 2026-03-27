# 🚀 Geodo System Status - All Systems Operational

**Last Updated**: March 21, 2026 at 5:11 AM
**Status**: ✅ All systems operational and ready

---

## System Overview

### 🎯 What This System Does

**Geodo** is an automated B2B sales intelligence platform that:
1. **Discovers** new companies entering your ICP daily
2. **Monitors** web signals (hiring, funding, product launches, tech changes)
3. **Evaluates** each signal against YOUR product offering
4. **Delivers** actionable intelligence via Telegram alerts

### 🔄 Daily Automation Flow

```
Every day at 8:00 AM:

Discovery Agent runs
    ↓
Finds 10-15 NEW companies matching your ICP
    ↓
For each company:
    • Scan web for buying signals (last 90 days)
    • Evaluate: "Does this company need MY product RIGHT NOW?"
    • Generate intelligence: insight, opportunity, action, reason
    • Save to database with deduplication
    ↓
High-priority signals → Telegram alert
    ↓
You wake up to fresh, actionable leads
```

---

## Services Status

### ✅ Backend (FastAPI)
- **URL**: https://backend-production-d5926.up.railway.app/
- **Status**: Healthy
- **Health Check**: `{"status":"healthy","timestamp":"2026-03-21T05:11:32.124381+00:00"}`
- **Platform**: Railway
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /api/pitch` - Queue discovery jobs
  - `GET /api/signals` - Fetch signals feed

### ✅ Frontend (Next.js)
- **URL**: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- **Status**: Live
- **Platform**: Vercel
- **Features**:
  - Discovery form (submit pitch)
  - Signals feed (view all signals)
  - Company details
  - Filtering by priority/type

### ✅ Daemon (Node.js/TypeScript)
- **Platform**: Railway
- **Status**: Running
- **Schedule**: Daily at 8:00 AM
- **Next Run**: ~4 hours from now
- **Logs**: `railway logs --service daemon`
- **Service ID**: 8c687b6a-5e93-4859-8d88-697ef734159a

### ✅ Database (Supabase PostgreSQL)
- **URL**: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat
- **Status**: Operational
- **Migrations**: All 9 new fields applied
- **Tables**:
  - `accounts` - Companies being monitored
  - `signals` - Buying signals detected
  - `outreach` - Automated outreach records

### ⚠️ Redis (Optional)
- **Status**: Not configured
- **Impact**: Manual API triggers won't work, but daily 8am scan works fine
- **Fix**: Add Railway Redis plugin (optional)

---

## Database Schema

### accounts
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  domain TEXT,
  monitoring_enabled BOOLEAN DEFAULT true,
  auto_outreach_enabled BOOLEAN DEFAULT false,
  user_pitch TEXT,              -- NEW: What you sell
  last_monitored_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### signals
```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  signal_type TEXT,
  signal_summary TEXT NOT NULL,
  pain_point TEXT,
  outreach_angle TEXT,
  email_subject TEXT,
  email_body TEXT,
  source_url TEXT,
  signal_hash TEXT UNIQUE,      -- Deduplication
  is_new BOOLEAN DEFAULT true,

  -- NEW Product Intelligence Fields
  product_insight TEXT,         -- Why they need help
  opportunity TEXT,             -- How YOUR product solves it
  relevance_score INTEGER,      -- 1-10 fit score
  target_persona TEXT,          -- Who to contact
  action TEXT,                  -- What to do now
  reason TEXT,                  -- Why now is the moment
  priority TEXT,                -- high/medium/low
  should_contact BOOLEAN,       -- Auto-decision
  tech_stack JSONB,             -- Technologies used

  -- Prospect Details
  prospect_name TEXT,
  prospect_email TEXT,
  prospect_title TEXT,
  prospect_linkedin TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Backend (FastAPI)

#### Health Check
```bash
curl https://backend-production-d5926.up.railway.app/health
# Response: {"status":"healthy","timestamp":"..."}
```

#### Trigger Discovery
```bash
curl -X POST https://backend-production-d5926.up.railway.app/api/pitch \
  -H "Content-Type: application/json" \
  -d '{"pitch": "We sell AI-powered sales automation tools for B2B SaaS companies"}'
# Response: {"success":true,"jobId":"..."}
```

#### Get Signals Feed
```bash
curl https://backend-production-d5926.up.railway.app/api/signals
# Response: [{"id":"...","company_name":"...","signal_summary":"..."}]
```

---

## Environment Variables

### Backend (Railway)
```bash
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=YOUR_OPENAI_API_KEY...
TAVILY_API_KEY=tvly-dev-...
TELEGRAM_BOT_TOKEN=8715850403:AAGW-...
TELEGRAM_CHAT_ID=2042406431
OPENCLAW_GATEWAY_TOKEN=56d24bb9...
REDIS_URL=redis://... (optional)
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_BACKEND_URL=https://backend-production-d5926.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Daemon (Railway)
```bash
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
OPENAI_API_KEY=YOUR_OPENAI_API_KEY...
TAVILY_API_KEY=tvly-dev-...
TELEGRAM_BOT_TOKEN=8715850403:AAGW-...
TELEGRAM_CHAT_ID=2042406431
OPENCLAW_GATEWAY_TOKEN=56d24bb9...
REDIS_URL=redis://... (optional)
```

---

## Telegram Integration

### Bot Details
- **Bot Token**: `8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw`
- **Chat ID**: `2042406431`
- **Test Bot**: `curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getMe`

### Alert Format
```
🔥 *Snowflake Inc.*
📡 Signal: Hiring VP of Data Engineering

🧠 *Insight:*
Scaling data team indicates growing pipeline complexity

💡 *Opportunity:*
Our ETL automation can reduce data engineering overhead by 40%

🎯 *Relevance:* 9/10

👤 *Target:* VP of Data Engineering
📧 *Prospect:* jane@snowflake.com

⚡️ *Action:* Cold email about data integration tooling
⏰ *Why now:* New hire indicates budget approved this quarter
```

### Alert Criteria
Telegram alerts are sent when:
- `priority = 'high'` AND
- `should_contact = true` AND
- Signal is new (not duplicate)

---

## Architecture Details

### Discovery Agent (Tavily + GPT-4o-mini)
**Location**: `openclaw-daemon/src/openclawClient.ts:runDiscoveryAgent()`

**Flow**:
1. Takes user pitch: "We sell X"
2. GPT generates 3 dynamic search queries targeting ICP
3. Searches Tavily for 5 results per query (15 total)
4. GPT synthesizes into 10 best-fit companies
5. Returns: `[{company_name, domain, reason}]`

**Example Queries**:
- Pitch: "We sell data integration tools"
- Query 1: "companies hiring data engineers 2026"
- Query 2: "B2B SaaS companies using Snowflake"
- Query 3: "series A startups data infrastructure funding"

### Monitor Agent (Web Search + GPT-4o)
**Location**: `openclaw-daemon/src/openclawClient.ts:runMonitorAgent()`

**Flow**:
1. Takes company name, domain, user pitch
2. Searches web for signals (hiring, funding, launches, tech stack)
3. GPT evaluates EVERY signal through lens of: "Does this company need MY product RIGHT NOW?"
4. Generates product-led intelligence fields
5. Returns: Full signal object with intelligence

**Intelligence Generated**:
- `product_insight`: Technical need revealed by signal
- `opportunity`: How YOUR specific product solves it
- `relevance_score`: 1-10 fit score for YOUR product
- `action`: Specific next step to take
- `reason`: Why NOW is the right moment
- `target_persona`: Who to contact
- Prospect details if found

---

## Daily Schedule

### 8:00 AM - Discovery Run
```
🌅 Running daily discovery...
🔎 Running discovery for pitch: "..."
    ↓
Discovery Agent finds 10-15 companies
    ↓
For each company:
    📡 Scanning for signals...
    🧠 Evaluating vs pitch...
    💾 Saving to database...
    📱 Sending Telegram alert (if high priority)
    ↓
✅ Daily discovery complete
```

**Duration**: ~3-5 minutes total
- Discovery: 30-60 seconds
- Per-company scan: 15-20 seconds each
- Total: 10 companies × 20 sec = ~3 minutes

---

## Monitoring & Logs

### Check Daemon Status
```bash
railway status --service daemon
railway logs --service daemon --tail 50
```

### Check Backend Status
```bash
curl https://backend-production-d5926.up.railway.app/health
railway logs --service backend --tail 50
```

### Check Database
```sql
-- Recent companies discovered
SELECT company_name, user_pitch, created_at
FROM accounts
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Recent high-priority signals
SELECT
  a.company_name,
  s.signal_summary,
  s.relevance_score,
  s.priority,
  s.action,
  s.reason
FROM signals s
JOIN accounts a ON s.account_id = a.id
WHERE s.created_at > NOW() - INTERVAL '1 day'
  AND s.priority = 'high'
ORDER BY s.relevance_score DESC;
```

---

## Testing

### Test Telegram Bot
```bash
curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getMe
# Should return bot info
```

### Test Backend
```bash
curl https://backend-production-d5926.up.railway.app/health
# Should return: {"status":"healthy"}
```

### Test Frontend
Open: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- Should load without errors
- Should show existing signals

### Test Discovery (Manual)
```bash
curl -X POST https://backend-production-d5926.up.railway.app/api/pitch \
  -H "Content-Type: application/json" \
  -d '{"pitch": "We sell AI-powered sales automation tools for B2B SaaS companies"}'
```
Note: Won't process immediately (no Redis), but will run at next 8am scan.

---

## Troubleshooting

### Issue: No Telegram alerts
**Check**:
1. Daemon logs: `railway logs --service daemon`
2. Bot token: `curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getMe`
3. Environment variables in Railway dashboard
4. Are there high-priority signals in database?

### Issue: Daemon not running
**Fix**:
```bash
railway restart --service daemon
railway logs --service daemon --tail 100
```

### Issue: Frontend not loading
**Check**:
1. Vercel deployment status
2. Environment variables (NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_SUPABASE_URL)
3. Backend health: `curl https://backend-production-d5926.up.railway.app/health`

### Issue: Low quality leads
**Fix**: Update user_pitch in database to be more specific
```sql
UPDATE accounts
SET user_pitch = 'We sell data integration tools for B2B SaaS companies with 50+ employees using Snowflake'
WHERE user_pitch LIKE '%data integration%';
```

---

## URLs Quick Reference

| Service | URL |
|---------|-----|
| Frontend | https://frontend-swq6kqnwl-shashank100s-projects.vercel.app |
| Backend | https://backend-production-d5926.up.railway.app/ |
| Backend Health | https://backend-production-d5926.up.railway.app/health |
| Railway Project | https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9 |
| Daemon Service | https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9/service/8c687b6a-5e93-4859-8d88-697ef734159a |
| Supabase Dashboard | https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat |
| Supabase SQL Editor | https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql/new |

---

## What to Expect Tomorrow Morning

**8:00 AM**: Daemon runs discovery
**8:03 AM**: ~10 companies discovered and scanned
**8:05 AM**: Telegram alerts arrive (2-5 high-priority signals)
**Your Action**: Review alerts, take actions suggested

---

## Key Metrics (Expected)

| Metric | Daily | Weekly | Monthly |
|--------|-------|--------|---------|
| Companies discovered | 10-15 | 70-100 | 300-400 |
| Total signals detected | 10-20 | 70-140 | 300-600 |
| High priority signals | 2-5 | 15-35 | 60-150 |
| Telegram alerts | 2-5 | 15-35 | 60-150 |

---

## Next Steps

1. ✅ **System is ready** - No action needed
2. ⏰ **Wait for 8am tomorrow** - First automated discovery run
3. 📱 **Check Telegram** - Verify alerts arrive
4. 📊 **Review quality** - Are signals relevant to your pitch?
5. 🔄 **Iterate** - Refine user_pitch for better targeting
6. 📈 **Scale** - Add multiple pitch variations for different ICPs

---

**Status**: ✅ All systems operational and ready for daily automated discovery!
