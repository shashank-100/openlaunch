# 🔥 Real-Time Signal Monitoring System

## The New Architecture (What You Actually Want)

**NOT:** Daily batch discovery at 8am
**YES:** Continuous signal monitoring every 2 hours with immediate action

---

## 🎯 The Flow You Described

```
Every 2 Hours:
    ↓
Tavily searches for FRESH signals:
  • "B2B SaaS companies that raised funding today"
  • "startups hiring VP Sales this week"
  • "companies that launched new product today"
    ↓
For each signal found (relevance >= 7):
    ↓
    Research company (Tavily)
    ↓
    Write personalized email using signal as hook (Claude API)
    ↓
    Send to Telegram for approval
    ↓
    ┌─────────────────────────────┐
    │ You tap ✅ in Telegram      │
    └─────────────────────────────┘
    ↓
    Email sends via Gmail
    ↓
    Logged to Supabase
    ↓
┌────────────────────────────────────────┐
│ Meanwhile, Every 30 Minutes:           │
│                                        │
│ Check Gmail for replies                │
│    ↓                                   │
│ If reply is interested:                │
│    ↓                                   │
│    Draft response (Claude API)         │
│    ↓                                   │
│    Send to Telegram for approval       │
│    ↓                                   │
│ You tap ✅                              │
│    ↓                                   │
│    Reply sends                         │
└────────────────────────────────────────┘
```

---

## 🏗️ Architecture Design

### Component 1: Signal Scanner (Every 2 Hours)

**Purpose:** Find fresh buying signals in real-time

**Queries (Dynamic):**
```
Based on your pitch: "We sell AI-powered sales automation"

Generate time-sensitive queries:
- "B2B SaaS companies raised funding today"
- "startups hiring VP Sales this week"
- "SaaS companies launched product today"
- "companies switching from Salesforce announced today"
- "tech companies expanding sales team 2026"
```

**For Each Result:**
1. Extract: company name, signal, source URL
2. Score relevance: 1-10 vs your pitch
3. If score >= 7 → proceed
4. Research company (domain, size, tech stack)
5. Write personalized email referencing the signal
6. Send to Telegram with approval buttons

### Component 2: Telegram Approval Bot

**Message Format:**
```
🔥 NEW SIGNAL

Company: Snowflake Inc.
Signal: Raised $100M Series C (announced 2 hours ago)
Relevance: 9/10

📧 Proposed Email:
To: jane@snowflake.com (VP Sales)
Subject: Congrats on the Series C!

Hey Jane,

Just saw Snowflake raised $100M — congrats!

With that kind of growth capital, you're probably
scaling the sales team fast. We help companies like
yours automate lead enrichment so SDRs can focus on
selling, not researching.

Worth a quick chat?

Best,
[Your name]

[✅ Send] [✏️ Edit] [❌ Skip]
```

**Actions:**
- ✅ Send → Sends email via Gmail API
- ✏️ Edit → Opens text input for edits
- ❌ Skip → Logs as skipped, no email sent

### Component 3: Reply Monitor (Every 30 Min)

**Purpose:** Watch Gmail for replies to sent emails

**Flow:**
1. Fetch Gmail inbox (last 30 min)
2. Match emails to sent outreach (via thread ID)
3. For each reply:
   - Classify intent: interested / not-interested / meeting-request / question
   - If interested/meeting/question:
     - Draft response (Claude API)
     - Send to Telegram for approval
   - If not-interested:
     - Log and archive

### Component 4: Reply Response System

**Telegram Message:**
```
📬 REPLY RECEIVED

From: Jane @ Snowflake
Original: You sent email about Series C funding
Reply: "Interesting! Can you send pricing?"

🤖 Suggested Response:

Hey Jane,

Absolutely! Our pricing is usage-based:

- Starter: $500/mo (up to 1,000 leads)
- Growth: $1,500/mo (up to 10,000 leads)
- Enterprise: Custom (unlimited)

Most Series C companies like Snowflake start
on Growth and scale to Enterprise as the team
grows.

Happy to walk you through a demo if helpful.
Does Thursday at 2pm work?

[✅ Send] [✏️ Edit]
```

---

## 🛠️ Implementation Plan

### Step 1: Build Signal Scanner

**File:** `openclaw-daemon/src/signalScanner.ts`

**Features:**
- Runs every 2 hours
- Dynamic query generation based on user pitch
- Tavily search for fresh signals (filter: last 24-48 hours)
- Relevance scoring
- Company research
- Email composition
- Telegram approval request

### Step 2: Build Telegram Bot

**File:** `openclaw-daemon/src/telegramBot.ts`

**Features:**
- Inline keyboard buttons (✅ Send, ✏️ Edit, ❌ Skip)
- Handle button callbacks
- Send email via Gmail API on approval
- Edit flow (capture text input)
- Log all actions to Supabase

### Step 3: Build Reply Monitor

**File:** `openclaw-daemon/src/replyMonitor.ts`

**Features:**
- Fetch Gmail every 30 min
- Match to sent outreach (thread tracking)
- Classify reply intent (GPT-4o)
- Draft responses for interested replies
- Send to Telegram for approval

### Step 4: Database Schema Updates

