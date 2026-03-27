# 📊 Geodo - Product Summary & Status

## ✅ What's Working RIGHT NOW

### System 1: Automated B2B Lead Discovery (LIVE)

**What It Does:**
Every morning at 8am, automatically finds 10-15 NEW companies that need your product and tells you exactly who to contact and why.

**The Magic:**
```
8:00 AM → AI searches web for companies matching your ICP
         ↓
      Finds 10-15 perfect-fit companies
         ↓
      For each company:
      - Scans for buying signals (hiring, funding, product launches)
      - Evaluates: "Do they need MY product RIGHT NOW?"
      - Finds decision maker (name, email, LinkedIn)
      - Writes personalized outreach email
      - Scores relevance 1-10
         ↓
      High-priority leads → Telegram alert to your phone
         ↓
      You wake up with 3-5 hot leads ready to contact
```

**Example Telegram Alert You Receive:**
```
🔥 Snowflake Inc.
📡 Signal: Hiring VP of Data Engineering

🧠 Insight:
Scaling data team indicates growing pipeline complexity

💡 Opportunity:
Our ETL automation can reduce data engineering overhead by 40%

🎯 Relevance: 9/10
👤 Target: VP of Data Engineering
📧 Prospect: jane@snowflake.com (Jane Doe)

⚡️ Action: Send pricing deck for data integration tools
⏰ Why now: New hire = budget approved this quarter

[View Full Brief →]
```

**Intelligence Generated Per Lead:**
- ✅ Company name & website
- ✅ Buying signal detected (hiring/funding/product launch)
- ✅ Why they need YOUR product specifically
- ✅ How your product solves their problem
- ✅ Relevance score (1-10)
- ✅ Target persona (who to contact)
- ✅ Prospect details (name, email, job title, LinkedIn)
- ✅ Next action to take
- ✅ Why now is the right time
- ✅ Pre-written outreach email
- ✅ Tech stack they use

**Current Performance:**
- **Companies/day**: 10-15 new prospects
- **High-priority leads/day**: 2-5 actionable opportunities
- **Time saved**: ~4 hours of manual research per day
- **Cost**: ~$0.35/day in AI credits

---

## 🚧 What We're Building NOW

### System 2: Email Intelligence & Lead Qualification

**Goal:**
Check your inbox every 30 minutes and tell you which emails are actually worth your time.

**The Vision (ClawGTM-style):**
```
Every 30 Minutes:
    ↓
Check inbox for new emails
    ↓
For each email:
  ├─ AI scores 1-10: "Is this a real lead?"
  ├─ Researches company (pulls website, tech stack, team size)
  ├─ Writes follow-up that references the actual conversation
  ├─ Detects meeting requests
  └─ Auto-schedules using Google Calendar
    ↓
Telegram: "You have 3 qualified leads (score 8+)"
    ↓
Dashboard shows:
  - Lead score
  - Company research
  - AI-written follow-up (ready to send)
  - Meeting time slots (if requested)
```

**What It Will Tell You:**
- **Lead Score**: 1-10 (8+ = worth your time)
- **Qualification Reason**: "VP of Sales, mentions budget, needs demo"
- **Company Intel**: Industry, size, funding, tech stack, recent news
- **Pain Points**: Extracted from their emails
- **Buying Signals**: Budget mentions, urgency, decision-maker involvement
- **Next Action**: Specific step to take
- **AI Follow-up**: Pre-written reply that references their words
- **Meeting Intent**: Did they ask to schedule?

**Status: 50% Complete**

✅ Built:
- Database schema for email threads
- AI agent for lead qualification
- AI agent for follow-up generation
- AI agent for company research
- Gmail OAuth already connected

🚧 TODO:
- Inbox monitoring daemon (30-min intervals)
- Backend API endpoints
- Frontend email dashboard
- Google Calendar integration
- Deploy & test

**Time to Complete**: 2-3 hours

---

## 🎯 The Final Product (When Both Systems Work Together)

### Your Morning Routine:

**8:05 AM - Check Telegram**
```
🔥 3 new outbound leads from daily discovery
📧 2 inbound leads from your inbox (score 9/10)
📅 1 meeting request detected - auto-scheduled for 2pm
```

**8:10 AM - Open Dashboard**

