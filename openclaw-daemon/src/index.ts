import dotenv from 'dotenv';
import crypto from 'crypto';
import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { runMonitorAgent, runDiscoveryAgent, deliverAlert, deliverOutreach } from './openclawClient';

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
  const { companyName, domain, accountId, userPitch } = job.data;
  console.log(`\n📡 Monitoring: ${companyName}`);

  // Call OpenClaw — it only knows about the web
  const result = await runMonitorAgent(companyName, domain || '', userPitch);

  // Daemon owns: deduplication
  const hash = hashSignal(accountId, result.signal_type, result.signal_summary);
  const { data: insertedSignal, error } = await supabase.from('signals').insert({
    account_id: accountId,
    signal_type: result.signal_type,
    signal_summary: result.signal_summary,
    pain_point: result.pain_point,
    product_insight: result.product_insight || null,
    opportunity: result.opportunity || null,
    relevance_score: result.relevance_score || null,
    outreach_angle: result.outreach_angle,
    email_subject: result.email_subject,
    email_body: result.email_body,
    source_url: result.source_url || null,
    signal_hash: hash,
    is_new: true,
    should_contact: result.should_contact ?? false,
    priority: result.priority || 'medium',
    target_persona: result.target_persona || null,
    prospect_name: result.prospect_name || null,
    prospect_email: result.prospect_email || null,
    prospect_title: result.prospect_title || null,
    prospect_linkedin: result.prospect_linkedin || null,
    action: result.action || null,
    reason: result.reason || null,
    confidence: result.confidence || null,
    tech_stack: result.tech_stack || [],
  }).select('id').single();

  if (error && error.code !== '23505') throw error; // 23505 = dupe, skip silently

  // Daemon owns: update account state
  const { data: account } = await supabase.from('accounts')
    .update({ last_monitored_at: new Date().toISOString() })
    .eq('id', accountId)
    .select('auto_outreach_enabled')
    .single();

  const isNew = !error && insertedSignal;
  if (isNew) {
    // Deliver alerts if high priority
    await deliverAlert(companyName, result, insertedSignal.id);
    
    // Deliver automated outreach if recommended AND account has auto-pilot enabled
    if (result.should_contact && result.priority === 'high' && account?.auto_outreach_enabled) {
      await deliverOutreach(result, insertedSignal.id, accountId);
    }
  }

  console.log(`✅ ${companyName} — ${isNew ? result.signal_summary : 'dupe, skipped'}`);
  return { success: true, isNew };
}

async function processDiscoveryJob(job: any) {
  const { pitch, userId } = job.data;
  console.log(`\n🔎 Discovering companies for pitch: "${pitch}"`);

  const companies = await runDiscoveryAgent(pitch);
  console.log(`✨ Found ${companies.length} companies`);

  for (const co of companies) {
    // 1. Add to accounts (or get existing)
    const { data: existingAccount } = await supabase.from('accounts')
      .select('id')
      .eq('company_name', co.company_name)
      .single();

    let accountId = existingAccount?.id;

    if (!existingAccount) {
      const { data: newAccount, error } = await supabase.from('accounts').insert({
        user_id: userId || '00000000-0000-0000-0000-000000000001',
        company_name: co.company_name,
        domain: co.domain,
        user_pitch: pitch,
      }).select('id').single();

      if (error) {
        console.error(`Error adding ${co.company_name}:`, error.message);
        continue;
      }
      accountId = newAccount.id;
    }

    // 2. Immediately scan for signals (no queuing)
    console.log(`📡 Scanning ${co.company_name} for signals...`);
    const result = await runMonitorAgent(co.company_name, co.domain || '', pitch);

    // 3. Save signal with deduplication
    const hash = hashSignal(accountId!, result.signal_type, result.signal_summary);
    const { data: insertedSignal, error: signalError } = await supabase.from('signals').insert({
      account_id: accountId,
      signal_type: result.signal_type,
      signal_summary: result.signal_summary,
      pain_point: result.pain_point,
      product_insight: result.product_insight || null,
      opportunity: result.opportunity || null,
      relevance_score: result.relevance_score || null,
      outreach_angle: result.outreach_angle,
      email_subject: result.email_subject,
      email_body: result.email_body,
      source_url: result.source_url || null,
      signal_hash: hash,
      is_new: true,
      should_contact: result.should_contact ?? false,
      priority: result.priority || 'medium',
      target_persona: result.target_persona || null,
      prospect_name: result.prospect_name || null,
      prospect_email: result.prospect_email || null,
      prospect_title: result.prospect_title || null,
      prospect_linkedin: result.prospect_linkedin || null,
      action: result.action || null,
      reason: result.reason || null,
      tech_stack: result.tech_stack || [],
    }).select('id').single();

    const isNew = !signalError && insertedSignal;
    if (isNew) {
      // Send Telegram alert for high-priority signals
      await deliverAlert(co.company_name, result, insertedSignal.id);
      console.log(`✅ ${co.company_name} — ${result.signal_summary}`);
    } else {
      console.log(`⏭️  ${co.company_name} — duplicate signal, skipped`);
    }
  }

  return { success: true, count: companies.length };
}

