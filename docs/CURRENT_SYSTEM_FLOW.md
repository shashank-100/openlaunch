# Geodo - Complete System Flow Documentation

## 🎯 What Geodo Does

**Geodo** is a B2B sales intelligence platform with two main systems:

### System 1: Automated Company Discovery & Signal Intelligence (LIVE ✅)
Finds NEW companies that match your ICP daily and identifies buying signals

### System 2: Email Intelligence & Lead Qualification (IN PROGRESS 🚧)
Monitors your inbox, qualifies leads, and automates follow-ups

---

## 📊 SYSTEM 1: DAILY DISCOVERY FLOW (WORKING)

### Overview
Every day at 8am, the system discovers 10-15 NEW companies entering your ICP and analyzes them for buying signals.

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY 8AM AUTOMATED FLOW                     │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. TRIGGER: scheduleDailyScan() (src/index.ts:206-217)         │
│    - Calculates time until next 8am                             │
│    - Calls runDailyScan()                                       │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FETCH USER PITCH (src/index.ts:176-203)                     │
│    Query: SELECT user_pitch FROM accounts                      │
│           ORDER BY created_at DESC LIMIT 1                      │
│                                                                 │
│    Example pitch: "We sell AI-powered sales automation tools   │
│                    for B2B SaaS companies"                      │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DISCOVERY AGENT (src/openclawClient.ts:140-190)             │
│                                                                 │
│    Step A: Generate Dynamic Search Queries                     │
│    ┌────────────────────────────────────────┐                 │
│    │ GPT-4o-mini analyzes user pitch        │                 │
│    │ Generates 3 targeted search queries:   │                 │
│    │ - "companies hiring data engineers"    │                 │
│    │ - "B2B SaaS Snowflake users 2026"      │                 │
│    │ - "series A data infrastructure"       │                 │
│    └────────────────────────────────────────┘                 │
│                                                                 │
│    Step B: Web Search via Tavily                               │
│    ┌────────────────────────────────────────┐                 │
│    │ Each query → 5 results                 │                 │
│    │ Total: 15 web results                  │                 │
│    │ Extracts: URLs, content snippets       │                 │
│    └────────────────────────────────────────┘                 │
│                                                                 │
│    Step C: Company Synthesis                                   │
│    ┌────────────────────────────────────────┐                 │
│    │ GPT-4o analyzes all 15 results         │                 │
│    │ Synthesizes best 10-15 companies       │                 │
│    │ Returns: company_name, domain, reason  │                 │
│    └────────────────────────────────────────┘                 │
│                                                                 │
│    OUTPUT: Array of 10-15 companies                            │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. FOR EACH COMPANY (Loop) (src/index.ts:106-172)              │
└─────────────────────────────────────────────────────────────────┘
                               ↓
         ┌────────────────────────────────────┐
         │ 4A. CHECK IF COMPANY EXISTS        │
         │ Query: SELECT id FROM accounts     │
         │        WHERE company_name = ?      │
         └────────────────────────────────────┘
                        ↓
              ┌─────────┴─────────┐
              │ Exists? │  New?   │
              └─────────┬─────────┘
                        ↓
         ┌─────────────────────────────────────┐
         │ 4B. INSERT TO ACCOUNTS TABLE        │
         │ INSERT INTO accounts (              │
         │   user_id,                          │
         │   company_name,                     │
         │   domain,                           │
         │   user_pitch                        │
         │ )                                   │
         │                                     │
         │ Get accountId for next step         │
         └─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. MONITOR AGENT - Signal Intelligence                         │
│    (src/openclawClient.ts:192-303)                             │
│                                                                 │
│    Step A: Web Search for Signals                              │
│    ┌────────────────────────────────────────┐                 │
│    │ Tavily Search Query:                   │                 │
│    │ "{company} buying signals news 2025    │                 │
│    │  tech stack hiring funding"            │                 │
│    │                                         │                 │
│    │ Returns: 10 advanced search results    │                 │
│    └────────────────────────────────────────┘                 │
│                                                                 │
│    Step B: GPT-4o Signal Analysis                              │
│    ┌────────────────────────────────────────┐                 │
│    │ Analyzes signals through lens:         │                 │
│    │ "Does this company need MY product     │                 │
│    │  RIGHT NOW?"                           │                 │
│    │                                         │                 │
│    │ Extracts:                              │                 │
│    │ - Signal type (hiring/funding/product) │                 │
│    │ - Pain point revealed                  │                 │
│    │ - Product insight (technical need)     │                 │
│    │ - Opportunity (how YOUR product helps) │                 │
│    │ - Relevance score (1-10 fit)           │                 │
│    │ - Target persona to contact            │                 │
│    │ - Prospect details (name, email, LI)   │                 │
│    │ - Action to take                       │                 │
│    │ - Reason why now                       │                 │
│    │ - Priority (high/medium/low)           │                 │
│    │ - Tech stack used                      │                 │
│    └────────────────────────────────────────┘                 │
│                                                                 │
│    OUTPUT: Full MonitorResult object                           │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SAVE SIGNAL WITH DEDUPLICATION (src/index.ts:135-161)       │
│                                                                 │
│    Step A: Generate Signal Hash                                │
│    hash = MD5(accountId + signal_type + signal_summary)        │
│                                                                 │
│    Step B: INSERT INTO signals TABLE                           │
│    INSERT INTO signals (                                       │
│      account_id,                                               │
│      signal_type,                                              │
│      signal_summary,                                           │
│      pain_point,                                               │
│      product_insight,       ← NEW intelligence                 │
│      opportunity,           ← NEW intelligence                 │
│      relevance_score,       ← NEW intelligence                 │
│      target_persona,                                           │
│      prospect_name,                                            │
│      prospect_email,                                           │
│      prospect_title,                                           │
│      prospect_linkedin,                                        │
│      action,                ← What to do                       │
│      reason,                ← Why now                          │
│      priority,              ← high/medium/low                  │
│      should_contact,        ← Auto-decision                    │
│      tech_stack,                                               │
│      signal_hash,           ← For deduplication                │
│      is_new                 ← TRUE                             │
│    )                                                            │
│                                                                 │
│    If UNIQUE constraint fails (duplicate hash) → Skip silently │
└─────────────────────────────────────────────────────────────────┘
                               ↓
              ┌────────────────────────────┐
              │ Is this a NEW signal?      │
              │ (not duplicate)            │
              └────────────────────────────┘
                        ↓ YES
