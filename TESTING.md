# Geodo Testing Guide

Complete testing scenarios for development and QA.

---

## Test Environment Setup

### 1. Start All Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: OpenClaw Daemon
cd openclaw-daemon
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev

# Terminal 4: Redis
redis-cli monitor  # Watch all Redis commands
```

---

## Unit Tests

### Test 1: Webhook Endpoint

**Test**: Create research job via webhook

```bash
curl -X POST http://localhost:4000/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Anthropic",
    "contactName": "Claude Assistant",
    "contactEmail": "claude@anthropic.com",
    "meetingTime": "2024-06-15T14:00:00Z",
    "userId": "test-user-001",
    "organizationId": "test-org-001",
    "priority": 5
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "jobId": "1",
  "message": "Research job queued for Anthropic",
  "estimatedCompletionTime": "2024-01-20T10:04:00.000Z"
}
```

**Verify**:
- Check `research_jobs` table in Supabase
- Job status should be `pending` → `processing` → `completed`

---

### Test 2: Job Status Endpoint

```bash
# Get job status
curl http://localhost:4000/api/webhook/job/1
```

**Expected Response**:
```json
{
  "success": true,
  "job": {
    "id": "1",
    "state": "completed",
    "progress": 100,
    "data": { /* original job data */ },
    "finishedOn": 1234567890
  }
}
```

---

### Test 3: Get Briefs for User

```bash
curl "http://localhost:4000/api/briefs?userId=test-user-001"
```

**Expected Response**:
```json
{
  "success": true,
  "briefs": [
    {
      "id": "brief-id",
      "company_name": "Anthropic",
      "contact_name": "Claude Assistant",
      "company_snapshot": { /* ... */ },
      "recent_signals": [ /* ... */ ],
      /* ... more sections */
    }
  ]
}
```

---

### Test 4: Get Specific Brief with Logs

```bash
curl http://localhost:4000/api/briefs/{briefId}
```

**Expected**:
- Full brief content
- All agent logs (10 sources visited)
- Detected signals
- Confidence score

---

### Test 5: Rate Brief

```bash
curl -X POST http://localhost:4000/api/briefs/{briefId}/rate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "rating": 5,
    "feedbackText": "Excellent brief, very helpful!"
  }'
```

---

## Integration Tests

### Test 6: End-to-End Research Flow

**Scenario**: Trigger job → Wait for completion → Verify brief

```bash
# 1. Trigger job
JOB_RESPONSE=$(curl -X POST http://localhost:4000/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Tesla",
    "contactName": "Elon Musk",
    "userId": "test-user-001",
    "organizationId": "test-org-001"
  }')

# Extract job ID
JOB_ID=$(echo $JOB_RESPONSE | jq -r '.jobId')
echo "Job ID: $JOB_ID"

# 2. Poll for completion
while true; do
  STATUS=$(curl -s http://localhost:4000/api/webhook/job/$JOB_ID | jq -r '.job.state')
  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "✅ Job completed!"
    break
  fi

  if [ "$STATUS" = "failed" ]; then
    echo "❌ Job failed!"
    break
  fi

  sleep 5
done

# 3. Get briefs
curl "http://localhost:4000/api/briefs?userId=test-user-001"
```

---

### Test 7: Calendar Integration

**Setup**: Requires Google OAuth configured

```bash
# 1. Connect calendar
open "http://localhost:4000/api/calendar/connect/google?userId=test-user-001"

# 2. After OAuth completion, sync calendar
curl -X POST http://localhost:4000/api/calendar/sync/test-user-001 \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "test-org-001"
  }'
```

**Expected**:
- Jobs created for upcoming external meetings
- Internal meetings ignored
- Meeting time extracted correctly

---

### Test 8: Research Agent with Multiple Companies

```bash
# Test different industries
companies=("Stripe" "Airbnb" "Notion" "Figma" "Linear")

for company in "${companies[@]}"; do
  echo "Testing: $company"

  curl -X POST http://localhost:4000/api/webhook/research \
    -H "Content-Type: application/json" \
    -d "{
      \"companyName\": \"$company\",
      \"contactName\": \"Test Contact\",
      \"userId\": \"test-user-001\",
      \"organizationId\": \"test-org-001\"
    }"

  sleep 2
done
```

**Verify**:
- All jobs queued successfully
- Processing in parallel (up to 3)
- Different data extracted for each company

---

## Error Handling Tests

### Test 9: Invalid Request Data

```bash
# Missing required field
curl -X POST http://localhost:4000/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test"
  }'
```

**Expected**:
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [ /* Zod validation errors */ ]
}
```

---

### Test 10: Non-existent Job

```bash
curl http://localhost:4000/api/webhook/job/99999
```

**Expected**:
```json
{
  "success": false,
  "error": "Job not found"
}
```

---

### Test 11: Source Timeout Handling

**Manual Test**: Add delay to a source

Edit `openclaw-daemon/src/sources/index.ts`:

```typescript
// In Company Website extractor
await page.waitForTimeout(35000); // Trigger timeout
```

**Verify**:
- Agent retries 3 times
- Logs error
- Continues with other sources
- Job still completes

---

## Performance Tests

### Test 12: Concurrent Jobs

```bash
# Trigger 10 jobs simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/webhook/research \
    -H "Content-Type: application/json" \
    -d "{
      \"companyName\": \"Company$i\",
      \"contactName\": \"Contact$i\",
      \"userId\": \"test-user-001\",
      \"organizationId\": \"test-org-001\"
    }" &
done
wait
```

**Monitor**:
- Check daemon logs for concurrency (should be max 3)
- Verify queue depth in Redis
- Check completion times

