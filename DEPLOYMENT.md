# Geodo Deployment Guide

## Production Deployment Checklist

### 1. Pre-Deployment Setup

#### A. Supabase Production Setup
```bash
1. Create production Supabase project
2. Run database/schema.sql in SQL Editor
3. Enable Row Level Security on all tables
4. Copy production credentials:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
```

#### B. Redis Setup (Railway/Upstash)
```bash
# Railway Redis
railway add redis

# Or use Upstash (serverless Redis)
# Get connection URL from dashboard
```

#### C. Anthropic API Key
```bash
# Get API key from: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...
```

#### D. Google Calendar OAuth
```bash
1. Go to: https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - https://yourdomain.com/api/auth/google/callback
4. Enable Google Calendar API
5. Copy:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
```

---

## 2. Deployment on Railway

### Deploy Backend

```bash
cd backend

# Initialize Railway project
railway init

# Add environment variables
railway variables set \
  SUPABASE_URL="your_url" \
  SUPABASE_SERVICE_KEY="your_key" \
  ANTHROPIC_API_KEY="your_key" \
  REDIS_URL="redis://..." \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..."

# Deploy
railway up
```

### Deploy OpenClaw Daemon

```bash
cd openclaw-daemon

# Create separate Railway service
railway init

# Add same environment variables
railway variables set ...

# Deploy
railway up
```

### Deploy Frontend

```bash
cd frontend

# Initialize Railway/Vercel
railway init
# or: vercel --prod

# Add environment variables
railway variables set \
  NEXT_PUBLIC_SUPABASE_URL="your_url" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key" \
  NEXT_PUBLIC_BACKEND_URL="https://your-backend.railway.app"

# Deploy
railway up
```

---

## 3. Deployment on Render

### render.yaml

Create `render.yaml` in root:

```yaml
services:
  # Backend API
  - type: web
    name: geodo-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: REDIS_URL
        fromService:
          type: redis
          name: geodo-redis
          property: connectionString

  # OpenClaw Daemon
  - type: worker
    name: geodo-daemon
    env: node
    buildCommand: cd openclaw-daemon && npm install && npm run build
    startCommand: cd openclaw-daemon && npm start
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: REDIS_URL
        fromService:
          type: redis
          name: geodo-redis
          property: connectionString

  # Frontend
  - type: web
    name: geodo-frontend
    env: node
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: NEXT_PUBLIC_BACKEND_URL
        value: https://geodo-backend.onrender.com

databases:
  - name: geodo-redis
    type: redis
    plan: starter
```

---

## 4. Docker Deployment

### Dockerfile (Backend)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

### Dockerfile (OpenClaw Daemon)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY openclaw-daemon/package*.json ./
RUN npm install --production

COPY openclaw-daemon/src ./src
COPY openclaw-daemon/tsconfig.json ./

RUN npm run build

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis

  daemon:
    build:
      context: .
      dockerfile: Dockerfile.daemon
    environment:
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - backend

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_BACKEND_URL=http://backend:4000
    depends_on:
      - backend
```

---

## 5. Production Optimizations

### A. Add Health Checks

```typescript
// backend/src/index.ts
app.get('/health', async (req, res) => {
  // Check Redis
  const redisHealth = await checkRedis();

  // Check Supabase
  const dbHealth = await checkDatabase();

  res.json({
    status: redisHealth && dbHealth ? 'healthy' : 'unhealthy',
    redis: redisHealth,
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});
```

### B. Add Request Logging

```bash
npm install morgan
```

```typescript
import morgan from 'morgan';

app.use(morgan('combined'));
```

### C. Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### D. Enable HTTPS

```typescript
// For production behind a proxy
app.set('trust proxy', 1);
```

---

## 6. Monitoring & Logging

### A. Sentry Integration

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### B. Logging to External Service

Use Railway Logs, Datadog, or LogDNA:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

---

## 7. Environment Variables (Production)

### Backend/Daemon

```env
NODE_ENV=production
BACKEND_PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-xxx
REDIS_URL=redis://default:password@redis.railway.internal:6379
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx
SENDGRID_API_KEY=SG.xxx
```

### Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

---

## 8. Post-Deployment Testing

### Test Backend Health

```bash
curl https://api.yourdomain.com/health
```

### Test Webhook

```bash
curl -X POST https://api.yourdomain.com/api/webhook/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "contactName": "John Doe",
    "userId": "test-user",
    "organizationId": "test-org"
  }'
```

### Test Frontend

Visit: `https://yourdomain.com`

---

## 9. Scaling Considerations

### Horizontal Scaling

- Backend: Stateless, can scale to N instances
- Daemon: Use `concurrency` setting in BullMQ
- Frontend: Edge deployment on Vercel

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_jobs_status_created ON research_jobs(status, created_at DESC);
CREATE INDEX idx_briefs_user_created ON briefs(user_id, created_at DESC);
```

### Redis Optimization

- Use Redis Cluster for high availability
- Configure max memory and eviction policy
- Monitor queue depth

---

## 10. Security Hardening

### A. Secrets Management

Use Railway/Render secret management or:
- AWS Secrets Manager
- HashiCorp Vault
- Doppler

### B. API Security

```typescript
// Add CORS restrictions
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true,
}));

// Add helmet for security headers
import helmet from 'helmet';
app.use(helmet());
```

### C. Database Security

- Enable RLS on all Supabase tables
- Use service key only in backend
- Rotate keys regularly

---

## 11. Backup Strategy

### Database Backups

Supabase provides automatic daily backups. For additional safety:

```bash
# Manual backup via CLI
supabase db dump > backup-$(date +%Y%m%d).sql
```

### Redis Persistence

```bash
# Enable AOF (Append Only File) in Redis
redis-cli CONFIG SET appendonly yes
```

---

## 12. Rollback Plan

### Quick Rollback

```bash
# Railway
railway rollback

# Render
# Use dashboard to revert to previous deploy

# Docker
docker-compose down
docker-compose up -d --build previous-tag
```

---

**🚀 You're ready to deploy Geodo to production!**
