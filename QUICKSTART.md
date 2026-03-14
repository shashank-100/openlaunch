# Geodo Quick Start Guide

Get Geodo running in 10 minutes.

---

## Prerequisites

- Node.js 20+
- Redis
- Supabase account
- Anthropic API key

---

## 1. Install Dependencies (2 min)

```bash
cd geodo

# Run automated setup
chmod +x setup.sh
./setup.sh

# Or manually:
npm install
npm install --workspaces
cd openclaw-daemon && npx playwright install chromium && cd ..
```

---

## 2. Set Up Supabase (3 min)

### A. Create Project
1. Go to https://supabase.com
2. Create new project
3. Wait for setup to complete

### B. Run Schema
1. Go to SQL Editor
2. Copy contents from `database/schema.sql`
3. Click "Run"

### C. Get Credentials
1. Go to Project Settings → API
2. Copy:
   - Project URL
   - `anon` key
   - `service_role` key

---

## 3. Configure Environment (2 min)

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
ANTHROPIC_API_KEY=sk-ant-...

# Redis (local)
REDIS_URL=redis://localhost:6379

# Optional (for calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 4. Start Redis (1 min)

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine

# Verify
redis-cli ping
# Should return: PONG
```

---

## 5. Start Geodo (1 min)

```bash
# Start all services
npm run dev
```

This starts:
- ✅ Backend API → http://localhost:4000
- ✅ Frontend → http://localhost:3000
- ✅ OpenClaw Daemon (worker)

---

## 6. Test It (1 min)

### Trigger a Research Job

```bash
curl -X POST http://localhost:4000/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Anthropic",
    "contactName": "Claude",
    "userId": "test-user-123",
    "organizationId": "test-org-123",
    "meetingTime": "2024-01-20T15:00:00Z"
  }'
```

### Check Job Status

Response will include `jobId`. Check status:

```bash
curl http://localhost:4000/api/webhook/job/{jobId}
```

### View in Dashboard

Open: http://localhost:3000/dashboard

---

## 7. Watch It Work

### Terminal 1: Backend Logs
```bash
cd backend
npm run dev
```

### Terminal 2: Daemon Logs
```bash
cd openclaw-daemon
npm run dev
```

You'll see:
- 🔍 Starting research for: Anthropic - Claude
- 📍 Visiting: Company Website
- 📍 Visiting: LinkedIn Company
- ... (10 sources)
- 🤖 Generating brief with Claude...
- ✅ Research completed

---

## 8. View Results

### In Supabase

1. Go to Table Editor
2. Open `briefs` table
3. See generated brief with all sections
4. Open `agent_logs` table
5. See every action the agent took

### In Terminal

The daemon will log:
```
✅ Research completed for Anthropic
📊 Brief ID: xxx-xxx-xxx
```

---

## Common Issues

### Redis not running
```bash
brew services start redis
# or
redis-server
```

### Port already in use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Playwright browsers missing
```bash
cd openclaw-daemon
npx playwright install chromium
```

### Environment variables not loaded
```bash
# Verify .env exists
cat .env | grep SUPABASE_URL

# Restart services
npm run dev
```

---

## Next Steps

### Add Calendar Integration

1. Get Google OAuth credentials:
   - https://console.cloud.google.com
   - Create OAuth 2.0 Client ID
   - Add redirect: `http://localhost:3000/api/auth/google/callback`
   - Enable Google Calendar API

2. Update `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   ```

3. Connect calendar:
   ```
   http://localhost:4000/api/calendar/connect/google?userId=test-user-123
   ```

### Add Slack Delivery

1. Create Slack app: https://api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `users:read`
3. Install to workspace
4. Update `.env`:
   ```env
   SLACK_CLIENT_ID=xxx
   SLACK_CLIENT_SECRET=xxx
   ```

### Customize Research Sources

Edit: `openclaw-daemon/src/sources/index.ts`

Add your own sources:
```typescript
{
  name: 'Custom Source',
  url: 'https://example.com',
  priority: 11,
  extractor: async (page, companyName, contactName) => {
    // Your extraction logic
    return { data: '...' };
  },
}
```

---

## Production Deployment

See: `DEPLOYMENT.md` for full guide

Quick deploy to Railway:
```bash
cd backend
railway init
railway up

cd ../openclaw-daemon
railway init
railway up

cd ../frontend
railway init
railway up
```

---

## Getting Help

- 📚 Full docs: `README.md`
- 🚀 Deployment: `DEPLOYMENT.md`
- 📊 Architecture: `PROJECT_SUMMARY.md`
- 💬 Issues: Create GitHub issue

---

## Sample Test Data

### Test Company
```json
{
  "companyName": "Anthropic",
  "contactName": "Claude Assistant",
  "contactEmail": "claude@anthropic.com",
  "userId": "test-user",
  "organizationId": "test-org"
}
```

### Test Company 2
```json
{
  "companyName": "OpenAI",
  "contactName": "ChatGPT",
  "contactEmail": "gpt@openai.com",
  "userId": "test-user",
  "organizationId": "test-org"
}
```

---

## Monitoring Jobs

### Check Queue
```bash
redis-cli

# Get queue length
LLEN bull:research-jobs:wait

# Get all jobs
KEYS bull:research-jobs:*
```

### Check Database
```sql
-- In Supabase SQL Editor

-- Recent jobs
SELECT * FROM research_jobs ORDER BY created_at DESC LIMIT 10;

-- Recent briefs
SELECT * FROM briefs ORDER BY created_at DESC LIMIT 10;

-- Agent activity
SELECT * FROM agent_logs WHERE job_id = 'xxx' ORDER BY timestamp;
```

---

**🎉 You're all set! Geodo is running.**

Visit: http://localhost:3000