// Run daily discovery to find NEW companies with signals
async function runDailyScan() {
  console.log('🌅 Running daily discovery...');

  // Get user's pitch from most recent account
  const { data: account } = await supabase
    .from('accounts')
    .select('user_pitch, user_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!account?.user_pitch) {
    console.log('❌ No user pitch found - skipping discovery');
    return;
  }

  console.log(`🔎 Running discovery for pitch: "${account.user_pitch}"`);

  // Run discovery to find NEW companies + signals
  await processDiscoveryJob({
    data: {
      pitch: account.user_pitch,
      userId: account.user_id || '00000000-0000-0000-0000-000000000001'
    }
  });

  console.log(`✅ Daily discovery complete`);
}

// Schedule daily scan at 8am
function scheduleDailyScan() {
  const now = new Date();
  const next8am = new Date();
  next8am.setHours(8, 0, 0, 0);
  if (next8am <= now) next8am.setDate(next8am.getDate() + 1);
  const msUntil8am = next8am.getTime() - now.getTime();
  console.log(`⏰ Next scan at 8am (in ${Math.round(msUntil8am / 1000 / 60)} min)`);
  setTimeout(() => {
    runDailyScan();
    setInterval(runDailyScan, 24 * 60 * 60 * 1000);
  }, msUntil8am);
}

// ── Sequence scheduler ──────────────────────────────────────────────────────
// Checks every 30 minutes for follow-up steps that are due
async function processSequenceStep(sequenceId: string) {
  const { data: seq } = await supabase
    .from('sequences')
    .select('*')
    .eq('id', sequenceId)
    .single();

  if (!seq || seq.status !== 'active') return;

  const steps: any[] = seq.steps || [];
  const currentStep = seq.current_step || 0;
  if (currentStep >= steps.length) {
    await supabase.from('sequences').update({ status: 'completed' }).eq('id', sequenceId);
    return;
  }

  const step = steps[currentStep];

  // Send the email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (resendKey && seq.prospect_email && step.body) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({ from: fromEmail, to: seq.prospect_email, subject: step.subject, text: step.body }),
    });
    const data = await res.json() as any;
    if (data.id) {
      console.log(`📧 Sequence step ${currentStep + 1} sent to ${seq.prospect_email}`);
    }
  }

  // Schedule next step if there is one
  const nextStep = steps[currentStep + 1];
  const nextStepIndex = currentStep + 1;

  await supabase.from('sequences').update({
    current_step: nextStepIndex,
    last_step_at: new Date().toISOString(),
    status: nextStepIndex >= steps.length ? 'completed' : 'active',
  }).eq('id', sequenceId);

  if (nextStep) {
    const delayDays = nextStep.delay_days || 3;
    await queue.add('sequence-step', { sequenceId }, {
      delay: delayDays * 24 * 60 * 60 * 1000,
    });
    console.log(`⏰ Next sequence step scheduled in ${delayDays} days`);
  }
}

async function checkDueSequences() {
  const { data: sequences } = await supabase
    .from('sequences')
    .select('id, current_step, next_step_at')
    .eq('status', 'active')
    .lte('next_step_at', new Date().toISOString());

  if (!sequences?.length) return;
  console.log(`📬 ${sequences.length} sequence steps due`);
  for (const seq of sequences) {
    await processSequenceStep(seq.id).catch(err =>
      console.error(`Sequence ${seq.id} failed:`, err.message)
    );
  }
}

async function start() {
  console.log('🚀 Geodo Daemon — starting');

  const worker = new Worker('research-jobs', async (job) => {
    if (job.name === 'monitor') return processMonitorJob(job);
    if (job.name === 'discovery') return processDiscoveryJob(job);
    if (job.name === 'sequence-step') return processSequenceStep(job.data.sequenceId);
    throw new Error(`Unknown job name: ${job.name}`);
  }, {
    connection: redisConn,
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} (${job.name}) done`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} (${job?.name}):`, err.message));

  scheduleDailyScan();

  // Check sequences every 30 minutes
  setInterval(checkDueSequences, 30 * 60 * 1000);
  checkDueSequences(); // run once on start

  console.log('✅ Daemon running — daily scan at 8am, sequences every 30min');
  process.on('SIGTERM', async () => { await worker.close(); process.exit(0); });
}

start().catch(err => { console.error('Fatal:', err); process.exit(1); });
