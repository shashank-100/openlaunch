# Geodo Changes — 27 March 2026

## Backend (`backend/main.py`)
- **Fixed**: Removed 7 duplicate route registrations — old sync versions were silently overriding async ones with user_id filtering
- **Fixed**: GPT-generated `prospect_email` now validated (must have `@` + domain) before saving to DB or sending via Gmail
- **Fixed**: `intent` in `/api/inbox/classify` now clamped to allowed set `{meeting_request, interested, question, objection, not_interested, out_of_office, general}` before DB write
- **Fixed**: Footer/link filter in `/api/inbox/raw` — skips automated emails with <10 real words or 3+ links (fixes FundingPips false positive)
- **Added**: `GET /api/inbox/raw` — returns raw Gmail replies, no AI, for OpenClaw to classify
- **Added**: `POST /api/inbox/classify` — accepts OpenClaw's classification + draft, saves to DB, fires Telegram alert
- **Added**: `GET /api/follow-ups/due` — returns due follow-ups with full context for OpenClaw
- **Added**: `POST /api/follow-ups/{id}/send` — OpenClaw sends drafted email via Gmail
- **Added**: `POST /api/signal-outreach/ingest` — OpenClaw saves researched signal + schedules follow-ups

## OpenClaw Skills
- **signal-scanner** — rewritten from curl wrapper to full AI agent using Tavily WebSearch for discovery + research + email copywriting
- **follow-up** — rewritten to AI agent that writes personalized Day 3/7/14 emails with different angles
- **inbox-monitor** — rewritten to AI agent that classifies intent, drafts replies, books meetings via advanced-calendar
- **advanced-calendar** — installed from GitHub (`openclaw/skills`), auto-books meetings when `meeting_request` intent detected

## OpenClaw Crons
- All 3 crons switched model: `gpt-5.1-codex-mini` → `gpt-5-mini`
- `geodo-signal-scan` timeout: 30s → 300s (was timing out on multi-search runs)
- `geodo-follow-ups` timeout: 30s → 120s
- `geodo-inbox` timeout: 30s → 120s

## OpenClaw HEARTBEAT.md
- **Fixed**: Was architecture docs — now contains actual heartbeat instructions (backend health, pending signal count, overdue follow-ups, cron status)

## Frontend
- **New**: `app/components/Sidebar.tsx` — shared sidebar used across all pages (Inbox, Sent, Replies, Chat + Settings at bottom)
- **Rewrite**: `app/dashboard/page.tsx` — uses shared Sidebar, clean 4-section layout (inbox/sent/replies/chat)
- **Rewrite**: `app/settings/page.tsx` — uses shared Sidebar with `settingsActive`
- **New**: `app/api/chat/route.ts` — chat API using OpenAI gpt-5-mini + live backend context (signals, analytics)
- **Removed**: accounts, brief, buyer, feed, history, login, research, send pages

## Architecture shift
OpenClaw now owns all AI work: web search (Tavily), research, email copywriting, intent classification, meeting booking.
Backend is now a thin data + Gmail layer only — no OpenAI calls in the active flow.
