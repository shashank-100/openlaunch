/**
 * Research client — uses OpenAI + Tavily directly
 * OpenClaw is used for:
 * - Telegram alerts (signals to you)
 * - Email outreach (emails to prospects)
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

let _supabase: any;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return _supabase;
}

export interface MonitorResult {
  signal_type: 'hiring' | 'funding' | 'leadership' | 'product' | 'competitive' | 'general';
  signal_summary: string;
  pain_point: string;
  outreach_angle: string;
  prospect_name: string;
  prospect_title: string;
  prospect_email: string;
  prospect_linkedin: string;
  email_subject: string;
  email_body: string;
  source_url: string;
  should_contact: boolean;
  priority: 'high' | 'medium' | 'low';
  target_persona: string;
  action: string;
  reason: string;
  confidence: number;
  tech_stack?: string[];
  product_insight?: string;  // NEW: What this signal reveals about their needs
  opportunity?: string;      // NEW: How your product solves this
  relevance_score?: number;  // NEW: 1-10 score for product-market fit
}

export interface DiscoveryCompany {
  company_name: string;
  domain: string;
  description: string;
}

function getSkillPrompt(userPitch?: string) {
  const pitchContext = userPitch
    ? `\nCRITICAL CONTEXT - YOUR PRODUCT:
You represent a company that sells: "${userPitch}"
Every signal you detect MUST be evaluated through the lens of how it creates a need for YOUR product.
The "pain_point" must explain why the signal means they need "${userPitch}".
The "email_body" must pitch "${userPitch}" as the solution to their new pain point.`
    : '';

  return `You are a B2B sales intelligence agent. Given a company name and optional website URL, search the live web for recent buying signals and find a specific person to reach out to.
${pitchContext}

Phase 1: Signal Detection
Search for events in the last 90 days:
- Funding — new rounds, debt financing, announced investment
- Hiring — VP/Director/C-suite roles posted, headcount growth, SDR/AE hiring, or specific roles related to your product.
- Leadership — new CxO/VP hired or departed, reorg announcements
- Product — new product launches, major feature releases, partnerships
- Competitive — switching from a competitor, competitor shutting down

Phase 2: Prospect Research
Based on the signal, identify the most relevant persona to reach out to (e.g. CTO for tech hire, VP Sales for sales growth).
Search for a specific individual at the company matching this persona.
Find their:
- Full Name
- Job Title
- Professional Email Address (if not found, guess based on common patterns like first.last@company.com)
- LinkedIn URL

Rules:
- Only report signals from the last 90 days
- Be specific — use real names, numbers, dates from your search
- Be decisive on should_contact — if there's a real signal and a valid prospect, true
- Priority: "high" = act today, "medium" = act this week, "low" = monitor

Return ONLY this JSON, no other text:
{
  "signal_type": "hiring|funding|leadership|product|competitive|general",
  "signal_summary": "One sentence describing what happened",
  "pain_point": "What this signal reveals they are struggling with internally (mapped to your product if applicable)",
  "product_insight": "What this signal reveals about their technical needs/challenges",
  "opportunity": "How YOUR specific product solves this exact problem",
  "relevance_score": 8,
  "outreach_angle": "One line: how to position a pitch for this exact moment",
  "prospect_name": "Full name of the contact",
  "prospect_title": "Job title of the contact",
  "prospect_email": "Professional email address",
  "prospect_linkedin": "LinkedIn URL",
  "email_subject": "Short subject line referencing the signal",
  "email_body": "Line 1: Reference the signal specifically.\\nLine 2: Connect to their likely pain.\\nLine 3: Your value prop in one sentence.\\nLine 4: Soft CTA — open to a quick call?",
  "source_url": "URL where you found the signal",
  "should_contact": true,
  "priority": "high|medium|low",
  "target_persona": "CTO|VP Sales|CEO|Head of Marketing|etc",
  "action": "One clear action the rep should take right now",
  "reason": "One sentence: why now is the right moment",
  "confidence": 0.85,
  "tech_stack": ["Snowflake", "BigQuery", "React", "etc"]
}`;
}

function getDiscoveryPrompt(userPitch: string) {
  return `You are a B2B growth expert. The user's company sells: "${userPitch}".
Your goal is to find companies that are highly likely to need this product.

First, infer the Ideal Customer Profile (ICP) based on what the user sells.
Then, search the web for real, active companies that fit this ICP.
Focus on companies that have:
- Strong indicators they need this solution (e.g. hiring specific roles, building specific tech)
- Recent news, launches, or growth
- Strong online presence

Return a list of up to 10 companies. For each company, provide its name, domain (website URL), and a brief description of what they do.

Return ONLY this JSON, no other text:
{
  "companies": [
    {
      "company_name": "Example Corp",
      "domain": "example.com",
      "description": "Building a modern data stack for fintech."
    }
  ]
}`;
}

export async function runDiscoveryAgent(userPitch: string): Promise<DiscoveryCompany[]> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Step 1: Search with Tavily
  let searchContext = '';
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      // Create a dynamic query based on the pitch
      const queryPrompt = `Generate 3 Tavily search queries to find companies that need: "${userPitch}". Return ONLY a comma-separated list of the 3 queries, no quotes or bullets.`;
      const queryCompletion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: queryPrompt }]
      });
      const queries = (queryCompletion.choices[0]?.message?.content || '').split(',').map(q => q.trim()).slice(0,3);
      
      const searchPromises = queries.map(q => fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query: q, search_depth: 'basic', max_results: 5 }),
      }).then(r => r.json()).catch(() => ({})));
      
      const results = await Promise.all(searchPromises);
      const allResults = results.flatMap((d: any) => d.results || []);
      searchContext = allResults
        .map((r: any) => `Source: ${r.url}\n${r.content}`)
        .join('\n\n').substring(0, 15000); // limit length
    } catch (err) {
      console.warn('Tavily discovery failed:', err);
    }
  }

  // Step 2: GPT generates structured list
  const userMessage = `User Pitch: ${userPitch}${searchContext ? `\n\nSearch results:\n${searchContext}` : ''}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: getDiscoveryPrompt(userPitch) },
      { role: 'user', content: userMessage },
    ],
  });

  const output = completion.choices[0]?.message?.content || '';
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in discovery output');
  const parsed = JSON.parse(jsonMatch[0]);

  return parsed.companies || [];
}

export async function runMonitorAgent(
  companyName: string,
  domain: string = '',
  userPitch?: string
): Promise<MonitorResult> {
  // Try to use OpenClaw CLI first if possible
  try {
    const args = ['agent', '--agent', 'full-outreach-agent', '--local', '--message', `Research ${companyName} (${domain})`];
    if (userPitch) {
      args.push('--message', `The user sells: ${userPitch}. Map signals to this product.`);
    }
    
    const { stdout } = await execFileAsync('openclaw', args, { timeout: 120000, env: { ...process.env } });

    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        signal_type: parsed.signal_type || 'general',
        signal_summary: parsed.signal_summary || '',
        pain_point: parsed.pain_point || '',
        product_insight: parsed.product_insight || '',
        opportunity: parsed.opportunity || '',
        relevance_score: parsed.relevance_score || 0,
        outreach_angle: parsed.outreach_angle || '',
        prospect_name: parsed.prospect_name || '',
        prospect_title: parsed.prospect_title || '',
        prospect_email: parsed.prospect_email || '',
        prospect_linkedin: parsed.prospect_linkedin || '',
        email_subject: parsed.email_subject || '',
        email_body: parsed.email_body || '',
        source_url: parsed.source_url || '',
        should_contact: parsed.should_contact ?? false,
        priority: parsed.priority || 'medium',
        target_persona: parsed.target_persona || '',
        action: parsed.action || '',
        reason: parsed.reason || '',
        confidence: parsed.confidence || 0,
        tech_stack: parsed.tech_stack || [],
      };
    }
  } catch (err) {
    console.warn('OpenClaw CLI failed, falling back to direct OpenAI research:', (err as any).message);
  }

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Step 1: Search with Tavily
  let searchContext = '';
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${companyName} ${domain} buying signals news 2025 2026 tech stack snowflake bigquery databricks find decision maker email`,
          search_depth: 'advanced',
          max_results: 10,
        }),
      });
      const data = await res.json() as any;
      searchContext = (data.results || [])
        .map((r: any) => `Source: ${r.url}\n${r.content}`)
        .join('\n\n');
    } catch {
      // continue without search context
    }
  }

  // Step 2: GPT generates structured signal
  const userMessage = `Company: ${companyName}${domain ? `\nWebsite: ${domain}` : ''}${searchContext ? `\n\nSearch results:\n${searchContext}` : ''}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07',
    messages: [
      { role: 'system', content: getSkillPrompt(userPitch) },
      { role: 'user', content: userMessage },
    ],
  });

  const output = completion.choices[0]?.message?.content || '';
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in research output');
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    signal_type: parsed.signal_type || 'general',
    signal_summary: parsed.signal_summary || '',
    pain_point: parsed.pain_point || '',
    product_insight: parsed.product_insight || '',
    opportunity: parsed.opportunity || '',
    relevance_score: parsed.relevance_score || 0,
    outreach_angle: parsed.outreach_angle || '',
    prospect_name: parsed.prospect_name || '',
    prospect_title: parsed.prospect_title || '',
    prospect_email: parsed.prospect_email || '',
    prospect_linkedin: parsed.prospect_linkedin || '',
    email_subject: parsed.email_subject || '',
    email_body: parsed.email_body || '',
    source_url: parsed.source_url || '',
    should_contact: parsed.should_contact ?? false,
    priority: parsed.priority || 'medium',
    target_persona: parsed.target_persona || '',
    action: parsed.action || '',
    reason: parsed.reason || '',
    confidence: parsed.confidence || 0,
    tech_stack: parsed.tech_stack || [],
  };
}

// Deliver high-priority alerts via Telegram HTTP API directly
export async function deliverAlert(companyName: string, result: MonitorResult, signalId?: string): Promise<void> {
  if (!result.should_contact || result.priority !== 'high') return;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn('Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-o0tu6m00n-shashank100s-projects.vercel.app';

  let message = `🔥 *${companyName}*\n📡 ${result.signal_summary}\n\n🧠 *Insight:* ${result.product_insight || result.pain_point}\n\n💡 *Opportunity:* ${result.opportunity || result.outreach_angle}\n\n🎯 *Relevance:* ${result.relevance_score || 'N/A'}/10\n👤 *Target:* ${result.target_persona}\n📧 *Prospect:* ${result.prospect_name || 'Not found'} \\(${result.prospect_email || 'No email'}\\)\n\n⚡️ *Action:* ${result.action}\n⏰ *Why now:* ${result.reason}`;

  if (signalId) {
    message += `\n\n[View Brief](${frontendUrl}/brief/${signalId})`;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    });
    const data = await res.json() as any;
    if (data.ok) {
      console.log(`✅ Telegram alert sent for ${companyName}`);
    } else {
      console.warn(`Telegram error: ${data.description}`);
    }
  } catch (err) {
    console.warn('Telegram delivery failed:', (err as any).message);
  }
}

// Deliver outreach email via Resend HTTP API directly
export async function deliverOutreach(result: MonitorResult, signalId: string, accountId: string): Promise<void> {
  if (!result.prospect_email || !result.email_body) return;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  if (!resendKey) {
    console.warn('Resend not configured — set RESEND_API_KEY');
    return;
  }

  console.log(`📧 Sending outreach to ${result.prospect_email}`);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: result.prospect_email,
        subject: result.email_subject,
        text: result.email_body,
      }),
    });
    const data = await res.json() as any;
    if (data.id) {
      console.log(`✅ Outreach email sent: ${data.id}`);
      await getSupabase().from('outreach').insert({
        signal_id: signalId,
        account_id: accountId,
        to_email: result.prospect_email,
        subject: result.email_subject,
        body: result.email_body,
        channel: 'email',
        status: 'sent',
      });
    } else {
      console.warn('Resend error:', data);
    }
  } catch (err) {
    console.warn('Email outreach failed:', (err as any).message);
  }
}
