# 🔬 Autoresearch Setup Guide

This guide shows how to use the OpenClaw autoresearch loop to automatically optimize your email reply rate.

---

## Prerequisites

1. **Install OpenClaw** (version 2026.3.13+)
   ```bash
   npm install -g openclaw
   ```

2. **Install the autoresearch plugin**
   ```bash
   openclaw plugins install @gianfrancopiana/openclaw-autoresearch
   ```

3. **Set your backend URL** (if different from default)
   ```bash
   export BACKEND_URL=https://backend-production-d5926.up.railway.app
   ```

---

## Quick Start

### Step 1: Initialize the Experiment

From the `/geodo` directory, run:

```bash
openclaw chat
```

Then in the OpenClaw chat:

```
/autoresearch setup Optimize email reply rate to get more interested/meeting replies
```

This will:
- Create `autoresearch.jsonl` for structured logs
- Create `autoresearch.checkpoint.json` for session state
- Lock the session with `autoresearch.lock`

### Step 2: Run Your First Baseline

```
run the autoresearch benchmark to establish baseline
```

OpenClaw will execute `./autoresearch.sh` and measure your current reply rate.

### Step 3: Start the Optimization Loop

```
Let's optimize the email writing prompts. Start by testing a more casual, conversational tone in the email body.
```

OpenClaw will:
1. Edit `backend/main.py` (email generation prompt)
2. Run `./autoresearch.sh` to measure new reply rate
3. Compare against baseline
4. Either **keep** (if better) or **discard** (if worse)
5. Suggest the next experiment

---

## What Gets Optimized

### Primary Target: Email Generation Prompt
**Location:** `backend/main.py:709-732`

This is where GPT generates cold emails. The prompt includes:
- Tone instructions
- Email structure rules
- Pain point messaging
- CTA style
- Example email format

### Example Changes Autoresearch Might Make:

**Experiment 1:** Make tone more casual
```diff
- Tone: {tone}
+ Tone: Extremely casual and conversational, like texting a friend
```

**Experiment 2:** Shorten email length
```diff
- Keep it under 5 lines total
+ Keep it under 3 lines total - be ultra concise
```

**Experiment 3:** Different CTA approach
```diff
- End with ONE of these CTA styles: {cta_style}
+ End with a question that creates curiosity instead of a direct ask
```

---

## How the Benchmark Works

**File:** `autoresearch.sh`

```bash
# Fetches all replies from your backend
# Counts "interested" + "meeting_request" replies
# Calculates: positive_reply_rate = (positive / total) * 100
# Outputs: METRIC positive_reply_rate=X.X
```

**Example Output:**
```
🔍 Fetching reply statistics...
METRIC positive_reply_rate=23.50
METRIC total_replies=40
METRIC positive_replies=9
✅ Reply Rate: 23.50% (9/40 positive)
```

---

## Monitoring Progress

### View Current Stats
```bash
cat autoresearch.jsonl | tail -5
```

### View Experiment History
```bash
cat autoresearch.md
```

### Check Ideas Backlog
```bash
cat autoresearch.ideas.md
```

---

## Example Optimization Session

```
You: /autoresearch setup Maximize positive email reply rate

OpenClaw: Initialized experiment. Ready to run baseline.

You: run baseline

OpenClaw: Baseline established: 18.5% reply rate (7/38 replies)

You: Start optimizing. Try making emails shorter and more direct.

OpenClaw:
- Editing backend/main.py (line 720)
- Changed: "Keep it under 5 lines" → "Keep it under 3 lines - one sentence per thought"
- Running benchmark...
- Result: 22.1% reply rate (10/45 replies)
- ✅ IMPROVEMENT: +3.6 percentage points (confidence: 73%)
- Committing changes...

Next experiment idea: Test leading with a question instead of a statement?

You: Yes, try that

OpenClaw:
- Editing prompt to start with questions...
- Running benchmark...
- Result: 19.2% reply rate (8/42 replies)
- ❌ DECLINE: -2.9 percentage points
- Reverting changes...
- Logging to autoresearch.ideas.md

Try a different approach?
```

---

## Advanced: Custom Experiments

You can also manually edit code and ask OpenClaw to benchmark:

```
I just updated the email prompt manually. Run the benchmark and log the result.
```

---

## Safety Notes

1. **Autoresearch will edit your code** - Make sure you're on a git branch
2. **Use test mode first** - Consider running experiments on a copy of production data
3. **Monitor costs** - Each experiment sends real emails via OpenAI API
4. **Statistical confidence** - Wait for 3+ experiments before trusting results

---

## Stopping the Loop

To pause optimization:

```
Stop the autoresearch loop and show me the summary
```

To resume later:

```
/autoresearch

Continue the optimization loop from where we left off
```

---

## Expected Results

After 10-15 experiments, you should see:
- **Reply rate improvement:** 15-20% → 25-35%+
- **More meeting requests:** Better qualified leads
- **Optimized email style:** Proven tone, length, and CTAs

The system learns what works by:
- Testing small changes
- Measuring real outcomes
- Keeping winners, discarding losers
- Building on successful patterns

---

## Troubleshooting

### "No replies in database yet"
- Run a scan first: `curl -X POST https://backend-production-d5926.up.railway.app/api/run/scan`
- Or manually send some test emails via the dashboard

### "Metric not found in output"
- Check `./autoresearch.sh` runs successfully: `bash autoresearch.sh`
- Ensure backend is accessible: `curl https://backend-production-d5926.up.railway.app/health`

### "Session locked by another agent"
- Remove lock: `rm autoresearch.lock`
- Or wait for current session to finish

---

## Next Steps

1. Run `/autoresearch setup` to initialize
2. Establish baseline reply rate
3. Let OpenClaw optimize for 1-2 hours
4. Review results in `autoresearch.md`
5. Deploy winning changes to production

Happy optimizing! 🚀
