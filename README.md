# INTAKE — AI Revenue Researcher

**Powered by OpenClaw**

Before every sales meeting, Intake deploys AI agents that research the prospect across the live web and deliver a complete intel brief — automatically, in minutes, with zero effort from the rep.

---

## 🚀 What Intake Does

Intake eliminates manual prospect research by:

1. **Auto-detecting** calendar meetings with external prospects
2. **Deploying OpenClaw agents** to research across 10 live web sources
3. **Generating AI briefs** with Claude that include company intel, signals, and suggested openers
4. **Delivering** briefs via Slack, email, or CRM 30 minutes before each meeting

## 📁 Project Structure

```
intake/
├── backend/              # Express API server
│   ├── src/
│   │   ├── index.ts     # Main server entry
│   │   ├── routes/      # API routes (webhook, briefs, calendar, auth)
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── openclaw-daemon/      # OpenClaw research engine
│   ├── src/
│   │   ├── index.ts     # Worker daemon
│   │   ├── agents/      # Research agent
│   │   ├── sources/     # 10 research sources
│   │   └── utils/       # Signal detector
│   └── package.json
│
├── frontend/             # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx     # Landing page
│   │   └── dashboard/   # Dashboard UI
│   └── package.json
│
├── database/
│   └── schema.sql       # Supabase database schema
│
└── .env.example         # Environment variables template
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Agent Core** | OpenClaw | Live web research, zero API dependency |
| **Job Queue** | Redis + BullMQ | Concurrent jobs, retries, priority handling |
| **Backend** | Node.js + Express | Webhook receiver, job dispatch |
| **Brief Generation** | Claude API (Sonnet 4.5) | Analyst-quality intelligence briefs |
| **Database** | Supabase (PostgreSQL) | Briefs, agent logs, user data |
| **Frontend** | Next.js + Tailwind | Dashboard and settings |
| **Auth** | Supabase Auth + OAuth | Google/Outlook calendar, Slack |
| **Delivery** | Slack API + SendGrid | Push briefs where reps live |
| **Browser Automation** | Playwright | Headless browser for OpenClaw |

---

## 📦 Installation

### Prerequisites

- Node.js 20+
- Redis (local or cloud)
- Supabase account
- Anthropic API key
- Google Cloud project (for calendar OAuth)
- Slack app (optional)

### 1. Clone and Install Dependencies

```bash
cd intake

# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Google Calendar OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Slack (optional)
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx

# SendGrid (optional)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Set Up Database

1. Create a Supabase project at https://supabase.com
2. Run the schema:

```bash
# Copy the SQL from database/schema.sql
# Go to Supabase SQL Editor and paste + run
```

### 4. Install Playwright Browsers

```bash
cd openclaw-daemon
npx playwright install chromium
```

### 5. Start Redis

```bash
# macOS (Homebrew)
brew services start redis

# Or Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## 🎯 Running Intake

### Development Mode (All Services)

```bash
# From root directory
npm run dev
```

This starts:
- **Backend API** on http://localhost:4000
- **Frontend** on http://localhost:3000
- **OpenClaw Daemon** (worker process)

### Run Services Individually

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# OpenClaw daemon only
npm run dev:daemon
```

---

## 🧪 Testing the System

### 1. Trigger a Research Job (Manual)

```bash
curl -X POST http://localhost:4000/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Anthropic",
    "contactName": "Claude Assistant",
    "contactEmail": "claude@anthropic.com",
    "meetingTime": "2024-01-20T15:00:00Z",
    "userId": "test-user-id",
    "organizationId": "test-org-id",
    "priority": 5
  }'
```

### 2. Check Job Status

```bash
curl http://localhost:4000/api/webhook/job/{jobId}
```

### 3. View Briefs

Visit: http://localhost:3000/dashboard

---

## 📊 The 10 Research Sources

Intake's OpenClaw agents visit these sources for every job:

| # | Source | What It Extracts |
|---|--------|------------------|
| 1 | **Company Website** | Product, customers, team signals |
| 2 | **LinkedIn Company** | Employee count, growth, hiring |
| 3 | **LinkedIn Contact** | Role, tenure, recent activity |
| 4 | **Crunchbase** | Funding, investors, valuation |
| 5 | **Google News** | Recent launches, partnerships, leadership |
| 6 | **BuiltWith** | Tech stack (CRM, analytics, infra) |
| 7 | **LinkedIn Jobs** | Open roles by department |
| 8 | **G2** | Review themes, competitor mentions |
| 9 | **Twitter/X** | Contact's recent posts |
| 10 | **Company Blog** | Recent announcements |

