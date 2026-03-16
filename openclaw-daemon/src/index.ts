import dotenv from 'dotenv';
import crypto from 'crypto';
import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { runMonitorAgent } from './openclawClient';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function parseRedis(url?: string) {
  if (!url) return { host: 'localhost', port: 6379 };
  try {
    const p = new URL(url);
    return {
      host: p.hostname,
      port: parseInt(p.port || '6379'),
      ...(p.password && { password: p.password }),
      ...(p.protocol === 'rediss:' && { tls: {} }),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConn = parseRedis(process.env.REDIS_URL);
const queue = new Queue('research-jobs', { connection: redisConn });

function hashSignal(accountId: string, type: string, summary: string) {
  return crypto.createHash('md5')
    .update(`${accountId}:${type}:${summary.toLowerCase().trim()}`)
    .digest('hex');
}

// Daemon owns: fetch accounts, call OpenClaw, save result, deduplicate
async function processMonitorJob(job: any) {
  const { companyName, domain, accountId } = job.data;
  console.log(`\n📡 Monitoring: ${companyName}`);

  // Call OpenClaw — it only knows about the web
  const result = await runMonitorAgent(companyName, domain || '');

  // Daemon owns: deduplication
  const hash = hashSignal(accountId, result.signal_type, result.signal_summary);
  const { error } = await supabase.from('signals').insert({
    account_id: accountId,
    signal_type: result.signal_type,
    signal_summary: result.signal_summary,
    pain_point: result.pain_point,
    outreach_angle: result.outreach_angle,
    email_subject: result.email_subject,
    email_body: result.email_body,
    source_url: result.source_url || null,
    signal_hash: hash,
    is_new: true,
  });

  if (error && error.code !== '23505') throw error; // 23505 = dupe, skip silently

  // Daemon owns: update account state
  await supabase.from('accounts')
    .update({ last_monitored_at: new Date().toISOString() })
    .eq('id', accountId);

  const isNew = !error;
  console.log(`✅ ${companyName} — ${isNew ? result.signal_summary : 'dupe, skipped'}`);
  return { success: true, isNew };
}

// Daemon owns: scheduling logic
async function runScheduler() {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('monitoring_enabled', true);

  if (!accounts?.length) return;

  let queued = 0;
  const now = Date.now();

  for (const account of accounts) {
    const freq = account.monitoring_frequency || 'daily';
    const threshold =
      freq === 'hourly' ? 60 * 60 * 1000 :
      freq === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
      24 * 60 * 60 * 1000;

    const last = account.last_monitored_at
      ? new Date(account.last_monitored_at).getTime() : 0;

    if (now - last >= threshold) {
      await queue.add('monitor', {
        companyName: account.company_name,
        domain: account.domain || '',
        accountId: account.id,
      }, { removeOnComplete: true, attempts: 2 });
      queued++;
    }
  }

  if (queued > 0) console.log(`🕐 Queued ${queued} monitor jobs`);
}

async function start() {
  console.log('🚀 INTAKE Daemon — starting');
  console.log('   Daemon: accounts, scheduling, dedup, persistence');
  console.log('   OpenClaw: web search, signal detection');

  const worker = new Worker('research-jobs', processMonitorJob, {
    connection: redisConn,
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} done`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id}:`, err.message));

  await runScheduler();
  setInterval(runScheduler, 15 * 60 * 1000);

  console.log('✅ Daemon running — scheduler every 15 min');
  process.on('SIGTERM', async () => { await worker.close(); process.exit(0); });
}

start().catch(err => { console.error('Fatal:', err); process.exit(1); });
