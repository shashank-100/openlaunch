# 🧹 File Cleanup Guide

## Current Files - What to Keep vs Remove

---

## ✅ KEEP - Essential Files

### Core Code (openclaw-daemon/src/)
```
✅ index.ts                    - Main daemon (daily discovery + sequences)
✅ openclawClient.ts          - AI agents (discovery + monitoring)
✅ signalScanner.ts           - NEW: Real-time signal scanner (every 2 hours)
```

### Documentation
```
✅ README.md                   - Project overview
✅ REAL_TIME_SIGNAL_SYSTEM.md - NEW system architecture (what you want)
✅ RUN_THIS_IN_SUPABASE.sql   - Database migrations
```

---

## ❌ REMOVE - Unnecessary Files

### Old Email Intelligence System (NOT WHAT YOU WANT)
```
❌ openclaw-daemon/src/emailIntelligenceAgent.ts  - Delete (inbox monitoring, not signal-based)
❌ openclaw-daemon/src/emailMonitor.ts            - Delete (not needed)
❌ DEPLOY_EMAIL_INTELLIGENCE.md                   - Delete (wrong system)
❌ EMAIL_INTELLIGENCE_COMPLETE.md                 - Delete (wrong system)
```

### Old Documentation (Outdated)
```
❌ DAILY_DISCOVERY_UPDATE.md       - Delete (superseded)
❌ DEPLOYMENT_COMPLETE.md          - Delete (old)
❌ DEPLOYMENT_GUIDE.md             - Delete (old)
❌ FINISH_DEPLOYMENT.md            - Delete (old)
❌ IMPLEMENTATION_COMPLETE.md      - Delete (old)
❌ PROGRESS.md                     - Delete (outdated)
❌ TEST_RESULTS_DAILY_DISCOVERY.md - Delete (old tests)
❌ WHATS_NEXT.md                   - Delete (outdated)
❌ TELEGRAM_SETUP.md               - Delete (basic, not needed)
```

### Keep But Can Archive
```
⚠️  CURRENT_SYSTEM_FLOW.md     - Reference only (outdated flow)
⚠️  PRODUCT_SUMMARY.md         - Reference only (old system)
⚠️  SYSTEM_STATUS.md           - Reference only (status from March 21)
⚠️  DEPLOY.md                  - Reference only (basic deploy guide)
⚠️  persona.md                 - Keep if useful
```

### Test Files (Can Remove)
```
❌ openclaw-daemon/run-discovery-now.ts   - Delete (test script)
❌ openclaw-daemon/test-daily-scan.ts     - Delete (test script)
❌ openclaw-daemon/test-discovery-flow.ts - Delete (test script)
❌ openclaw-daemon/src/test_airbyte.ts    - Delete (test only)
```

---

## 🎯 Final File Structure (After Cleanup)

```
geodo/
├── README.md                              ← Project overview
├── REAL_TIME_SIGNAL_SYSTEM.md            ← NEW system docs
├── RUN_THIS_IN_SUPABASE.sql              ← Database migration
│
├── openclaw-daemon/
│   ├── src/
│   │   ├── index.ts                      ← Main daemon
│   │   ├── openclawClient.ts             ← AI agents
│   │   ├── signalScanner.ts              ← Signal scanner (NEW)
│   │   └── telegramBot.ts                ← Telegram approval (TODO)
│   │   └── replyMonitor.ts               ← Gmail reply monitor (TODO)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   └── main.py                           ← API server
│
├── frontend/
│   └── ...                               ← Next.js app
│
└── database/
    └── migration_signal_outreach.sql     ← NEW schema (TODO)
```

---

## 🗑️ Delete Commands

Run these to clean up:

```bash
# Delete unnecessary email intelligence files
rm openclaw-daemon/src/emailIntelligenceAgent.ts
rm openclaw-daemon/src/emailMonitor.ts
rm DEPLOY_EMAIL_INTELLIGENCE.md
rm EMAIL_INTELLIGENCE_COMPLETE.md

# Delete outdated documentation
rm DAILY_DISCOVERY_UPDATE.md
rm DEPLOYMENT_COMPLETE.md
rm DEPLOYMENT_GUIDE.md
rm FINISH_DEPLOYMENT.md
rm IMPLEMENTATION_COMPLETE.md
rm PROGRESS.md
rm TEST_RESULTS_DAILY_DISCOVERY.md
rm WHATS_NEXT.md
rm TELEGRAM_SETUP.md

# Delete test files
rm openclaw-daemon/run-discovery-now.ts
rm openclaw-daemon/test-daily-scan.ts
rm openclaw-daemon/test-discovery-flow.ts
rm openclaw-daemon/src/test_airbyte.ts

# Delete compiled test files
rm -rf openclaw-daemon/dist/*Test*
rm -rf openclaw-daemon/dist/*email*

# Optional: Archive old docs
mkdir -p archive/
mv CURRENT_SYSTEM_FLOW.md archive/
mv PRODUCT_SUMMARY.md archive/
mv SYSTEM_STATUS.md archive/
mv DEPLOY.md archive/
```

---

## ✅ What You'll Have After Cleanup

**3 Core Code Files:**
1. `index.ts` - Main daemon orchestrator
2. `openclawClient.ts` - Discovery & monitoring agents
3. `signalScanner.ts` - Real-time signal scanner (NEW)

**2 Essential Docs:**
1. `README.md` - Project overview
2. `REAL_TIME_SIGNAL_SYSTEM.md` - Current architecture

**Database:**
1. `RUN_THIS_IN_SUPABASE.sql` - Schema for signal outreach

---

## 🚀 What's Left to Build

### Still TODO (for real-time system):

1. **Telegram Bot Handler** (`telegramBot.ts`)
   - Handle button clicks (✅ ✏️ ❌)
   - Send email on approval
   - Edit workflow

2. **Reply Monitor** (`replyMonitor.ts`)
   - Check Gmail every 30 min
   - Match replies to sent emails
   - Draft responses
   - Send to Telegram for approval

3. **Database Migration** (`migration_signal_outreach.sql`)
   - `signal_outreach` table
   - `signal_replies` table

4. **Integration** (update `index.ts`)
   - Start signal scanner (every 2 hours)
   - Start reply monitor (every 30 min)
   - Start Telegram bot listener

---

**Want me to delete the unnecessary files now and continue building the real-time system?**
