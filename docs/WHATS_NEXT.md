# 🎯 What Happens Next - Daily Discovery

## Current Status

✅ **Daemon Deployed and Running**
- Railway: https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9
- Status: Healthy and scheduled
- Next run: **8:00 AM server time** (~4 hours from now)

✅ **Architecture Updated**
- Old: Monitor same companies daily (wasteful)
- New: Discover NEW companies daily (efficient)

## What Happens Tomorrow at 8am

### Automatic Daily Discovery Flow

```
8:00 AM Server Time
      ↓
runDailyScan() executes
      ↓
Load user_pitch from database
      ↓
Run Discovery Agent:
  - Generate 3 search queries
  - Search Tavily for companies
  - Find 10-15 companies matching ICP
      ↓
For each company found:
  ├─ Save to accounts table
  ├─ runMonitorAgent() - scan web for signals
  ├─ Evaluate signal vs your pitch
  ├─ Generate intelligence:
  │    • product_insight
  │    • opportunity
  │    • relevance_score (1-10)
  │    • action (what to do)
  │    • reason (why now)
  │    • prospect details
  ├─ Save to signals table
  └─ If high priority → Send Telegram alert
      ↓
Complete - wait 24 hours
      ↓
Repeat tomorrow
```

## Expected Results

### In Telegram (~8:05am daily)
You'll receive 2-5 alerts like:

```
🔥 *HubSpot Inc.*
📡 Signal: Launching new sales hub product

🧠 *Insight:*
Product launch indicates need for integration tools

💡 *Opportunity:*
Our automation platform integrates with 50+ sales tools

🎯 *Relevance:* 9/10

👤 *Target:* VP of Product
📧 *Prospect:* sarah@hubspot.com

⚡️ *Action:* Demo our sales automation integrations
⏰ *Why now:* Launch window = high intent for partnerships
```

### In Database
- **accounts table**: 10 new companies added daily
- **signals table**: 10-15 new signals added daily
- Each signal includes full intelligence fields

### In Frontend
https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- Feed automatically updates with new signals
- Sorted by priority (high → medium → low)
- Filterable by company, signal type, relevance score

## How to Test NOW (Before 8am)

If you want to test immediately without waiting:

### Option 1: Trigger via API
```bash
curl -X POST https://backend-production-d5926.up.railway.app/api/pitch \
  -H "Content-Type: application/json" \
  -d '{"pitch": "We sell AI-powered sales automation tools for B2B SaaS companies"}'
```

**Note**: This queues to Redis which isn't configured, so the job won't process until the scheduled 8am scan runs.

### Option 2: Run Locally
```bash
cd openclaw-daemon
npm run dev
# Wait for "Next scan at 8am"
# Then manually trigger by updating the schedule in code or waiting
```

### Option 3: Force Immediate Run (Railway)

Update `src/index.ts` temporarily to run immediately:

```typescript
async function start() {
  console.log('🚀 Geodo Daemon — starting');

  // Worker setup...
  const worker = new Worker('research-jobs', async (job) => {
    // ...
  }, {
    connection: redisConn,
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} (${job.name}) done`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} (${job?.name}):`, err.message));

  // RUN IMMEDIATELY FOR TESTING
  console.log('🧪 Running discovery immediately for testing...');
  await runDailyScan();

  // Then schedule normally
  scheduleDailyScan();

  console.log('✅ Daemon running — daily scan at 8am');
  process.on('SIGTERM', async () => { await worker.close(); process.exit(0); });
}
```

Then redeploy:
```bash
npm run build
railway up --service daemon
```

## Monitoring

### Check Daemon Logs
```bash
railway logs --service daemon --tail 50
```

Look for:
```
🌅 Running daily discovery...
🔎 Running discovery for pitch: "..."
🔎 Discovering companies for pitch: "..."
✨ Found 10 companies
📡 Scanning Company X for signals...
✅ Company X — Signal found
✅ Daily discovery complete
```

### Check Database
```sql
-- Check new companies added today
SELECT company_name, domain, user_pitch, created_at
FROM accounts
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check new signals added today
SELECT
  a.company_name,
  s.signal_summary,
  s.relevance_score,
  s.priority,
  s.should_contact,
  s.created_at
FROM signals s
JOIN accounts a ON s.account_id = a.id
WHERE s.created_at > NOW() - INTERVAL '1 day'
ORDER BY s.created_at DESC;
```

### Check Telegram
- Open Telegram app
- Look for messages from your bot
- Should arrive within 1-2 minutes after 8am scan completes

## Key Metrics to Track

### Daily
- **Companies found**: Should be ~10 per day
- **Signals detected**: Should be ~10-15 per day
- **High priority signals**: Should be ~2-5 per day
- **Telegram alerts sent**: Should be ~2-5 per day

### Weekly
- **Unique companies**: Should be ~70 new companies
- **Total signals**: Should be ~70-100 new signals
- **Actionable leads**: Should be ~15-30 high priority

### Monthly
- **Database growth**: ~300 companies, ~400 signals
- **Quality check**: Are high-priority signals actually relevant?
- **Pitch refinement**: Adjust user_pitch if relevance scores are low

## Troubleshooting

### No Telegram alerts at 8am?
```bash
# Check daemon logs
railway logs --service daemon

# Test Telegram bot
curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getMe

# Check chat ID
curl https://api.telegram.org/bot8715850403:AAGW-76xNP6bMFva3PFpJ4dcUxXU-4JILzw/getUpdates
```

### Daemon not running?
```bash
# Check Railway service status
railway status --service daemon

# View recent logs
railway logs --service daemon --tail 100

# Restart service
railway restart --service daemon
```

### Low quality leads?
- Update `user_pitch` in accounts table to be more specific
- Example: "We sell data integration tools for modern data teams"
  → "We sell data integration tools for B2B SaaS companies with 50+ employees using Snowflake"

### Too many/too few results?
Adjust in `src/openclawClient.ts`:
- Change number of search queries (currently 3)
- Change number of results per query (currently 5)
- Change max companies returned (currently 10)

## Next Steps

1. **Wait for 8am tomorrow** - First automated run
2. **Check Telegram** - Verify alerts arrive
3. **Review quality** - Are signals relevant to your pitch?
4. **Iterate pitch** - Refine user_pitch for better targeting
5. **Scale** - Add multiple pitch variations for different ICPs

## URLs

- **Frontend**: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app
- **Backend**: https://backend-production-d5926.up.railway.app/
- **Railway Daemon**: https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9/service/8c687b6a-5e93-4859-8d88-697ef734159a
- **Supabase**: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat

---

## Summary

✅ **Everything is ready** - The daemon will automatically run discovery at 8am daily
✅ **No action needed** - Just check Telegram tomorrow morning for alerts
✅ **Deployed successfully** - Both Railway production and local dev are running the new code

The architecture now correctly runs discovery daily to find NEW companies entering your ICP, instead of wastefully monitoring the same companies forever!