---

## 🎯 Signal Detection

Intake automatically flags these high-value signals:

- **Hiring Surge** → They have budget and are building
- **Recent Funding** → New budget just unlocked
- **New Leadership** → New exec = new initiatives = opportunity
- **Competitor Evaluation** → They're shopping alternatives
- **Product Launch** → New initiatives underway
- **Decision Maker Detected** → Contact has budget authority

---

## 📝 Brief Format

Every brief contains 6 sections:

1. **Company Snapshot** — Size, stage, what they do
2. **Recent Signals** — Top 3 things from last 90 days
3. **Contact Intel** — Role, tenure, recent posts
4. **Tech Stack** — Current tools, gaps
5. **Competitive Context** — Who else they're evaluating
6. **Suggested Openers** — 3 personalized conversation starters

---

## 🔄 Calendar Integration

### Google Calendar Setup

1. Create OAuth credentials in Google Cloud Console
2. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
3. Enable Google Calendar API
4. Users connect via: `http://localhost:3000/api/calendar/connect/google?userId={userId}`

### Auto-Trigger Logic

- Watches for external meetings (non-internal email domains)
- Triggers research 30-120 minutes before meeting
- Skips internal 1:1s and team meetings
- Handles reschedules and cancellations

---

## 🚢 Deployment

### Railway / Render

```bash
# Build all services
npm run build

# Set environment variables in dashboard
# Deploy backend, daemon, and frontend separately
```

### Docker (Coming Soon)

```bash
docker-compose up -d
```

---

## 📈 Pricing Tiers

| Tier | Price | Users | Briefs/Month |
|------|-------|-------|--------------|
| **Starter** | $500/mo | 5 | 50 |
| **Growth** | $2,000/mo | 25 | Unlimited |
| **Team** | $5,000/mo | 100 | Unlimited + Custom |
| **Enterprise** | Custom | Unlimited | Full customization |

---

## 🔐 Security & Privacy

- All credentials stored encrypted in Supabase
- Row-level security (RLS) enabled
- OpenClaw agents use residential proxies
- No data retention beyond 90 days (configurable)
- SOC 2 compliant infrastructure

---

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Playwright Browsers Not Found

```bash
cd openclaw-daemon
npx playwright install
```

### Calendar OAuth Not Working

- Verify redirect URI matches exactly in Google Cloud Console
- Check that Calendar API is enabled
- Ensure environment variables are set correctly

### Research Jobs Failing

- Check agent logs in Supabase: `agent_logs` table
- Look for timeout or network errors
- Some sources (LinkedIn, Twitter) may require proxies in production

---

## 📚 API Documentation

### Webhook Endpoints

#### `POST /api/webhook/research`
Trigger a new research job

**Body:**
```json
{
  "companyName": "string",
  "contactName": "string",
  "contactEmail": "string",
  "meetingTime": "ISO 8601 datetime",
  "userId": "uuid",
  "organizationId": "uuid",
  "priority": 0-10
}
```

#### `GET /api/webhook/job/:jobId`
Get job status

### Brief Endpoints

#### `GET /api/briefs?userId={uuid}`
Get all briefs for user

#### `GET /api/briefs/:briefId`
Get specific brief with agent logs

#### `POST /api/briefs/:briefId/rate`
Rate a brief (feedback loop)

---

## 🎯 Roadmap

### MVP (Current)
- ✅ Core research engine
- ✅ 10 source extractors
- ✅ Signal detection
- ✅ Claude brief generation
- ✅ Calendar integration
- ✅ Dashboard

### V1.1 (Next)
- Slack delivery
- Email delivery
- CRM write-back
- Agent replay viewer
- Brief ratings

### V1.2 (Future)
- Custom research sources
- Team intelligence dashboard
- Continuous monitoring mode
- Multi-language support

---

## 🤝 Contributing

This is a private project. For questions or issues, contact: [your-email]

---

## 📄 License

Proprietary. All rights reserved.

---

## 🏗️ Built With

- [OpenClaw](https://github.com/anthropics/openclaw) - Web automation framework
- [Claude API](https://anthropic.com) - AI brief generation
- [Playwright](https://playwright.dev) - Browser automation
- [BullMQ](https://docs.bullmq.io) - Job queue
- [Supabase](https://supabase.com) - Database & auth
- [Next.js](https://nextjs.org) - Frontend framework

---

**🚀 Intake — Your reps spend 90 minutes researching. Intake does it in 4.**
