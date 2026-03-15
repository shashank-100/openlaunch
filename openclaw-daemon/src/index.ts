import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { chromium, Browser, BrowserContext } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { ResearchAgent } from './agents/ResearchAgent';

dotenv.config();

let browser: Browser | null = null;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Initialize persistent browser instance
 * Keeps a warm browser ready for instant job processing
 */
async function initializeBrowser() {
  console.log('🌐 Initializing persistent browser...');

  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  console.log('✅ Browser ready');
  return browser;
}

/**
 * Create isolated browser context for each research job
 * Prevents cookie/session bleed between targets
 */
async function createIsolatedContext(): Promise<BrowserContext> {
  if (!browser) {
    await initializeBrowser();
  }

  return await browser!.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });
}

/**
 * Process research job
 */
async function processResearchJob(job: any) {
  const { companyName, contactName, userId, organizationId, meetingTime } = job.data;

  console.log(`\n🔍 Starting research for: ${companyName} - ${contactName}`);
  console.log(`📅 Meeting time: ${meetingTime || 'Not specified'}`);

  let context: BrowserContext | null = null;
  let jobId: string | null = null;

  try {
    // Create database entry for this job
    const { data: jobRecord, error: jobError } = await supabase
      .from('research_jobs')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        company_name: companyName,
        contact_name: contactName,
        meeting_time: meetingTime,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;
    jobId = jobRecord.id;

    // Update job progress
    await job.updateProgress(10);

    // Create isolated browser context
    context = await createIsolatedContext();

    // Initialize research agent
    const agent = new ResearchAgent(context, supabase, jobId!);

    // Run research
    const results = await agent.research(companyName, contactName, (progress) => {
      job.updateProgress(progress);
    });

    await job.updateProgress(90);

    // Generate brief using results
    const brief = await agent.generateBrief(results);

    await job.updateProgress(95);

    // Save brief to database
    const { data: briefRecord, error: briefError } = await supabase
      .from('briefs')
      .insert({
        job_id: jobId,
        user_id: userId,
        organization_id: organizationId,
        company_name: companyName,
        contact_name: contactName,
        company_snapshot: brief.companySnapshot,
        recent_signals: brief.recentSignals,
        contact_intel: brief.contactIntel,
        tech_stack: brief.techStack,
        competitive_context: brief.competitiveContext,
        suggested_openers: brief.suggestedOpeners,
        full_brief_html: brief.fullBriefHtml,
        full_brief_markdown: brief.fullBriefMarkdown,
        sources_visited: results.sourcesVisited,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (briefError) throw briefError;

    // Save detected signals to signals table
    if (results.signals.length > 0) {
      await supabase.from('signals').insert(
        results.signals.map((s: any) => ({
          brief_id: briefRecord.id,
          job_id: jobId,
          user_id: userId,
          signal_type: s.type,
          title: s.title,
          description: s.description,
          importance_score: s.importanceScore,
          source_url: s.sourceUrl || null,
          metadata: s.metadata || null,
        }))
      );
    }

    // Update job status
    await supabase
      .from('research_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await job.updateProgress(100);

    console.log(`✅ Research completed for ${companyName}`);
    console.log(`📊 Brief ID: ${briefRecord.id}`);

    return {
      success: true,
      briefId: briefRecord.id,
      jobId,
    };

  } catch (error: any) {
    console.error(`❌ Research failed for ${companyName}:`, error.message);

    // Update job with error
    if (jobId) {
      await supabase
        .from('research_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    throw error;

  } finally {
    // Clean up browser context
    if (context) {
      await context.close();
    }
  }
}

/**
 * Initialize worker
 */
async function startWorker() {
  console.log('🚀 Starting OpenClaw Daemon...');

  // Initialize browser
  await initializeBrowser();

  // Create worker
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

  const worker = new Worker(
    'research-jobs',
    async (job) => {
      return await processResearchJob(job);
    },
    {
      connection: parseRedisConnection(process.env.REDIS_URL),
      concurrency: 3, // Process up to 3 jobs concurrently
      limiter: {
        max: 10,
        duration: 60000, // Max 10 jobs per minute
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('✅ OpenClaw Daemon is running');
  console.log('📡 Waiting for research jobs...');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await worker.close();
    if (browser) {
      await browser.close();
    }
    process.exit(0);
  });
}

// Start the daemon
startWorker().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