**Tab 1: Outbound Leads (From Daily Discovery)**
| Company | Signal | Score | Prospect | Action |
|---------|--------|-------|----------|--------|
| Snowflake | Hiring VP Data | 9/10 | jane@snowflake.com | Send pricing |
| Databricks | Series B funding | 8/10 | john@databricks.com | Demo call |

**Tab 2: Inbound Leads (From Email)**
| Sender | Lead Score | Company | Next Step |
|--------|-----------|---------|-----------|
| Sarah Chen | 9/10 | HubSpot (500 emp) | Send case study |
| Mike Johnson | 8/10 | Stripe (2000 emp) | Schedule demo |

**Tab 3: Follow-ups (AI-Generated)**
```
To: sarah@hubspot.com
Subject: Re: Interested in your product

Hey Sarah,

You mentioned your team is struggling with manual lead enrichment
for your 50-person sales org. That's exactly what we solve.

Our platform auto-enriches leads with tech stack, hiring signals,
and decision-maker contact info — the stuff you said you're doing
manually in spreadsheets right now.

Happy to show you a 10-min demo this week. Does Thursday work?

[Send] [Edit] [Schedule]
```

**Tab 4: Calendar**
```
Today:
• 2:00 PM - Demo call with Mike Johnson (Stripe)
            Auto-scheduled from email request ✅
            [Company research sidebar shows: Stripe, fintech,
             2000 employees, uses Snowflake + Salesforce]
```

---

## 🏗️ Technical Architecture

### Working Code Files:

**1. Backend (FastAPI - Python)**
- `backend/main.py` - API server
  - Gmail OAuth flow (WORKING ✅)
  - Signal CRUD endpoints (WORKING ✅)
  - Account management (WORKING ✅)
  - Outreach sending via Gmail API (WORKING ✅)

**2. Daemon (Node.js/TypeScript)**
- `openclaw-daemon/src/index.ts` - Main scheduler
  - Daily 8am discovery (WORKING ✅)
  - BullMQ job processing (WORKING ✅)
  - Email sequence automation (WORKING ✅)

- `openclaw-daemon/src/openclawClient.ts` - AI Agents
  - Discovery Agent (Tavily + GPT-4o-mini) (WORKING ✅)
  - Monitor Agent (Tavily + GPT-4o) (WORKING ✅)
  - Telegram alerts (WORKING ✅)
  - Resend email sending (WORKING ✅)

- `openclaw-daemon/src/emailIntelligenceAgent.ts` - NEW
  - Lead qualification AI (BUILT ✅)
  - Follow-up generation AI (BUILT ✅)
  - Company research AI (BUILT ✅)
  - Meeting detection AI (BUILT ✅)

**3. Frontend (Next.js - React)**
- Signal feed with filters (WORKING ✅)
- Company detail pages (WORKING ✅)
- Settings with Gmail connect (WORKING ✅)

**4. Database (Supabase - PostgreSQL)**
- `accounts` table - Companies being tracked (WORKING ✅)
- `signals` table - Buying signals detected (WORKING ✅)
- `outreach` table - Emails sent (WORKING ✅)
- `sequences` table - Multi-step email campaigns (WORKING ✅)
- `email_threads` table - Email intelligence (SCHEMA READY ✅)
- `email_messages` table - Individual emails (SCHEMA READY ✅)
- `email_followups` table - AI drafts (SCHEMA READY ✅)

### Deployment:

**Production URLs:**
- Backend: https://backend-production-d5926.up.railway.app/
- Frontend: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- Database: Supabase (ybcomqhhtrwfygshhyat)

**Infrastructure:**
- Backend: Railway
- Frontend: Vercel
- Daemon: Railway (auto-deploys, runs 24/7)
- Database: Supabase PostgreSQL
- Email: Gmail API (OAuth connected ✅)
- Notifications: Telegram Bot API

### Credentials:

**Gmail OAuth (READY ✅)**
```
Client ID: YOUR_GMAIL_CLIENT_ID
Client Secret: YOUR_GMAIL_CLIENT_SECRET
Redirect URI: https://backend-production-d5926.up.railway.app/api/gmail/callback
```

**Telegram (WORKING ✅)**
```
Bot Token: 8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw
Chat ID: 2042406431
```

