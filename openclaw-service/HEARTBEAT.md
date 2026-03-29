# HEARTBEAT.md

## Cadence-Based Checks

Read `/Users/shashank/openlaunch/geodo/openclaw-service/heartbeat-state.json`. Run whichever check is most overdue.

**Cadences:**
- Backend health: every 30 min (anytime)
- Pending signals: every 2 hours (anytime)
- Overdue follow-ups: every 30 min (anytime)
- Cron status: every 2 hours (anytime)

**Process:**
1. Load timestamps from `/Users/shashank/openlaunch/geodo/openclaw-service/heartbeat-state.json`
2. Calculate which check is most overdue
3. Run that check
4. Update timestamp in `/Users/shashank/openlaunch/geodo/openclaw-service/heartbeat-state.json`
5. If actionable issue found, output the warning message. Otherwise output `HEARTBEAT_OK` (do NOT try to send Telegram messages yourself, just output text)

---

## Backend Health Check

```bash
curl -s https://backend-production-d5926.up.railway.app/health
```

**Report ONLY if:** response is not `{"status":"healthy"}` or request fails

**Update:** `backend` timestamp in state file

---

## Pending Signals Check

```bash
curl -s "https://backend-production-d5926.up.railway.app/api/signal-outreach?status=pending&limit=500"
```

**Report ONLY if:** > 300 pending signals (approvals being ignored)

Message: `⚠️ INTAKE: [N] signals waiting for approval`

**Update:** `signals` timestamp in state file

---

## Overdue Follow-ups Check

```bash
curl -s "https://backend-production-d5926.up.railway.app/api/follow-ups/due"
```

**Report ONLY if:** > 10 follow-ups due (follow-up cron may be stuck)

Message: `⚠️ INTAKE: [N] follow-ups overdue — check geodo-follow-ups cron`

**Update:** `followups` timestamp in state file

---

## Cron Status Check

```bash
openclaw cron list
```

**Report ONLY if:** any of `geodo-signal-scan`, `geodo-follow-ups`, `geodo-inbox` shows `error` status

Message: `⚠️ INTAKE cron error: [cron-name] — check logs`

**Update:** `crons` timestamp in state file

---

---

## State File

`heartbeat-state.json`:
```json
{
  "lastChecks": {
    "backend": 0,
    "signals": 0,
    "followups": 0,
    "crons": 0
  }
}
```
