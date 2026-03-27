# Geodo — Progress Report

_Last updated: March 19, 2026_

---

## 🚀 NEW: Product-Led B2B Discovery (V2 Core)

We have pivoted from a generic researcher to a **Product-Led Sales Intelligence Engine**. Instead of just looking up companies, Geodo now starts with **what you sell** and finds the companies that need it.

### The "Airbyte" Flow (Implemented)
1. **🎯 User Input:** "We sell data integration tools for modern data teams."
2. **🧠 AI Inference:** System infers the ICP (e.g., companies with Snowflake/BigQuery, hiring data engineers).
3. **🔍 Autonomous Discovery:** Tavily searches the web for real companies matching this inferred ICP.
4. **📡 Signal-to-Product Mapping:** Every hiring/funding signal detected is evaluated through the lens of the user's pitch.
5. **🎯 Action Plan:** Generates outreach (e.g., "Saw you're hiring data engineers — our ETL tool can help") and finds the right prospect.
6. **🤖 OpenClaw Execution:** Delivers high-priority alerts to WhatsApp/Telegram and sends automated emails.

---

## ✅ What's Working (V2 Updates)

### 🧠 Intelligence Layer
- ✅ **Dynamic ICP Discovery:** `runDiscoveryAgent` now generates multi-step search queries based on the user's product pitch.
- ✅ **Context-Aware Monitoring:** `runMonitorAgent` now accepts `userPitch` as a prompt constraint, mapping signals to specific product value props.
- ✅ **Dynamic Pitching:** Outreach templates are now generated based on the intersection of the detected signal and the user's product.

### ⚙️ Backend & Infrastructure
- ✅ **Pitch Persistence:** Added `user_pitch` column to the `accounts` table via SQL migration.
- ✅ **New API Endpoint:** `POST /api/pitch` for starting discovery jobs.
- ✅ **Contextual Worker:** The daemon now carries the `user_pitch` through the entire lifecycle (Discovery → Account Creation → Daily Monitoring).

### 💻 Frontend (Next.js)
- ✅ **"Find Leads" Mode:** Added a toggle to the home page for product-led discovery.
- ✅ **ICP UI:** Updated placeholders and examples to reflect B2B sales use cases (Data tools, HR software, DevTools).
- ✅ **Real-time Redirection:** Automated flow from Pitch → Account Discovery → Signal Feed.

---

## 🟢 System Architecture (V2.5 - Enhanced)

```
User Pitch ("I sell X")
       ↓
Discovery Agent (Tavily + GPT-5-mini)
  • Generates 3 dynamic search queries
  • Finds 10 companies matching ICP
       ↓
Account List (saved to DB with user_pitch)
       ↓
Monitor Agent (Daily Scan via OpenClaw)
  • Web research for signals
  • Maps to product pitch
       ↓
Signal-to-Product Mapping
  • Product Insight: What the signal reveals
  • Opportunity: How YOUR product solves it
  • Relevance Score: 1-10 fit score
       ↓
Delivery Layer (OpenClaw-Powered)
  • Telegram Alerts → You (high-priority signals)
  • Email Outreach → Prospects (automated)
```

---

## ✅ Status: 🟢 V2 Core Ready

### Components
- `backend/` — FastAPI handling accounts, signals, and pitch-based discovery triggers.
- `openclaw-daemon/` — The "brain" processing jobs, monitoring web signals, and mapping them to user products.
- `frontend/` — Clean, mono-styled Next.js app for research and lead management.
- `database/` — Supabase with RLS and the new `user_pitch` schema.

---

## 📋 Next Steps

### Immediate Actions (V2.5)
- [ ] **Get API Keys:**
  - [ ] Tavily API key (https://tavily.com) - Already had one, need to restore
  - [ ] Telegram bot token (via @BotFather on Telegram)
  - [ ] Telegram chat ID (from bot API)
- [ ] **Database Migrations:** Run in Supabase SQL Editor:
  - [ ] `migration_pitch.sql` - Adds user_pitch column
  - [ ] `migration_final_sync.sql` - Adds prospect fields
  - [ ] `migration_product_insights.sql` - Adds intelligence fields (NEW)
- [ ] **Local Testing:**
  - [ ] Start backend, daemon, frontend
  - [ ] Test discovery flow with sample pitch
  - [ ] Verify Telegram alert delivery
- [ ] **Deployment:**
  - [ ] Deploy Backend to Railway with all env vars
  - [ ] Deploy Daemon to Railway with all env vars
  - [ ] Verify production Telegram alerts work

### Roadmap
- **Phase 3: Deep Research:** Expand discovery to look at TechStacks (BuiltWith) to find companies using specific competitors.
- **Phase 4: CRM Sync:** Push discovered leads and signals directly into HubSpot/Salesforce with the generated pitch context.

---

## 📝 Recent Updates

### March 20, 2026 - V2.5: Product Intelligence + Telegram-First

**New Features:**
- ✅ **Product Insight Field:** Signals now include `product_insight` - what the signal reveals about their technical needs/challenges
- ✅ **Opportunity Field:** Each signal shows how YOUR specific product solves the detected problem
- ✅ **Relevance Scoring:** 1-10 score showing product-market fit for each signal
- ✅ **Enhanced Telegram Alerts:** Beautiful formatted alerts showing Insight + Opportunity + Relevance
- ✅ **WhatsApp Removed:** Simplified to Telegram-only for alerts (Email still used for prospect outreach)

**Database Schema:**
- ✅ Created `migration_product_insights.sql` - Adds product intelligence fields to signals table
- ✅ Fields added: `product_insight`, `opportunity`, `relevance_score`, `target_persona`, `action`, `reason`, `confidence`, `priority`, `should_contact`, `tech_stack`

**Code Changes:**
- ✅ Updated `openclawClient.ts` - Enhanced MonitorResult interface with intelligence fields
- ✅ Updated AI prompt - Now generates product insights and opportunity mapping
- ✅ Updated `deliverAlert()` - New Telegram message format with structured intelligence
- ✅ Updated signal insert in daemon - Saves all new fields to database

**Configuration:**
- ✅ Added `TAVILY_API_KEY` to .env (required for discovery)
- ✅ Added `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to .env
- ✅ Updated `.env.example` with all required keys

### March 19, 2026 - V2.0: Product-Led Discovery

**Completed:**
- ✅ Implemented **runDiscoveryAgent** with dynamic ICP query generation.
- ✅ Refactored **runMonitorAgent** to support product-contextual research.
- ✅ Added **user_pitch** persistence to the database and background jobs.
- ✅ Updated Frontend to support **"Find Leads"** mode.
- ✅ Renamed 'Thesis' workflow to **'Product-Led Pitch'** workflow for better market fit.

**Architecture:**
- ✅ Daemon now handles both `monitor` and `discovery` job types.
- ✅ Pitch context is preserved across daily scans.
- ✅ OpenClaw powers web research, delivery, and email outreach.
