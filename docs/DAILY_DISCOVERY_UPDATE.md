# 🎯 Daily Discovery Architecture - Implementation Complete

## What Changed

### Old Architecture (Inefficient)
- **Discovery**: Runs ONCE when user submits pitch → finds 10 companies
- **Daily Scan**: Monitors those SAME 10 companies forever at 8am daily
- **Problem**: You never find NEW companies entering the market
- **Problem**: Scanning same companies daily is wasteful

### New Architecture (Efficient)
- **Discovery**: Runs DAILY at 8am → finds NEW companies with signals
- **Monitor**: Eliminated (redundant)
- **Benefit**: Always finding fresh leads entering your ICP
- **Benefit**: No wasted compute on old companies

## Code Changes

### 1. Updated `processDiscoveryJob()` (openclaw-daemon/src/index.ts:99-172)

**Before**: Discovery found companies → queued monitor jobs
```typescript
await queue.add('monitor', {
  companyName: co.company_name,
  domain: co.domain,
  accountId: account.id,
  userPitch: pitch,
}, { removeOnComplete: true, attempts: 2 });
```

**After**: Discovery finds companies → immediately scans for signals
```typescript
// Immediately scan for signals (no queuing)
const result = await runMonitorAgent(co.company_name, co.domain || '', pitch);

// Save signal with deduplication
const { data: insertedSignal, error: signalError } = await supabase.from('signals').insert({
  account_id: accountId,
  signal_type: result.signal_type,
  signal_summary: result.signal_summary,
  pain_point: result.pain_point,
  product_insight: result.product_insight || null,
  opportunity: result.opportunity || null,
  relevance_score: result.relevance_score || null,
  outreach_angle: result.outreach_angle,
  email_subject: result.email_subject,
  email_body: result.email_body,
  source_url: result.source_url || null,
  signal_hash: hash,
  is_new: true,
  should_contact: result.should_contact ?? false,
  priority: result.priority || 'medium',
  target_persona: result.target_persona || null,
  prospect_name: result.prospect_name || null,
  prospect_email: result.prospect_email || null,
  prospect_title: result.prospect_title || null,
  prospect_linkedin: result.prospect_linkedin || null,
  action: result.action || null,
  reason: result.reason || null,
  tech_stack: result.tech_stack || [],
}).select('id').single();

// Send Telegram alert for high-priority signals
if (isNew) {
  await deliverAlert(co.company_name, result, insertedSignal.id);
}
```

### 2. Updated `runDailyScan()` (openclaw-daemon/src/index.ts:176-200)

**Before**: Queued monitor jobs for all accounts with `monitoring_enabled=true`
```typescript
async function runDailyScan() {
  console.log('🌅 Running daily scan...');
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('monitoring_enabled', true);

  if (!accounts?.length) { console.log('No accounts to scan'); return; }

  for (const account of accounts) {
    await queue.add('monitor', {
      companyName: account.company_name,
      domain: account.domain || '',
      accountId: account.id,
      userPitch: account.user_pitch,
    }, { removeOnComplete: true, attempts: 2 });
  }

  console.log(`🕐 Queued ${accounts.length} accounts for daily scan`);
}
```

**After**: Runs discovery to find NEW companies with signals
```typescript
async function runDailyScan() {
  console.log('🌅 Running daily discovery...');

  // Get user's pitch from most recent account
  const { data: account } = await supabase
    .from('accounts')
    .select('user_pitch, user_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!account?.user_pitch) {
    console.log('❌ No user pitch found - skipping discovery');
    return;
  }

  console.log(`🔎 Running discovery for pitch: "${account.user_pitch}"`);

  // Run discovery to find NEW companies + signals
  await processDiscoveryJob({
    data: {
      pitch: account.user_pitch,
      userId: account.user_id || '00000000-0000-0000-0000-000000000001'
    }
  });

  console.log(`✅ Daily discovery complete`);
}
```

## Deployment Status

### ✅ Daemon Deployed
- **URL**: Railway daemon service
- **Status**: Running and scheduled for 8am daily
- **Build Logs**: https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9/service/8c687b6a-5e93-4859-8d88-697ef734159a

