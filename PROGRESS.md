# Geodo / OpenClaw — Progress Status

_Last updated: 2026-03-15 — All features shipped ✅_

---

## System Overview

```
Frontend (Next.js/Vercel)  →  Backend (Express/BullMQ/Railway)  →  Redis Queue (Railway)
                                                                          ↓
                                                                   Daemon (Railway)
                                                                          ↓
                                                               Tavily API (8 sources)
                                                                          ↓
                                                               OpenAI GPT-4o-mini
                                                                          ↓
                                                                Supabase (briefs, signals)
```

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://frontend-mks4sjs7y-shashank100s-projects.vercel.app |
| Backend (Railway) | https://backend-production-d5926.up.railway.app |
| Health | https://backend-production-d5926.up.railway.app/health |

Railway Project: `intake` (ID: `79da7ea6-7b09-4bea-a3d0-8713384677c9`)

---

## ✅ END-TO-END VERIFIED (2026-03-15)

**Test 1 — Stripe / Patrick Collison**
- Job ID: `1` → `state: "completed"`, `progress: 100`
- Brief ID: `5811c4bd-0a7c-4867-91f6-9fe9a893e6ad`
- 8 sources visited, company snapshot, competitive context, contact intel, suggested openers ✅

**Test 2 — Anthropic / Dario Amodei (Vercel deploy)**
- Job ID: `2` → completed in ~45s
- Brief ID: `e34bf4d1-5ef5-4665-bebc-1d8b34a39f79`
- Full brief rendered on Vercel frontend ✅

---

## ✅ ALL SERVICES LIVE

| Service | Platform | Status |
|---------|----------|--------|
| Frontend | Vercel | ✅ LIVE |
| Backend | Railway | ✅ LIVE |
| Daemon | Railway | ✅ LIVE |
| Redis | Railway | ✅ LIVE |

---

## ✅ DONE

### Core Pipeline
- [x] **Tavily API integration** — All 8 research sources rewritten from Google scraping to Tavily
  - Company Overview, Funding & Company Info, Recent News, Tech Stack
  - Hiring Signals, Reviews & Reputation, Competitor Research, Contact Research
- [x] **Signals insert fix** — Removed non-existent `description` column, moved to `metadata`
- [x] **Signal detector fix** — Updated source name refs (`LinkedIn Jobs` → `Hiring Signals`, `Google News` → `Recent News`)
- [x] **OpenAI model fix** — `gpt-5-mini` → `gpt-4o-mini` everywhere
- [x] **Playwright removed from daemon** — All sources use Tavily HTTP; switched to `node:20-alpine` (~150MB vs ~1.5GB)

### Frontend Pages (all built & working)
- [x] **Home** — Company + contact input, submits research job
- [x] **Research progress** (`/research/[jobId]`) — Live polling, source checklist, log terminal
- [x] **Brief** (`/brief/[briefId]`) — Signals, company snapshot, tech stack, competitive context, contact intel, suggested openers
- [x] **Brief sharing** — "share" button copies URL to clipboard
- [x] **Brief rating** — ↑/↓ buttons, green/red feedback
- [x] **Buyer one-pager** (`/buyer/[briefId]`) — Optional meeting notes → GPT-generated buyer asset
- [x] **History** (`/history`) — All briefs for demo user, click to open
- [x] **Dashboard** (`/dashboard`) — Stats (total briefs, this week, avg sources) + brief list

### Backend
- [x] **CORS** — Allows `*.railway.app` and `*.vercel.app`
- [x] **Railway PORT fix** — Uses `process.env.PORT` first
- [x] **Brief rating userId** — Optional, falls back to demo user

### Deployment
- [x] **Frontend on Vercel** — `vercel --prod --yes` from `frontend/` dir
- [x] **Backend + Daemon on Railway** — `railway up <dir> --path-as-root --service <name>`
- [x] **Dockerfiles** — `npm install` (no package-lock.json in monorepo subdirs)
- [x] **Redis private URL** — `redis-2d0c7bbf.railway.internal:6379`
- [x] **Frontend BACKEND hardcoded** — Vercel doesn't bake env vars at build time without explicit config

---

## ❌ What Was Broken & Fixed

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Google scraping blocked | Bot detection | Replaced with Tavily API |
| Daemon crashed on Railway | Playwright image v1.40 vs package v1.58 | Removed Playwright entirely |
| Backend healthcheck failed | `BACKEND_PORT` vs Railway's `PORT` | Added `process.env.PORT` fallback |
| Build fails: no package-lock.json | Monorepo root has lock, not subdirs | `npm ci` → `npm install` |
| Build uses Railpack not Dockerfile | `railway up` from root sees workspace | Use `--path-as-root` per service dir |
| Signals insert fails | `description` column doesn't exist | Moved to `metadata` JSON field |
| Signal detector reads wrong names | Source names changed with Tavily rewrite | Fixed string refs |
| Wrong OpenAI model | `gpt-5-mini` doesn't exist | Fixed to `gpt-4o-mini` |
| Frontend shows "Brief not found" | `NEXT_PUBLIC_*` not baked at build time | Hardcoded prod backend URL |
| `/app/public` not found in Docker | No public dir existed | Created `public/.gitkeep` |
| CORS blocked Vercel → Railway | CORS only allowed `*.railway.app` | Added `*.vercel.app` |

---

## 📋 TODO (Post-Launch)

- [ ] Google Calendar webhook → auto-trigger research on meeting creation
- [ ] Auth flow for multi-user (currently demo hardcoded userId)
- [ ] Rate limiting per user
- [ ] Admin panel to see all org briefs
- [ ] Webhook endpoint for Zapier/Make integration
- [ ] Custom domain for Vercel frontend

---

## 🔑 Key Credentials (Dev)

| Key | Value |
|-----|-------|
| Tavily API | `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` |
| Supabase URL | `https://ybcomqhhtrwfygshhyat.supabase.co` |
| OpenAI Model | `gpt-4o-mini` |
| Demo User ID | `00000000-0000-0000-0000-000000000001` |