**OpenAI (WORKING ✅)**
```
API Key: YOUR_OPENAI_API_KEY...
Model: gpt-5-mini (discovery), gpt-4o (monitoring)
```

**Tavily Search (WORKING ✅)**
```
API Key: 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
```

---

## 📊 Data Flow Summary

### Daily Discovery Flow (Working):
```
User Pitch in DB
    ↓
[8am Trigger]
    ↓
GPT-4o-mini generates 3 search queries
    ↓
Tavily searches web (15 results)
    ↓
GPT-4o synthesizes 10-15 companies
    ↓
FOR EACH COMPANY:
    ↓
    Tavily searches for signals
    ↓
    GPT-4o analyzes:
    - Does company need MY product?
    - What's the pain point?
    - Who should I contact?
    - What should I say?
    ↓
    Save to signals table (with dedup)
    ↓
    IF high-priority → Telegram alert
    ↓
END LOOP
    ↓
Wait 24 hours, repeat
```

### Email Intelligence Flow (In Progress):
```
[Every 30 minutes]
    ↓
Fetch Gmail inbox (new emails)
    ↓
FOR EACH EMAIL THREAD:
    ↓
    GPT-4o qualifies lead (1-10 score)
    ↓
    IF score >= 7:
        ↓
        Research company (web scraping)
        ↓
        Generate follow-up (references conversation)
        ↓
        Detect meeting request
        ↓
        Save to email_threads table
        ↓
        IF score >= 8 → Telegram alert
    ↓
END LOOP
    ↓
Dashboard shows all qualified leads
```

---

## 🎯 Next Steps to Complete Email Intelligence

1. **Build Inbox Monitor Daemon** (~45 min)
   - Fetch Gmail every 30 min
   - Call `qualifyLead()` for each thread
   - Save to `email_threads` table

2. **Add Backend API Endpoints** (~30 min)
   - `GET /api/email-threads` - List all threads
   - `GET /api/email-threads/:id` - Get details
   - `POST /api/email-followups/:id/send` - Send AI reply
   - `POST /api/calendar/schedule` - Book meeting

3. **Build Frontend Email Dashboard** (~45 min)
   - Email inbox view with lead scores
   - Company research sidebar
   - Follow-up editor
   - Meeting scheduler

4. **Google Calendar Integration** (~30 min)
   - OAuth flow (similar to Gmail)
   - Auto-schedule meetings
   - Add to calendar from dashboard

5. **Deploy & Test** (~30 min)
   - Run migrations
   - Deploy daemon changes
   - Test end-to-end flow

**Total Time: ~3 hours**

---

## 💰 Cost Breakdown

### Current (System 1 Only):
- **Daily AI Cost**: ~$0.35
  - Discovery: $0.02 (GPT-4o-mini)
  - Monitoring: $0.30 (GPT-4o × 10 companies)
  - Tavily Search: $0.03
- **Monthly**: ~$10.50
- **Infrastructure**: Free (Railway/Vercel/Supabase free tiers)

### With Email Intelligence (System 1 + 2):
- **Additional Daily Cost**: ~$0.50
  - Email qualification: $0.20 (GPT-4o × ~30 emails/day)
  - Company research: $0.15
  - Follow-up generation: $0.15
- **Total Monthly**: ~$25
- **Time Saved**: ~6 hours/day of manual work
- **ROI**: One qualified lead = $$$

---

## 🚀 Value Proposition

**What You Get:**
- ✅ 10-15 new outbound leads every morning (automated)
- 🚧 Inbox triaged automatically (qualified vs noise)
- 🚧 Follow-ups written for you (reference actual conversation)
- 🚧 Meetings auto-scheduled (no back-and-forth)
- ✅ Company research done before you open email
- ✅ Real-time Telegram alerts for hot opportunities

**What You Stop Doing:**
- ❌ Manually searching for companies
- ❌ Researching prospects on LinkedIn
- ❌ Reading every sales email
- ❌ Writing follow-ups from scratch
- ❌ The scheduling email dance

**Time Saved:**
- 4 hours/day on outbound prospecting
- 2 hours/day on inbox management
- **Total: 6 hours/day = 30 hours/week**

---

**Last Updated**: March 25, 2026
**Current Status**: System 1 LIVE ✅ | System 2 In Progress (50% complete) 🚧
