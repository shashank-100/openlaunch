# Geodo - Deployment Guide

## ✅ Completed Setup

### 1. API Keys Configured
- ✅ Tavily API Key: `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`
- ✅ Telegram Bot Token: `8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw`
- ✅ Telegram Chat ID: `2042406431`
- ✅ Supabase credentials configured
- ✅ OpenAI API key configured

### 2. Database Migrations Ready
Run this SQL in Supabase SQL Editor (https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql/new):

```sql
-- Combined migrations for Geodo V2.5
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
ALTER TABLE signals ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2);
ALTER TABLE signals ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium';
ALTER TABLE signals ADD COLUMN IF NOT EXISTS should_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS tech_stack JSONB;

-- Migration 4: Update outreach table for multi-channel support
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
ALTER TABLE outreach ALTER COLUMN to_email DROP NOT NULL;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS to_handle TEXT;
```

---

## 🚀 Deployment Steps

### Step 1: Railway Deployment

#### A. Create Railway Project
```bash
# Login to Railway
railway login

# Create new project or link existing
railway init

# Or link to existing project
railway link
```

#### B. Deploy Backend (FastAPI)
```bash
cd backend
railway up
railway variables set --service geodo-backend \
  SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co \
  SUPABASE_SERVICE_KEY=<your_key> \
  OPENAI_API_KEY=<your_key> \
  TAVILY_API_KEY=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 \
  TELEGRAM_BOT_TOKEN=8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw \
  TELEGRAM_CHAT_ID=2042406431
```

#### C. Deploy Daemon (Node.js)
```bash
cd ../openclaw-daemon
railway up
railway variables set --service geodo-daemon \
  SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co \
  SUPABASE_SERVICE_KEY=<your_key> \
  OPENAI_API_KEY=<your_key> \
  TAVILY_API_KEY=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 \
  TELEGRAM_BOT_TOKEN=8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw \
  TELEGRAM_CHAT_ID=2042406431 \
  OPENCLAW_GATEWAY_TOKEN=56d24bb9286e30866a62ea68140e0e57e2de8505144173425acdf95122599f5c
```

### Step 2: Vercel Deployment

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL`: Railway backend URL
- `NEXT_PUBLIC_SUPABASE_URL`: https://ybcomqhhtrwfygshhyat.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: <your_anon_key>

### Step 3: Update .env files with production URLs

After deployment, update the `.env` file with production URLs:
```env
BACKEND_URL=https://your-railway-backend.up.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🧪 Testing the Discovery Flow

### Manual Test
1. Open frontend: `http://localhost:3000` (or production URL)
2. Enter a pitch: "We sell data integration tools for modern data teams"
3. System should:
   - Generate 3 Tavily search queries
   - Find 10 companies matching ICP
   - Create accounts in database
   - Start monitoring for signals

### API Test
```bash
curl -X POST http://localhost:4000/api/pitch \
  -H "Content-Type: application/json" \
  -d '{"user_pitch": "We sell data integration tools for modern data teams"}'
```

### Telegram Alert Test
When a high-priority signal is found, you should receive a formatted message like:
```
🔥 *Snowflake Inc.*
📡 Signal: Hiring VP of Data Engineering

🧠 *Insight:*
Scaling data team indicates growing data pipeline complexity

💡 *Opportunity:*
Our ETL automation can reduce their data engineering overhead by 40%

🎯 *Relevance:* 9/10
```

---

## 📂 Project Structure

```
geodo/
├── backend/          # FastAPI (Python) - REST API
├── frontend/         # Next.js - UI
├── openclaw-daemon/  # Node.js - Background worker
└── database/         # Supabase migrations
```

---

## 🔑 Environment Variables Checklist

### Backend (.env)
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] OPENAI_API_KEY
- [ ] TAVILY_API_KEY
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_CHAT_ID

### Daemon (.env)
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] OPENAI_API_KEY
- [ ] TAVILY_API_KEY
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_CHAT_ID
- [ ] OPENCLAW_GATEWAY_TOKEN

### Frontend (.env.local)
- [ ] NEXT_PUBLIC_BACKEND_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## 🎯 What's Working

### V2.5 Features
✅ Product-led ICP discovery (user describes product → system finds companies)
✅ 3-query Tavily search for comprehensive coverage
✅ Signal-to-product mapping (every signal evaluated against user's pitch)
✅ Product intelligence fields (insight, opportunity, relevance_score)
✅ Telegram alerts with rich formatting
✅ Auto-email outreach via OpenClaw

### Architecture
- Discovery Agent: Tavily + GPT-4o-mini
- Monitor Agent: OpenClaw + GPT-5-mini
- Delivery: Telegram (alerts) + Email (outreach)

---

## 📝 Next Actions

1. **Run Database Migrations** - Copy SQL above into Supabase SQL Editor
2. **Deploy to Railway** - Follow Railway deployment steps
3. **Deploy to Vercel** - Deploy frontend
4. **Test End-to-End** - Try discovery flow with real pitch
5. **Verify Telegram** - Confirm high-priority alerts arrive

---

## 🐛 Troubleshooting

### Telegram bot not sending
- Verify bot token is correct
- Check chat ID matches your Telegram user
- Test bot connection: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### Discovery not finding companies
- Check Tavily API key is valid
- Verify OpenAI API key has credits
- Check daemon logs for errors

### Database connection issues
- Verify Supabase credentials
- Check RLS policies allow service role access
- Confirm migrations have been run