┌─────────────────────────────────────────────────────────────────┐
│ 7. DELIVER TELEGRAM ALERT (src/openclawClient.ts:306-339)      │
│                                                                 │
│    Conditions:                                                  │
│    ✓ should_contact = true                                     │
│    ✓ priority = 'high'                                         │
│    ✓ Signal is NEW (not duplicate)                             │
│                                                                 │
│    Alert Format:                                                │
│    ┌────────────────────────────────────┐                     │
│    │ 🔥 **Company Name**                │                     │
│    │ 📡 Signal: Hiring VP of Data       │                     │
│    │                                    │                     │
│    │ 🧠 Insight:                        │                     │
│    │ Growing data team = pipeline       │                     │
│    │ complexity                         │                     │
│    │                                    │                     │
│    │ 💡 Opportunity:                    │                     │
│    │ Our ETL automation reduces         │                     │
│    │ overhead by 40%                    │                     │
│    │                                    │                     │
│    │ 🎯 Relevance: 9/10                 │                     │
│    │ 👤 Target: VP of Data Engineering  │                     │
│    │ 📧 Prospect: jane@company.com      │                     │
│    │                                    │                     │
│    │ ⚡️ Action: Send pricing deck       │                     │
│    │ ⏰ Why now: Budget approved Q1     │                     │
│    │                                    │                     │
│    │ [View Brief](frontend.url/id)     │                     │
│    └────────────────────────────────────┘                     │
│                                                                 │
│    API: POST https://api.telegram.org/bot{token}/sendMessage   │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. COMPLETE & SCHEDULE NEXT RUN                                │
│                                                                 │
│    Log: "✅ Daily discovery complete"                          │
│    Wait: 24 hours                                               │
│    Repeat: Tomorrow at 8am                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA (CURRENT)

### accounts table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID,
  company_name TEXT NOT NULL,
  domain TEXT,
  user_pitch TEXT,              -- What you sell
  monitoring_enabled BOOLEAN DEFAULT true,
  auto_outreach_enabled BOOLEAN DEFAULT false,
  last_monitored_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### signals table
