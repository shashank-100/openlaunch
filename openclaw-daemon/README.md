# openclaw-daemon — RETIRED

This daemon has been replaced by the proper architecture:

## Old (daemon)
- `setInterval` every 2h → scan companies
- `setInterval` every 30m → send follow-ups
- `setInterval` every 30m → check Gmail replies
- BullMQ worker → process research jobs
- TypeScript process that dies on crash

## New (OpenClaw + Railway)

```
OpenClaw cron (every 2h)  → signal-scanner skill → POST /api/run/scan
OpenClaw cron (every 30m) → follow-up skill      → POST /api/run/follow-ups
OpenClaw cron (every 30m) → inbox-monitor skill  → POST /api/run/inbox
```

All intelligence is in the Railway backend (`/backend/main.py`).
All scheduling is in OpenClaw crons (`openclaw cron list`).

## Skills location
`/openclaw-service/skills/`