**Expected**:
- First 3 start immediately
- Others wait in queue
- All complete successfully

---

### Test 13: Queue Performance

```bash
# Check queue metrics
redis-cli

# Queue length
LLEN bull:research-jobs:wait

# Active jobs
LLEN bull:research-jobs:active

# Completed jobs
LLEN bull:research-jobs:completed

# Failed jobs
LLEN bull:research-jobs:failed
```

---

## Database Tests

### Test 14: Agent Logs

**Query**:
```sql
-- In Supabase SQL Editor

-- Get all logs for a job
SELECT
  source_name,
  action_type,
  success,
  duration_ms,
  timestamp
FROM agent_logs
WHERE job_id = 'xxx'
ORDER BY timestamp;

-- Failed sources
SELECT
  source_name,
  COUNT(*) as failure_count
FROM agent_logs
WHERE success = false
GROUP BY source_name
ORDER BY failure_count DESC;
```

---

### Test 15: Signal Detection

**Query**:
```sql
-- Top signals detected
SELECT
  signal_type,
  COUNT(*) as occurrences,
  AVG(importance_score) as avg_importance
FROM signals
GROUP BY signal_type
ORDER BY occurrences DESC;

-- Recent high-importance signals
SELECT
  b.company_name,
  s.signal_type,
  s.signal_title,
  s.importance_score
FROM signals s
JOIN briefs b ON b.id = s.brief_id
WHERE s.importance_score >= 8
ORDER BY s.detected_at DESC
LIMIT 20;
```

---

## Frontend Tests

### Test 16: Dashboard Load

1. Open: http://localhost:3000/dashboard
2. Verify:
   - Stats display correctly
   - Briefs list loads
   - Status indicators work
   - Empty state shows when no briefs

---

### Test 17: Landing Page

1. Open: http://localhost:3000
2. Verify:
   - All sections render
   - Pricing tiers display
   - CTAs work
   - Links functional

---

## Load Tests

### Test 18: Stress Test

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml << EOF
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: Warm up
    - duration: 120
      arrivalRate: 10
      name: Sustained load

scenarios:
  - name: Create research jobs
    flow:
      - post:
          url: '/api/webhook/research'
          json:
            companyName: 'Test Company {{ \$randomNumber() }}'
            contactName: 'Test Contact'
            userId: 'load-test-user'
            organizationId: 'load-test-org'
EOF

# Run load test
artillery run load-test.yml
```

**Monitor**:
- Response times
- Error rates
- Queue depth
- Redis memory usage

---

## Manual Test Scenarios

### Scenario 1: New User Onboarding

1. Visit http://localhost:3000
2. Click "Get Started"
3. Sign up with test email
4. Connect Google Calendar
5. Wait for first meeting detection
6. Verify brief generated
7. Rate brief

---

### Scenario 2: Sales Rep Daily Workflow

1. Rep opens Slack in morning
2. Sees brief for 10am meeting
3. Clicks link to dashboard
4. Reviews company snapshot
5. Reads recent signals
6. Checks contact intel
7. Uses suggested openers in call

---

### Scenario 3: Admin Setup

1. Admin creates account
2. Invites team members
3. Connects team calendar
4. Sets up Slack integration
5. Configures CRM write-back
6. Reviews team dashboard

---

## Verification Checklist

### After Each Test Run

- [ ] No errors in backend logs
- [ ] No errors in daemon logs
- [ ] All jobs have status (completed/failed)
- [ ] Agent logs exist for all sources
- [ ] Briefs contain all 6 sections
- [ ] Signals detected where applicable
- [ ] Database records created correctly
- [ ] No memory leaks in browser contexts

---

## Test Data Cleanup

```sql
-- Clear test data (Supabase SQL Editor)

DELETE FROM brief_ratings WHERE user_id LIKE 'test-%';
DELETE FROM agent_logs WHERE job_id IN (
  SELECT id FROM research_jobs WHERE user_id LIKE 'test-%'
);
DELETE FROM signals WHERE brief_id IN (
  SELECT id FROM briefs WHERE user_id LIKE 'test-%'
);
DELETE FROM briefs WHERE user_id LIKE 'test-%';
DELETE FROM research_jobs WHERE user_id LIKE 'test-%';
DELETE FROM calendar_connections WHERE user_id LIKE 'test-%';
DELETE FROM organization_members WHERE user_id LIKE 'test-%';
DELETE FROM users WHERE id LIKE 'test-%';
```

---

## Automated Test Suite (Future)

### Jest Unit Tests

```typescript
// backend/__tests__/webhook.test.ts
describe('Webhook API', () => {
  it('should create research job', async () => {
    const response = await request(app)
      .post('/api/webhook/research')
      .send({
        companyName: 'Test',
        contactName: 'Test',
        userId: 'test',
        organizationId: 'test',
      });

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
  });
});
```

### Playwright E2E Tests

```typescript
// frontend/__tests__/e2e/dashboard.spec.ts
test('dashboard shows briefs', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Geodo Dashboard');
  await expect(page.locator('.brief-item')).toBeVisible();
});
```

---

## Debugging Tips

### Enable Verbose Logging

```typescript
// openclaw-daemon/src/agents/ResearchAgent.ts
// Add debug logs
console.log('[DEBUG]', extractedData);
```

### Watch Redis Queue

```bash
redis-cli monitor | grep research-jobs
```

### Database Query Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM briefs WHERE user_id = 'xxx';
```

### Browser Debugging

```typescript
// openclaw-daemon/src/index.ts
const browser = await chromium.launch({
  headless: false,  // See browser in action
  slowMo: 1000,     // Slow down actions
});
```

---

**🧪 Happy Testing!**
