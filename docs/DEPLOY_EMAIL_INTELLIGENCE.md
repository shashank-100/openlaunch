# 🚀 Deploy Email Intelligence System

## What We Just Built

The email intelligence system is now **complete and ready to deploy**! Here's what it does:

✅ Checks Gmail inbox every 30 minutes
✅ Qualifies leads automatically (1-10 score)
✅ Researches companies in background
✅ Generates contextual follow-up emails
✅ Detects meeting requests
✅ Sends Telegram alerts for hot leads (score 8+)

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration ✅ REQUIRED

**Run this SQL in Supabase:**

1. Open: https://supabase.com/dashboard/project/ybcomqhhtrwfygshhyat/sql/new
2. Copy contents of `RUN_THIS_IN_SUPABASE.sql`
3. Click "RUN"
4. Wait for success message

This creates 4 new tables:
- `email_threads` - Email conversations with lead scoring
- `email_messages` - Individual messages
- `email_followups` - AI-generated drafts
- `email_monitor_jobs` - Monitoring job history

### 2. Gmail OAuth Setup ✅ DONE

Credentials already configured:
```
Client ID: YOUR_GMAIL_CLIENT_ID
Client Secret: YOUR_GMAIL_CLIENT_SECRET
```

### 3. Connect Gmail Account (User Action Required)

After deployment, you need to connect your Gmail:

1. Go to: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app/settings
2. Click "Connect Gmail"
3. Authorize the app
4. Done! Email monitoring will start automatically

---

## 🚂 Railway Deployment

### Step 1: Update Environment Variables

Add these to Railway daemon service:

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=YOUR_GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_GMAIL_CLIENT_SECRET
GMAIL_REDIRECT_URI=https://backend-production-d5926.up.railway.app/api/gmail/callback
```

Railway dashboard:
1. Go to: https://railway.com/project/79da7ea6-7b09-4bea-a3d0-8713384677c9/service/8c687b6a-5e93-4859-8d88-697ef734159a
2. Click "Variables"
3. Add the 3 variables above
4. Click "Deploy"

### Step 2: Update Backend Environment Variables

Add to Railway backend service:

```bash
GMAIL_CLIENT_ID=YOUR_GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_GMAIL_CLIENT_SECRET
GMAIL_REDIRECT_URI=https://backend-production-d5926.up.railway.app/api/gmail/callback
```

### Step 3: Deploy Code

```bash
# Build daemon
cd openclaw-daemon
npm run build

# Deploy daemon
railway up --service daemon

# Deploy backend (if needed)
cd ../backend
railway up --service backend
```

Or just push to git if auto-deploy is enabled:
```bash
git add .
git commit -m "Add email intelligence system"
git push
```

---

## ✅ Verify Deployment

### 1. Check Daemon Logs

```bash
railway logs --service daemon --tail 50
```

Look for:
```
✅ Daemon running — daily scan at 8am, sequences every 30min, email monitor every 30min
⏰ Scheduling email monitoring every 30 minutes
```

### 2. Check Backend Health

```bash
curl https://backend-production-d5926.up.railway.app/health
```

Should return:
```json
{"status":"healthy","timestamp":"2026-03-25..."}
```

### 3. Test Email Intelligence API

```bash
# Get email stats
curl https://backend-production-d5926.up.railway.app/api/email-stats

# Should return (even if empty):
{
  "total_threads": 0,
  "qualified_leads": 0,
  "high_priority": 0,
  "meeting_requests": 0,
  "followups_generated": 0,
  "recent_jobs": []
}
```

---

## 🔗 Connect Your Gmail

1. **Open Settings**: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app/settings

2. **Click "Connect Gmail"**

3. **Authorize** - Google will ask for permissions:
   - Read emails
   - Send emails
   - (This is needed for lead qualification and sending follow-ups)

4. **Done!** - Email monitoring starts immediately

---

## 📊 What Happens Next

### First 30 Minutes

```
T+0:00  Gmail connected ✅
T+0:01  Email monitor starts
T+0:05  Fetches last 30 min of emails (probably 0 since just connected)
T+0:05  First monitoring job complete
T+0:30  Second monitoring run (checks last 30 min)
        ↓
        For each new email:
        - Qualifies lead (1-10 score)
        - Researches company
        - Generates follow-up
        - Saves to database
        - Telegram alert if score >= 8
```

### Expected Output

**Daemon Logs:**
```
📬 Running email monitor...
   Found 5 new threads

📧 Processing thread: "Interested in your product"
   Lead Score: 9/10 (qualified)
   🔍 Researching company: acme.com
   ✍️  Generating follow-up email
   📱 Telegram alert sent
   ✅ Thread processed successfully

✅ Email monitoring complete:
   - Threads checked: 5
   - New threads: 5
   - Leads qualified: 2
   - Follow-ups generated: 2
```

**Telegram Alert:**
```
📧 New Qualified Email Lead

🏢 Company: Acme Corp
📊 Lead Score: 9/10
🎯 Status: qualified

💡 Pain Points:
  • Manual lead enrichment taking 2 hours/day
  • Need better data on prospects

🔥 Buying Signals:
  • Mentioned budget approved
  • Looking for Q1 implementation

⚡️ Next Action: Send demo invite
⏰ Urgency: high

🔍 Company Intel:
  • B2B SaaS
  • ~200 employees