**New Tables:**
```sql
-- Track signal-based outreach
CREATE TABLE signal_outreach (
  id UUID PRIMARY KEY,
  signal_type TEXT,
  signal_summary TEXT,
  company_name TEXT,
  company_domain TEXT,
  source_url TEXT,
  relevance_score INTEGER,

  -- Email details
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_title TEXT,
  email_subject TEXT,
  email_body TEXT,

  -- Approval workflow
  telegram_message_id TEXT,
  approval_status TEXT, -- 'pending', 'approved', 'edited', 'rejected'

  -- Sending status
  sent_at TIMESTAMP,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Track replies
CREATE TABLE signal_replies (
  id UUID PRIMARY KEY,
  outreach_id UUID REFERENCES signal_outreach(id),
  gmail_message_id TEXT,

  from_email TEXT,
  reply_body TEXT,
  reply_intent TEXT, -- 'interested', 'not-interested', 'meeting', 'question'

  -- Response
  response_drafted BOOLEAN,
  response_body TEXT,
  response_approved BOOLEAN,
  response_sent_at TIMESTAMP,

  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Expected Performance

### Signal Discovery (Every 2 Hours)

**12 runs/day:**
- Signals found: 10-20 per run
- Relevant signals (>= 7): 3-5 per run
- **Total/day: 36-60 outreach opportunities**

**Approval workflow:**
- You review in Telegram: ~2 min per signal
- Approve ~50% → 18-30 emails sent/day

### Reply Monitoring (Every 30 Min)

**48 runs/day:**
- Replies detected: 2-5/day
- Interested replies: 1-3/day
- **Responses drafted: 1-3/day**

### Daily Output

| Metric | Count |
|--------|-------|
| Signals scanned | 120-240 |
| Relevant signals | 36-60 |
| Emails approved & sent | 18-30 |
| Replies received | 2-5 |
| Responses sent | 1-3 |

---

## 🎯 Key Differences from Current System

### Current System (Batch)
- ❌ Runs once daily at 8am
- ❌ Finds companies, not signals
- ❌ Static "discovery" mode
- ❌ No approval workflow
- ❌ No reply monitoring

### New System (Real-Time)
- ✅ Runs every 2 hours (12x/day)
- ✅ Finds fresh SIGNALS (funding, hiring, launches)
- ✅ Time-sensitive queries ("today", "this week")
- ✅ Telegram approval before sending
- ✅ Auto-drafts replies to responses
- ✅ Continuous feedback loop

---

## 💰 Cost Estimate

### AI Costs

**Signal Scanner (every 2 hours):**
- Query generation: $0.01 (GPT-4o-mini)
- Tavily searches: $0.05 (5 queries)
- Relevance scoring: $0.10 (GPT-4o × 15 signals)
- Email composition: $0.15 (GPT-4o × 5 emails)
- **Per run: $0.31**
- **Per day: $3.72** (12 runs)

**Reply Monitor (every 30 min):**
- Reply classification: $0.05
- Response drafting: $0.10
- **Per day: $0.15**

**Total: ~$4/day = $120/month**

### Value

**Outreach volume:**
- 18-30 personalized emails/day
- vs hiring SDR: $50k/year
- **ROI: 5x+**

---

## 🚀 Implementation Timeline

### Day 1 (4 hours)
- Build signal scanner
- Tavily integration
- Relevance scoring
- Email composition

### Day 2 (4 hours)
- Build Telegram bot
- Approval workflow (buttons)
- Gmail sending on approval
- Edit flow

### Day 3 (3 hours)
- Build reply monitor
- Intent classification
- Response drafting
- Telegram approval for replies

### Day 4 (2 hours)
- Database migrations
- Integration testing
- Deploy to production
- Monitor first 24 hours

**Total: ~13 hours over 4 days**

---

## 🎬 Example End-to-End Flow

### 10:00 AM - Signal Found

**Tavily finds:**
```
"Snowflake announces $100M Series C funding"
Source: TechCrunch, published 2 hours ago
```

**System processes:**
1. Company: Snowflake Inc.
2. Relevance: 9/10 (data infrastructure, matches pitch)
3. Research: ~500 employees, uses Salesforce, looking for sales automation
4. Prospect: Jane Doe, VP Sales (from LinkedIn search)
5. Email composed with signal hook

**Telegram notification sent at 10:05 AM**

### 10:10 AM - You Approve

You tap ✅ in Telegram

**Email sends immediately:**
```
To: jane@snowflake.com
Subject: Congrats on the Series C!
[Personalized email referencing funding news]
```

### 2:30 PM - Reply Received

Jane replies:
```
"Thanks! Yes, we're hiring 20 SDRs.
Can you send pricing and a demo link?"
```

**System detects reply:**
- Intent: interested + question
- Drafts response with pricing + Calendly link
- Sends to Telegram

### 2:35 PM - You Approve Reply

You tap ✅

**Response sends:**
```
Hey Jane,

Great timing! Here's our pricing...
[Details + demo link]

I can also walk you through it personally.
Does Thursday at 2pm work?
```

### 2 Days Later - Meeting Booked

Jane books meeting via Calendly.
You close the deal. 🎉

**Total time spent:** 5 minutes (2 Telegram approvals)
**Result:** Qualified lead → demo → customer

---

## ✅ Next Steps

**Want me to build this real-time signal system instead of the email inbox monitoring?**

This seems more aligned with what you're describing:
- Proactive outbound based on fresh signals
- Telegram approval workflow
- Reply monitoring & auto-responses
- Continuous operation (not just 8am)

**Shall I start building the signal scanner?**

