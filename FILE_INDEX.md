# Geodo - Complete File Index

This document lists every file in the Geodo project and its purpose.

---

## 📁 Root Directory

| File | Purpose |
|------|---------|
| `README.md` | Main documentation - setup, usage, architecture |
| `QUICKSTART.md` | 10-minute getting started guide |
| `DEPLOYMENT.md` | Production deployment instructions |
| `PROJECT_SUMMARY.md` | Technical overview and architecture |
| `TESTING.md` | Complete testing scenarios and guide |
| `FILE_INDEX.md` | This file - complete file listing |
| `package.json` | Root workspace configuration |
| `.env.example` | Environment variables template |
| `setup.sh` | Automated setup script |

---

## 📦 Backend (`/backend`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Backend dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |

### Source Code (`/backend/src`)

#### Main Entry Point
| File | Purpose |
|------|---------|
| `index.ts` | Express server, middleware, routes setup |

#### Type Definitions (`/backend/src/types`)
| File | Purpose |
|------|---------|
| `index.ts` | TypeScript interfaces (ResearchJob, Brief, etc.) |

#### API Routes (`/backend/src/routes`)
| File | Purpose |
|------|---------|
| `webhook.ts` | POST /api/webhook/research - Trigger jobs |
| `briefs.ts` | GET /api/briefs - List and retrieve briefs |
| `calendar.ts` | Calendar OAuth and sync endpoints |
| `auth.ts` | User signup and login |

### Key Endpoints
```
POST   /api/webhook/research       # Trigger research job
GET    /api/webhook/job/:jobId     # Get job status
GET    /api/briefs                 # List briefs for user
GET    /api/briefs/:briefId        # Get specific brief
POST   /api/briefs/:briefId/rate   # Rate brief
GET    /api/calendar/connect/google  # Start OAuth
GET    /api/calendar/callback/google # OAuth callback
POST   /api/calendar/sync/:userId  # Sync calendar
POST   /api/auth/signup            # Create account
POST   /api/auth/login             # Login
```

---

## 🤖 OpenClaw Daemon (`/openclaw-daemon`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Daemon dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |

### Source Code (`/openclaw-daemon/src`)

#### Main Entry Point
| File | Purpose |
|------|---------|
| `index.ts` | BullMQ worker, browser initialization, job processing |

#### Research Agent (`/openclaw-daemon/src/agents`)
| File | Purpose |
|------|---------|
| `ResearchAgent.ts` | Core research orchestrator - visits sources, generates briefs |

**Key Methods:**
- `research()` - Main research flow
- `extractWithRetry()` - Retry logic for sources
- `generateBrief()` - Claude API integration
- `logAgentAction()` - Agent activity logging

#### Research Sources (`/openclaw-daemon/src/sources`)
| File | Purpose |
|------|---------|
| `index.ts` | 10 research source definitions and extractors |

**Sources Implemented:**
1. Company Website
2. LinkedIn Company
3. LinkedIn Contact
4. Crunchbase
5. Google News
6. BuiltWith (placeholder)
7. LinkedIn Jobs
8. G2
9. Twitter/X (placeholder)
10. Company Blog (placeholder)

#### Utilities (`/openclaw-daemon/src/utils`)
| File | Purpose |
|------|---------|
| `signalDetector.ts` | Analyzes data to detect high-value signals |

**Signals Detected:**
- Hiring surge
- Engineering expansion
- Recent funding
- New leadership
- Product launches
- Competitor evaluation
- Company scale
- Decision maker role

---

## 🎨 Frontend (`/frontend`)

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Frontend dependencies and scripts |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |

### App Directory (`/frontend/app`)

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout, metadata, global styles |
| `page.tsx` | Landing page with marketing content |
| `globals.css` | Global CSS with Tailwind directives |

### Dashboard (`/frontend/app/dashboard`)
| File | Purpose |
|------|---------|
| `page.tsx` | Main dashboard UI - stats, briefs list |

**Features:**
- Stats overview (total, this week, completed, processing)
- Briefs list with status indicators
- Meeting time display
- Empty state handling
- Navigation to brief details

---

## 💾 Database (`/database`)

| File | Purpose |
|------|---------|
| `schema.sql` | Complete Supabase database schema |

**Tables (14 total):**
1. `users` - User profiles
2. `organizations` - Teams/companies
3. `organization_members` - Team membership
4. `calendar_connections` - OAuth tokens for calendars
5. `slack_connections` - Slack workspace integrations
6. `crm_connections` - Salesforce/HubSpot credentials
7. `research_jobs` - Job tracking and status
8. `briefs` - Generated intelligence briefs
9. `agent_logs` - Full agent replay log
10. `signals` - Detected signals
11. `research_sources` - Custom source configurations
12. `user_preferences` - User settings
13. `brief_ratings` - Feedback loop
14. Indexes and RLS policies

---

## 📊 File Structure Overview