```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),

  -- Signal basics
  signal_type TEXT,              -- hiring/funding/leadership/product
  signal_summary TEXT NOT NULL,
  source_url TEXT,

  -- OLD intelligence
  pain_point TEXT,
  outreach_angle TEXT,
  email_subject TEXT,
  email_body TEXT,

  -- NEW Product Intelligence (Added March 2026)
  product_insight TEXT,          -- Why they need help
  opportunity TEXT,              -- How YOUR product solves it
  relevance_score INTEGER,       -- 1-10 fit score
  target_persona TEXT,           -- Who to contact
  action TEXT,                   -- What to do now
  reason TEXT,                   -- Why now is the moment
  priority TEXT,                 -- high/medium/low
  should_contact BOOLEAN,        -- Auto-decision
  tech_stack JSONB,              -- Technologies used

  -- Prospect details
  prospect_name TEXT,
  prospect_email TEXT,
  prospect_title TEXT,
  prospect_linkedin TEXT,

  -- Deduplication & state
  signal_hash TEXT UNIQUE,       -- MD5 for dedup
  is_new BOOLEAN DEFAULT true,
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### outreach table
```sql
CREATE TABLE outreach (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES signals(id),
  account_id UUID REFERENCES accounts(id),
  to_email TEXT,
  subject TEXT,
  body TEXT,
  channel TEXT,                  -- 'email' | 'linkedin'
  status TEXT,                   -- 'sent' | 'opened' | 'replied'
  sent_at TIMESTAMP DEFAULT NOW()
);
```

### sequences table
```sql
CREATE TABLE sequences (
  id UUID PRIMARY KEY,
  signal_id UUID REFERENCES signals(id),
  prospect_email TEXT,
  steps JSONB,                   -- Array of {subject, body, delay_days}
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',  -- active/paused/completed
  last_step_at TIMESTAMP,
  next_step_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🏗️ CODE ARCHITECTURE

### Main Files

**1. openclaw-daemon/src/index.ts** (Main Daemon)
- `start()` - Initializes BullMQ worker
- `scheduleDailyScan()` - Schedules 8am runs
- `runDailyScan()` - Executes daily discovery
- `processDiscoveryJob()` - Handles discovery workflow
- `processMonitorJob()` - Handles monitoring workflow
- `checkDueSequences()` - Email sequence scheduler (every 30min)

**2. openclaw-daemon/src/openclawClient.ts** (AI Agents)
- `runDiscoveryAgent(pitch)` - Finds 10-15 companies via Tavily + GPT
- `runMonitorAgent(company, domain, pitch)` - Analyzes signals via Tavily + GPT
- `deliverAlert(company, result, signalId)` - Sends Telegram notification
- `deliverOutreach(result, signalId, accountId)` - Sends email via Resend

**3. backend/main.py** (FastAPI Backend)
- `/health` - Health check
- `/api/pitch` - Queue discovery job
- `/api/accounts` - CRUD for companies
- `/api/signals` - Fetch all signals
- `/api/actions` - Fetch actionable signals (should_contact=true)
- `/api/gmail/connect` - Gmail OAuth flow
- `/api/outreach/send` - Send outreach email

**4. frontend/** (Next.js Dashboard)
- Signal feed with filters
- Company details
- Manual discovery form

---

## 🚀 DEPLOYMENT (CURRENT)

### Services
- **Backend**: Railway (https://backend-production-d5926.up.railway.app/)
- **Frontend**: Vercel (https://frontend-swq6kqnwl-shashank100s-projects.vercel.app)
- **Daemon**: Railway (Service ID: 8c687b6a-5e93-4859-8d88-697ef734159a)
- **Database**: Supabase PostgreSQL

### Environment Variables
```bash
# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY...
OPENAI_MODEL=gpt-5-mini

# Tavily Search
TAVILY_API_KEY=tvly-dev-...

# Supabase
SUPABASE_URL=https://ybcomqhhtrwfygshhyat.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Telegram
TELEGRAM_BOT_TOKEN=8715850403:AAGW-...
TELEGRAM_CHAT_ID=2042406431

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Gmail OAuth (NEW)
GMAIL_CLIENT_ID=YOUR_GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_GMAIL_CLIENT_SECRET
```

---

## 📈 EXPECTED DAILY OUTPUT

| Metric | Daily | Weekly | Monthly |
|--------|-------|--------|---------|
| Companies discovered | 10-15 | 70-100 | 300-400 |
| Total signals detected | 10-20 | 70-140 | 300-600 |
| High priority signals | 2-5 | 15-35 | 60-150 |
| Telegram alerts | 2-5 | 15-35 | 60-150 |

---

## 🔮 SYSTEM 2: EMAIL INTELLIGENCE (IN PROGRESS)

### Planned Flow

```
Every 30 minutes:
    ↓
Check Gmail inbox (last 30 min)
    ↓
For each new email thread:
    ├─ Qualify lead (1-10 score)
    ├─ Research company (web scraping)
    ├─ Generate follow-up (references conversation)
    ├─ Detect meeting requests
    └─ Auto-schedule if requested
    ↓
Send Telegram: "3 qualified leads (score 8+)"
```

### New Database Tables (Created)
- `email_threads` - Email conversations with lead scoring
- `email_messages` - Individual messages
- `email_followups` - Generated follow-up drafts
- `email_monitor_jobs` - Inbox scan tracking

### New AI Agent (Created)
- `emailIntelligenceAgent.ts`:
  - `qualifyLead()` - Score emails 1-10
  - `generateFollowUp()` - Write contextual replies
  - `researchCompany()` - Pull website intel
  - `analyzeMeetingRequest()` - Detect scheduling

### Still TODO
1. Inbox monitoring daemon (fetch Gmail every 30min)
2. Company research integration
3. Google Calendar booking
4. Backend API endpoints
5. Frontend email dashboard

---

## 🎯 FINAL PRODUCT VISION (ClawGTM-style)

### What It Will Do:

**Inbound (Email Intelligence)**
- Monitor inbox every 30min
- Qualify leads automatically (1-10 score)
- Research companies in background
- Generate contextual follow-ups
- Auto-book meetings from scheduling requests

**Outbound (Current System)**
- Discover 10-15 NEW companies daily
- Identify buying signals automatically
- Score relevance to YOUR product
- Alert via Telegram for hot leads
- Auto-send outreach emails (optional)

**Dashboard**
- Unified feed: emails + discovered signals
- Lead scoring across both channels
- One-click send for AI-generated replies
- Calendar integration
- Company research sidebar

---

**Last Updated**: March 25, 2026
**Status**: System 1 (Discovery) LIVE ✅ | System 2 (Email) 50% Complete 🚧
