import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import accountRoutes from './routes/accounts';
import signalRoutes from './routes/signals';
import briefRoutes from './routes/briefs';
import outreachRoutes from './routes/outreach';
import webhookRoutes from './routes/webhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

export const researchQueue = new Queue('research-jobs', {
  connection: parseRedisConnection(process.env.REDIS_URL),
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost')) return callback(null, true);
    if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app')) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', ts: new Date().toISOString() }));

app.use('/api/webhook', webhookRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/briefs', briefRoutes);
app.use('/api/outreach', outreachRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Geodo Backend on port ${PORT}`);
});
