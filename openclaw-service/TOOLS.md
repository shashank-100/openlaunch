# TOOLS.md - INTAKE Environment Setup

This file documents INTAKE-specific tool configurations and environment details.

## Backend API

**Production URL:** `https://backend-production-d5926.up.railway.app`

**Health Check:**
```bash
curl https://backend-production-d5926.up.railway.app/health
```

**Key Endpoints:**
- `GET /api/persona` - Get user's pitch, tone, ICP preferences
- `POST /api/signal-outreach/ingest` - Save discovered signals
- `POST /api/run/scan` - Trigger manual discovery scan
- `POST /api/run/follow-ups` - Process due follow-ups
- `POST /api/run/inbox` - Monitor inbox for replies
- `GET /api/follow-ups/due` - Get due follow-ups with context
- `POST /api/follow-ups/{id}/send` - Send a follow-up email
- `GET /api/inbox/raw` - Get raw Gmail replies
- `POST /api/inbox/classify` - Save classified reply

## Skills Available

**Bash** - Execute shell commands
- Used for: `curl` to backend, checking heartbeat state
- Allowed in all skills

**WebSearch (Tavily)** - Real-time web search
- Used for: Company discovery, signal research
- Allowed in: signal-scanner
- API key managed by OpenClaw config

## Email Format Rules

When drafting emails:

1. **Greeting:** `Hi [FirstName],` (extract first name from full name)
2. **Body:** 4-5 lines max, broken with `\n\n`
3. **Signature:** `[Your Name]` (placeholder, replaced by backend)
4. **Subject:** Specific hook, not generic

**Valid email format:**
```
firstname@domain.com
first.last@domain.com
f.lastname@domain.com
```

**Strip these GPT artifacts:**
- `(inferred)`
- `(guessed)`
- `(estimated)`
- Anything in parentheses after email

## Telegram Notifications

Bot: `TELEGRAM_BOT_TOKEN` (in backend env)
Chat: `TELEGRAM_CHAT_ID` (in backend env)

Alerts sent for:
- Hot leads (interested, meeting_request intents)
- Scan completion reports
- Error conditions (from heartbeat checks)

## Cron Schedule

- **Signal scan:** Every 2 hours
- **Follow-ups:** Every 30 minutes
- **Inbox monitor:** Every 30 minutes
- **Heartbeat checks:** Every 15 minutes

## OpenClaw Config Location

`/Users/shashank/openlaunch/geodo/openclaw-service/openclaw.config.json`

Skills directory:
`/Users/shashank/openlaunch/geodo/openclaw-service/skills/`

## Heartbeat State

Track check timestamps in:
`/Users/shashank/openlaunch/geodo/openclaw-service/heartbeat-state.json`

Format:
```json
{
  "lastChecks": {
    "backend": <unix-timestamp>,
    "signals": <unix-timestamp>,
    "followups": <unix-timestamp>,
    "crons": <unix-timestamp>
  }
}
```

## Gmail Integration

Managed by backend (FastAPI).

OAuth flow:
1. User clicks "Connect Gmail" in settings
2. Backend redirects to Google OAuth
3. Callback stores refresh_token in Supabase personas table
4. Skills call backend, backend refreshes token as needed

Skills NEVER touch Gmail directly — all email operations go through backend API.

## Database Tables

Skills don't query database directly — always use backend API.

Key tables (for reference):
- `personas` - User pitch, tone, ICP, Gmail tokens
- `signal_outreach` - Discovered signals pending approval
- `signal_replies` - Classified replies from inbox
- `follow_up_queue` - Scheduled follow-ups
- `accounts` - Target companies being monitored

## Development vs Production

**Dev:** OpenClaw runs locally on MacBook
**Prod:** Would need OpenClaw on persistent VM (not Railway container)

Current setup is dev-only — crons stop when laptop sleeps.

## Debugging Commands

Check cron status:
```bash
openclaw cron list
```

Run skill manually:
```bash
openclaw cron run <cron-id>
```

View logs:
```bash
openclaw logs | grep geodo
```

Check backend health:
```bash
curl https://backend-production-d5926.up.railway.app/health
```

Get pending signals:
```bash
curl https://backend-production-d5926.up.railway.app/api/signal-outreach?status=pending
```

---

Update this file as you discover new patterns or environment-specific details.
