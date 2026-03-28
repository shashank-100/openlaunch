# GEODO INTAKE — Product-Led B2B Lead Discovery

**Powered by OpenClaw**

INTAKE is an autonomous revenue intelligence engine that discovers high-intent leads based on your product pitch. It monitors the live web for buying signals (hiring, funding, launches) and maps them directly to why a company needs *your* specific solution.

---

## 🚀 The INTAKE Workflow

INTAKE eliminates manual prospecting by automating the entire research-to-outreach lifecycle:

1. **🎯 Define Your Pitch:** Tell INTAKE what you sell (e.g., "Data integration tools for modern data teams").
2. **🧠 Autonomous Discovery:** INTAKE infers your Ideal Customer Profile (ICP) and uses Tavily to find matching companies.
3. **📡 Real-time Monitoring:** Deploys OpenClaw agents to monitor your target accounts across 10+ live web sources.
4. **💡 Product-Led Insights:** Every signal detected (e.g., hiring 5 data engineers) is automatically mapped to your product's value prop.
5. **🤖 Automated Outreach:** Generates personalized outreach and delivers it via WhatsApp, Telegram, or Email.

---

## 📁 Project Structure

```
geodo/
├── backend/              # FastAPI server (Python)
│   ├── main.py          # API entry, data layer, Gmail integration
│   └── requirements.txt
│
├── openclaw-service/     # OpenClaw skills & crons
│   ├── skills/
│   │   ├── signal-scanner/   # Discovers companies with buying signals
│   │   ├── follow-up/        # Generates personalized follow-ups
│   │   └── inbox-monitor/    # Monitors Gmail, classifies replies
│   └── HEARTBEAT.md     # Health monitoring instructions
│
├── frontend/             # Next.js dashboard (TypeScript)
│   ├── app/
│   │   ├── dashboard/   # Inbox, Sent, Replies, Chat sections
│   │   ├── settings/    # Persona, Gmail, preferences
│   │   └── api/chat/    # AI chat with pipeline context
│   └── package.json
│
├── database/
│   ├── schema.sql       # Base schema
│   └── RUN_THIS_IN_SUPABASE.sql # Email intelligence migrations
│
└── .env.example         # Environment variables template
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Agent Core** | OpenClaw | Autonomous AI agents with cron scheduling |
| **Discovery** | Tavily Search | Real-time web search for company discovery |
| **LLM** | GPT-4o / GPT-5-mini | Signal mapping, outreach, and reply handling |
| **Backend** | Python + FastAPI | Thin data layer + Gmail API integration |
| **Database** | Supabase (PostgreSQL) | Persistence, RLS, real-time updates |
| **Frontend** | Next.js + Tailwind | Clean dashboard with inbox/chat UI |
| **Delivery** | Gmail API / Telegram | Email outreach and instant notifications |

---

## 📦 Installation

### Prerequisites

- Node.js 20+ & Python 3.10+
- OpenClaw CLI (`npm install -g openclaw`)
- Supabase account
- OpenAI & Tavily API keys
- Gmail OAuth credentials

### 1. Set Up Database
Run migrations in your Supabase SQL editor:
1. `database/schema.sql`
2. `database/RUN_THIS_IN_SUPABASE.sql`

### 2. Set Up OpenClaw Crons

**Install OpenClaw skills:**
```bash
cd openclaw-service/skills
openclaw skill add signal-scanner
openclaw skill add follow-up
openclaw skill add inbox-monitor
```

**Create cron jobs:**
```bash
openclaw cron add --name geodo-signal-scan --every 2h --message "Run signal-scanner skill"
openclaw cron add --name geodo-follow-ups --every 30m --message "Run follow-up skill"
openclaw cron add --name geodo-inbox --every 30m --message "Run inbox-monitor skill"
```

### 3. Start Services

**Backend (deploy to Railway):**
```bash
cd backend
railway up
```

**Frontend (local dev):**
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Key Features

- **Autonomous Discovery:** OpenClaw agents discover companies with buying signals every 2 hours using Tavily.
- **Signal-to-Product Mapping:** AI-generated "Product Fit" insights for every detected event.
- **Intelligent Outreach:** Personalized emails crafted based on your pitch, tone, and ICP preferences.
- **Reply Intelligence:** Auto-classifies replies (interested, meeting request, objection) and drafts responses.
- **Follow-up Sequences:** Automated Day 3/7/14 follow-ups with different angles.
- **Multi-Channel Alerts:** Instant Telegram notifications for hot leads and replies.
- **Chat Interface:** Ask AI about your pipeline, analytics, and next best actions.

---

## 🚢 Deployment

GEODO is built for cloud deployment:
- **Frontend:** Vercel (or local)
- **Backend:** Railway
- **Database:** Supabase
- **OpenClaw:** Local gateway with remote agents

---

**🚀 GEODO — Stop searching for leads. Start catching signals.**