[View Thread](frontend.url/email/abc-123)
```

---

## 🎯 Using the System

### 1. View Qualified Leads

**API:**
```bash
curl https://backend-production-d5926.up.railway.app/api/email-leads
```

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "subject": "Interested in your product",
      "company_name": "Acme Corp",
      "lead_score": 9,
      "qualification_status": "qualified",
      "pain_points": ["Manual data entry", "No automation"],
      "buying_signals": ["Budget approved", "Timeline: Q1"],
      "next_action": "Send pricing deck",
      "urgency": "high",
      "conversation_summary": "VP of Sales interested in automation tools...",
      "company_info": {
        "industry": "B2B SaaS",
        "employee_count": 200,
        "tech_stack": ["Salesforce", "HubSpot"]
      }
    }
  ]
}
```

### 2. View AI-Generated Follow-Ups

```bash
curl https://backend-production-d5926.up.railway.app/api/email-threads/{thread_id}
```

**Response includes:**
```json
{
  "thread": {...},
  "messages": [...],
  "followups": [
    {
      "id": "uuid",
      "subject": "Re: Interested in your product",
      "body": "Hey Sarah,\n\nYou mentioned your team spends 2 hours/day on manual lead enrichment...",
      "tone": "professional",
      "context_points": ["manual enrichment", "2 hours/day", "budget approved"],
      "status": "draft"
    }
  ]
}
```

### 3. Send Follow-Up

```bash
curl -X POST https://backend-production-d5926.up.railway.app/api/email-followups/{followup_id}/send
```

This will:
- Send the email via Gmail API
- Mark follow-up as "sent"
- Update thread status to "contacted"

---

## 🐛 Troubleshooting

### No emails being processed?

**Check 1: Gmail connected?**
```bash
curl https://backend-production-d5926.up.railway.app/api/gmail/tokens
```

Should return:
```json
{
  "gmail_access_token": "ya29...",
  "gmail_refresh_token": "1//..."
}
```

If `null` → Go connect Gmail in settings

**Check 2: Daemon running?**
```bash
railway logs --service daemon | grep "email monitor"
```

Should see:
```
⏰ Scheduling email monitoring every 30 minutes
📬 Running email monitor...
```

**Check 3: Any errors?**
```bash
railway logs --service daemon --tail 100 | grep "❌\|error"
```

### Monitoring job status

```bash
curl https://backend-production-d5926.up.railway.app/api/email-stats
```

Check `recent_jobs` array:
```json
{
  "recent_jobs": [
    {
      "status": "completed",  // Should be "completed"
      "emails_checked": 5,
      "leads_qualified": 2,
      "error_message": null   // Should be null
    }
  ]
}
```

If `status: "failed"` → Check `error_message`

### Gmail API rate limits

Gmail API limits:
- **250 quota units/user/second**
- Reading messages: 5 units each
- Sending messages: 100 units each

At 30-min intervals with ~20 emails/run = ~100 units/30min = well under limits ✅

If you hit limits:
- Reduce monitoring frequency (60 min instead of 30 min)
- Add longer delays between API calls in `emailMonitor.ts:563`

---

## 📈 Monitoring & Metrics

### Dashboard

Coming soon in frontend! For now use API:

```bash
# Email intelligence stats
curl https://backend-production-d5926.up.railway.app/api/email-stats

# All threads
curl https://backend-production-d5926.up.railway.app/api/email-threads

# Just qualified leads (score >= 7)
curl https://backend-production-d5926.up.railway.app/api/email-leads
```

### Database Queries

```sql
-- Recent qualified leads
SELECT
  subject,
  company_name,
  lead_score,
  next_action,
  urgency
FROM email_threads
WHERE is_lead = true
  AND lead_score >= 7
ORDER BY lead_score DESC, last_message_date DESC
LIMIT 10;

-- Monitoring job history
SELECT
  created_at,
  status,
  emails_checked,
  leads_qualified,
  followups_generated
FROM email_monitor_jobs
ORDER BY created_at DESC
LIMIT 20;

-- Follow-ups pending send
SELECT
  et.company_name,
  et.subject,
  ef.body,
  ef.created_at
FROM email_followups ef
JOIN email_threads et ON ef.thread_id = et.id
WHERE ef.status = 'draft'
ORDER BY ef.created_at DESC;
```

---

## 🎉 Success Criteria

After deployment, you should see:

✅ **Daemon logs** show email monitoring every 30 min
✅ **Gmail connected** in settings
✅ **Telegram alerts** for high-score leads
✅ **Database** filling with email_threads
✅ **Follow-ups** being generated
✅ **API endpoints** returning data

---

## 📝 Next Steps

### Immediate (Post-Deployment)

1. ✅ Run database migration
2. ✅ Deploy daemon + backend
3. ✅ Connect Gmail account
4. ✅ Wait 30 minutes
5. ✅ Check Telegram for first alert
6. ✅ Review qualified leads in API

### This Week

- Build frontend email dashboard
- Add Google Calendar integration for meeting booking
- Test send follow-up flow end-to-end
- Monitor quality of lead qualification

### This Month

- Refine lead scoring algorithm based on feedback
- Add email reply detection
- Build email sequence automation
- Add Slack integration option

---

## 🚀 Deploy Commands Summary

```bash
# 1. Run database migration (in Supabase SQL editor)
# Copy RUN_THIS_IN_SUPABASE.sql and run it

# 2. Build and deploy daemon
cd openclaw-daemon
npm run build
railway up --service daemon

# 3. Deploy backend (if backend changed)
cd ../backend
railway up --service backend

# 4. Verify
railway logs --service daemon --tail 50
curl https://backend-production-d5926.up.railway.app/health

# 5. Connect Gmail
# Go to: https://frontend-swq6kqnwl-shashank100s-projects.vercel.app/settings
# Click "Connect Gmail"

# 6. Wait 30 minutes and check Telegram!
```

---

**Status**: ✅ Code Complete | 🚧 Awaiting Deployment
**Last Updated**: March 25, 2026