### ⏰ Schedule
- Daily scan runs at **8:00 AM** (local server time)
- Next run: Check Railway logs for countdown

## How It Works Now

1. **User submits pitch** via frontend or API: `POST /api/pitch`
2. **Discovery job queued** to Redis (optional - for real-time UI feedback)
3. **At 8am daily**, daemon automatically:
   - Loads user's pitch from database
   - Runs discovery agent → 3 search queries → 10-15 companies
   - For EACH company found:
     - Saves to `accounts` table
     - Immediately scans for buying signals
     - Evaluates signal against pitch (product_insight, opportunity, relevance_score)
     - Saves to `signals` table with deduplication
     - Sends Telegram alert if high-priority

## Key Benefits

### 1. Always Fresh Leads
- Every day = new companies entering your ICP
- No stale monitoring of same 10 companies

### 2. Cost Efficient
- Discovery: 10 companies × 1 search = efficient
- Old approach: 100 companies × daily monitoring = wasteful

### 3. Automated Intelligence
Every signal includes:
- `product_insight`: Why they need help
- `opportunity`: How YOUR product solves it
- `relevance_score`: 1-10 fit score
- `action`: What to do now
- `reason`: Why now is the moment
- `target_persona`: Who to contact
- `prospect_name`, `prospect_email`, `prospect_title`, `prospect_linkedin`

## Testing

### Manual Trigger (via API)
```bash
curl -X POST https://backend-production-d5926.up.railway.app/api/pitch \
  -H "Content-Type: application/json" \
  -d '{"pitch": "We sell AI-powered sales automation tools for B2B SaaS companies"}'
```

### Check Daemon Logs
```bash
railway logs --service daemon
```

You should see:
```
🌅 Running daily discovery...
🔎 Running discovery for pitch: "..."
🔎 Discovering companies for pitch: "..."
✨ Found 10 companies
📡 Scanning Company X for signals...
✅ Company X — High-priority signal found
...
✅ Daily discovery complete
```

### Check Telegram
You'll receive alerts like:
```
🔥 *Salesforce Inc.*
📡 Signal: Hiring VP of Sales Automation

🧠 *Insight:*
Scaling sales team indicates need for automation

💡 *Opportunity:*
Our AI-powered platform can reduce manual outreach by 60%

🎯 *Relevance:* 9/10

👤 *Target:* VP of Sales Operations
📧 *Prospect:* john@salesforce.com

⚡️ *Action:* Demo our automation tools
⏰ *Why now:* Budget approved for Q1 hiring
```

## Next Steps

1. **Verify 8am scan**: Check Railway logs tomorrow at 8:01am
2. **Monitor results**: Watch Telegram for alerts
3. **Adjust pitch**: Update `user_pitch` in accounts table to refine targeting
4. **Scale**: Add more pitch variations for different ICPs

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Daily at 8am                            │
│                          ↓                                  │
│                  runDailyScan()                             │
│                          ↓                                  │
│              Load user_pitch from DB                        │
│                          ↓                                  │
│              processDiscoveryJob()                          │
│                          ↓                                  │
│          Discovery Agent (Tavily + GPT)                     │
│          - Generate 3 search queries                        │
│          - Find 10-15 companies                             │
│                          ↓                                  │
│              For each company:                              │
│          ┌───────────────────────┐                          │
│          │  1. Save to accounts  │                          │
│          │  2. runMonitorAgent() │                          │
│          │  3. Scan for signals  │                          │
│          │  4. Evaluate vs pitch │                          │
│          │  5. Save to signals   │                          │
│          │  6. Send Telegram     │                          │
│          └───────────────────────┘                          │
│                          ↓                                  │
│                  ✅ Complete                                │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified

- `openclaw-daemon/src/index.ts`: Updated `processDiscoveryJob()` and `runDailyScan()`
- `openclaw-daemon/package.json`: Already had required dependencies

## Deployment

```bash
cd openclaw-daemon
npm run build
railway service daemon
railway up
```

✅ **Status**: Deployed and running at 8am daily
