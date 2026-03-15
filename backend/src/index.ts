import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import webhookRoutes from './routes/webhook';
import briefRoutes from './routes/briefs';
import calendarRoutes from './routes/calendar';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Initialize Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Parse Redis connection — handles redis://, rediss://, and authenticated URLs
function parseRedisConnection(url?: string) {
  if (!url) return { host: 'localhost', port: 6379 };
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379'),
      ...(parsed.password && { password: parsed.password }),
      ...(parsed.protocol === 'rediss:' && { tls: {} }),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

// Initialize Redis job queue
export const researchQueue = new Queue('research-jobs', {
  connection: parseRedisConnection(process.env.REDIS_URL),
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    // Allow any railway.app subdomain
    if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/briefs', briefRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Geodo Backend running on port ${PORT}`);
  console.log(`📊 Dashboard: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
});
