# GEODO - Telegram-Only Setup Complete

## What Changed

### 1. **Product-Led Intelligence**
- Added `product_insight`, `opportunity`, and `relevance_score` fields to signals
- AI now maps every signal to YOUR specific product pitch
- Relevance scoring (1-10) shows product-market fit

### 2. **Telegram Alerts (Optimized Format)**
Your Telegram alerts now show:
```
🔥 Company Name
📡 Signal: [What happened]

🧠 Insight:
[What this reveals about their technical needs]

💡 Opportunity:
[How YOUR product solves this]

🎯 Relevance: 8/10

👤 Target: CTO / VP Engineering
📧 Prospect: John Doe (john@company.com)

⚡️ Action: [What to do now]
⏰ Why now: [Why this moment matters]
```

### 3. **Email Outreach Kept**
- Telegram = Alerts to YOU
- Email = Outreach to PROSPECTS
- WhatsApp delivery removed

### 4. **Database Schema**
New migration: `migration_product_insights.sql`
Adds: product_insight, opportunity, relevance_score, and other fields to signals table

---

## Setup Instructions

### Step 1: Get API Keys

#### Tavily Search API
1. Go to https://tavily.com
2. Sign up and get your API key
3. Add to `.env`: `TAVILY_API_KEY=tvly-xxxxx`

#### Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Add to `.env`: `TELEGRAM_BOT_TOKEN=123456:ABC-DEF...`

#### Get Your Telegram Chat ID
1. Send any message to your new bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}` in the response
4. Add to `.env`: `TELEGRAM_CHAT_ID=123456789`

### Step 2: Run Database Migrations

In Supabase SQL Editor, run these in order:
1. `database/migration_pitch.sql` - Adds user_pitch to accounts
2. `database/migration_final_sync.sql` - Adds prospect fields
3. `database/migration_product_insights.sql` - Adds intelligence fields

### Step 3: Environment Variables

Update your `.env` file with:
```bash
# Required for discovery
TAVILY_API_KEY=tvly-xxxxx
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5-mini

# Required for Telegram alerts
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=123456789

# Existing Supabase creds
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# Redis
REDIS_URL=redis://localhost:6379

# OpenClaw
OPENCLAW_URL=ws://localhost:18789
OPENCLAW_GATEWAY_TOKEN=your_token
```

### Step 4: Test Locally

```bash
# Terminal 1: Start Backend
cd backend
python main.py

# Terminal 2: Start Daemon
cd openclaw-daemon
npm install
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### Step 5: Test the Flow

1. Go to http://localhost:3000
2. Enter a pitch: "We sell data integration tools for modern data teams"
3. Click "Find Leads"
4. Wait ~30 seconds
5. Check your accounts page - should see 10 new companies
6. Wait for daemon to process (check logs)
7. Check Telegram - you should get high-priority alerts!

---

## File Changes Summary

### Modified Files:
- `openclaw-daemon/src/openclawClient.ts` - Added product intelligence fields, updated Telegram format
- `openclaw-daemon/src/index.ts` - Updated signal insert to include new fields
- `.env` - Added TAVILY_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- `.env.example` - Updated with new required keys

### New Files:
- `database/migration_product_insights.sql` - Database schema update

### Key Functions:
- `runDiscoveryAgent()` - Generates Tavily queries from pitch, finds companies
- `runMonitorAgent()` - Maps signals to your product, generates insights
- `deliverAlert()` - Sends formatted alerts to Telegram

---

## Deployment to Railway

### Backend
```bash
cd backend
railway up
railway variables set SUPABASE_URL=xxx
railway variables set TAVILY_API_KEY=xxx
railway variables set TELEGRAM_BOT_TOKEN=xxx
# ... (set all env vars)
```

### Daemon
```bash
cd openclaw-daemon
railway up
# Set same env vars
```

---

## Next Steps

1. **Get API Keys** - Tavily + Telegram Bot
2. **Run Migrations** - In Supabase SQL Editor
3. **Test Locally** - Verify Telegram alerts work
4. **Deploy to Railway** - Set env vars and deploy
5. **Monitor** - Check Telegram for high-priority signals

---

**Questions?**
- Check logs: `openclaw-daemon/` console for errors
- Verify env vars are loaded: `console.log(process.env.TELEGRAM_BOT_TOKEN)`
- Test Telegram manually: Send a test message via OpenClaw CLI
