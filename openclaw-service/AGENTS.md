# AGENTS.md - INTAKE Agent Configuration

This folder contains OpenClaw skills that power INTAKE's autonomous sales engine.

## Agent Behavior

This agent runs in **isolated cron sessions** — each skill execution is independent with no shared context between runs.

### Cron Jobs

**geodo-signal-scan** (every 2h)
- Discovers companies with buying signals via Tavily
- Researches each company deeply
- Drafts personalized cold emails
- Saves to `signal_outreach` table
- Message: `Read /Users/shashank/openlaunch/geodo/openclaw-service/skills/signal-scanner/SKILL.md and execute it`

**geodo-follow-ups** (every 30m)
- Checks for due follow-ups in `follow_up_queue`
- Generates personalized follow-up emails (Day 3, 7, 14)
- Sends via Gmail API
- Message: `Read /Users/shashank/openlaunch/geodo/openclaw-service/skills/follow-up/SKILL.md and execute it`

**geodo-inbox** (every 30m)
- Monitors Gmail for replies to sent outreach
- Classifies reply intent (interested, meeting_request, question, objection, etc.)
- Drafts and auto-sends responses
- Cancels pending follow-ups when prospect replies
- Sends Telegram alerts for hot leads
- Message: `Read /Users/shashank/openlaunch/geodo/openclaw-service/skills/inbox-monitor/SKILL.md and execute it`

**geodo-heartbeat** (every 15m)
- Runs cadence-based health checks (backend, signals, follow-ups, crons)
- Only alerts on issues (no noise)
- Message: `Read /Users/shashank/openlaunch/geodo/openclaw-service/HEARTBEAT.md and run the most overdue check as described.`

## Skills Directory

Each skill has a `SKILL.md` that defines:
- What it does
- Tools it can use (Bash, WebSearch)
- Step-by-step execution flow
- Expected output format

Skills are **read-only instructions**. They don't persist state — everything goes to the backend API.

## Memory

Cron sessions are **stateless**:
- No MEMORY.md loading
- No daily logs
- Each run starts fresh with only the SKILL.md instructions

All persistence happens via:
- Backend API endpoints (`/api/run/scan`, `/api/run/inbox`, etc.)
- Supabase database tables
- Telegram notifications for delivery

## Safety

- Skills NEVER modify local files
- All writes go through backend API
- No destructive operations
- Errors are logged but don't retry infinitely (backoff applied)

## Debugging

Check cron status:
```bash
openclaw cron list
```

View logs:
```bash
openclaw logs | grep geodo
```

Run skill manually:
```bash
openclaw cron run <cron-id>
```