```
geodo/
├── 📄 Documentation (9 files)
│   ├── README.md                 # Main docs
│   ├── QUICKSTART.md             # Quick start
│   ├── DEPLOYMENT.md             # Production deploy
│   ├── PROJECT_SUMMARY.md        # Technical overview
│   ├── TESTING.md                # Test guide
│   ├── FILE_INDEX.md             # This file
│   ├── package.json              # Root config
│   ├── .env.example              # Env template
│   └── setup.sh                  # Setup script
│
├── 🗄️ Database (1 file)
│   └── database/
│       └── schema.sql            # Supabase schema
│
├── ⚙️ Backend (8 files)
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts          # Main server
│           ├── types/
│           │   └── index.ts      # TypeScript types
│           └── routes/
│               ├── webhook.ts    # Job creation
│               ├── briefs.ts     # Brief retrieval
│               ├── calendar.ts   # Calendar OAuth
│               └── auth.ts       # Authentication
│
├── 🤖 OpenClaw Daemon (7 files)
│   └── openclaw-daemon/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts          # Worker daemon
│           ├── agents/
│           │   └── ResearchAgent.ts
│           ├── sources/
│           │   └── index.ts      # 10 sources
│           └── utils/
│               └── signalDetector.ts
│
└── 🎨 Frontend (7 files)
    └── frontend/
        ├── package.json
        ├── next.config.js
        ├── tailwind.config.ts
        └── app/
            ├── layout.tsx        # Root layout
            ├── page.tsx          # Landing page
            ├── globals.css       # Global styles
            └── dashboard/
                └── page.tsx      # Dashboard UI

Total: 32 source files
```

---

## 🔍 Key Files by Function

### Getting Started
1. `README.md` - Start here
2. `QUICKSTART.md` - Fast setup
3. `setup.sh` - Run this script
4. `.env.example` - Configure environment

### Development
1. `backend/src/index.ts` - Backend entry
2. `openclaw-daemon/src/index.ts` - Daemon entry
3. `frontend/app/page.tsx` - Frontend entry

### Core Logic
1. `openclaw-daemon/src/agents/ResearchAgent.ts` - Research engine
2. `openclaw-daemon/src/sources/index.ts` - Data extraction
3. `openclaw-daemon/src/utils/signalDetector.ts` - Signal detection

### API Layer
1. `backend/src/routes/webhook.ts` - Job triggering
2. `backend/src/routes/briefs.ts` - Brief retrieval
3. `backend/src/routes/calendar.ts` - Calendar integration

### Database
1. `database/schema.sql` - Complete schema

### Deployment
1. `DEPLOYMENT.md` - Production guide
2. `package.json` files - Build configs

### Testing
1. `TESTING.md` - Test scenarios

---

## 📝 Lines of Code Summary

| Component | Files | Approx Lines |
|-----------|-------|--------------|
| Backend API | 5 | ~800 |
| OpenClaw Daemon | 4 | ~1,200 |
| Frontend | 5 | ~800 |
| Database Schema | 1 | ~300 |
| Documentation | 6 | ~2,500 |
| **Total** | **21** | **~5,600** |

---

## 🎯 File Ownership

### Backend Team
- `backend/src/**/*.ts`
- `backend/package.json`
- `backend/tsconfig.json`

### AI/Research Team
- `openclaw-daemon/src/**/*.ts`
- `openclaw-daemon/package.json`
- `openclaw-daemon/tsconfig.json`

### Frontend Team
- `frontend/app/**/*.tsx`
- `frontend/**/*.css`
- `frontend/package.json`

### Database Team
- `database/schema.sql`

### DevOps Team
- `DEPLOYMENT.md`
- `setup.sh`
- Root `package.json`

### Documentation Team
- All `.md` files

---

## 🔄 Build Artifacts (Generated, Not Tracked)

```
backend/dist/           # Compiled TypeScript
openclaw-daemon/dist/   # Compiled TypeScript
frontend/.next/         # Next.js build
node_modules/           # Dependencies (3 locations)
.env                    # Environment (gitignored)
```

---

## 🚫 Files NOT Included (For Production)

These would be added in a real production deployment:

- `.gitignore` - Git ignore rules
- `.dockerignore` - Docker ignore rules
- `Dockerfile` - Container definitions
- `docker-compose.yml` - Multi-container setup
- `.github/workflows/` - CI/CD pipelines
- `jest.config.js` - Test configuration
- `__tests__/` - Test files
- `.prettierrc` - Code formatting
- `.eslintrc` - Linting rules

---

## 📦 Dependencies Overview

### Backend
- express - API server
- bullmq - Job queue
- @supabase/supabase-js - Database
- @anthropic-ai/sdk - Claude API
- googleapis - Google Calendar
- cors, zod, dotenv - Utilities

### OpenClaw Daemon
- playwright - Browser automation
- bullmq - Job processing
- @supabase/supabase-js - Database
- @anthropic-ai/sdk - Claude API
- cheerio - HTML parsing

### Frontend
- next - React framework
- react - UI library
- @supabase/supabase-js - Database
- tailwindcss - Styling
- lucide-react - Icons

---

**📚 This index covers all 32 source files in the Geodo project.**
