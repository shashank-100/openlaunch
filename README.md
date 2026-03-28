# GEODO — Product-Led B2B Lead Discovery

**Powered by OpenClaw**

GEODO is an autonomous revenue intelligence engine that discovers high-intent leads based on your product pitch. It monitors the live web for buying signals (hiring, funding, launches) and maps them directly to why a company needs *your* specific solution.

---

## 🚀 The GEODO Workflow

GEODO eliminates manual prospecting by automating the entire research-to-outreach lifecycle:

1. **🎯 Define Your Pitch:** Tell GEODO what you sell (e.g., "Data integration tools for modern data teams").
2. **🧠 Autonomous Discovery:** GEODO infers your Ideal Customer Profile (ICP) and uses Tavily to find matching companies.
3. **📡 Real-time Monitoring:** Deploys OpenClaw agents to monitor your target accounts across 10+ live web sources.
4. **💡 Product-Led Insights:** Every signal detected (e.g., hiring 5 data engineers) is automatically mapped to your product's value prop.
5. **🤖 Automated Outreach:** Generates personalized outreach and delivers it via WhatsApp, Telegram, or Email.

---

## 📁 Project Structure

```
geodo/
├── backend/              # FastAPI server (Python)
│   ├── main.py          # API entry, job dispatch, pitch handling
│   └── requirements.txt
│
├── openclaw-daemon/      # OpenClaw research engine (TypeScript)
│   ├── src/
│   │   ├── index.ts     # Worker daemon (BullMQ)
│   │   └── openclawClient.ts # Research & Discovery agents
│   └── package.json
│
├── frontend/             # Next.js dashboard (TypeScript)
│   ├── app/
│   │   ├── page.tsx     # "Find Leads" Landing page
│   │   ├── feed/        # Signal Feed with Product Fit insights
│   │   └── accounts/    # Target account management
│   └── package.json
│
├── database/
│   ├── schema.sql       # Base schema
│   └── migration_pitch.sql # Product-led discovery updates
│
└── .env.example         # Environment variables template
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Agent Core** | OpenClaw | Live web research, zero API dependency |
| **Discovery** | Tavily Search | Real-time web search for company discovery |
| **LLM** | GPT-4o / GPT-5-mini | High-quality signal mapping and outreach |
| **Job Queue** | Redis + BullMQ | Concurrent jobs, retries, priority handling |
| **Backend** | Python + FastAPI | High-performance API, easy AI integration |
| **Database** | Supabase (PostgreSQL) | Persistence, RLS, real-time updates |
| **Frontend** | Next.js + Tailwind | Clean, mono-styled dashboard |
| **Delivery** | Resend / OpenClaw | Email, WhatsApp, and Telegram delivery |

---

## 📦 Installation

### Prerequisites

- Node.js 20+ & Python 3.10+
- Redis (local or cloud)
- Supabase account
- OpenAI & Tavily API keys

### 1. Set Up Database
Run the schema and migrations in your Supabase SQL editor:
1. `database/schema.sql`
2. `database/migration_v2.sql`
3. `database/migration_pitch.sql`

### 2. Start Services

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Daemon:**
```bash
cd openclaw-daemon
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Key Features

- **"Find Leads" Mode:** Discover up to 10 high-fit companies in seconds from a single product description.
- **Signal-to-Product Mapping:** AI-generated "Product Fit" insights for every detected event.
- **Auto-Pilot Outreach:** Automated email delivery for high-priority signals.
- **Multi-Channel Alerts:** Instant notifications via WhatsApp and Telegram for hot leads.
- **Daily Scans:** Automated daily re-monitoring of all accounts in your list.

---

## 🚢 Deployment

GEODO is built for cloud deployment:
- **Frontend:** Vercel
- **Backend/Daemon:** Railway
- **Database:** Supabase
- **Cache:** Redis (Railway Add-on)

---

**🚀 GEODO — Stop searching for leads. Start catching signals.**
