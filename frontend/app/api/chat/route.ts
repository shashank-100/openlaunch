import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export async function POST(req: Request) {
  const { messages: rawMessages } = await req.json();

  // AI SDK v6 sends messages with `parts` array — streamText needs `content` string
  const messages = (rawMessages || []).map((m: any) => ({
    role: m.role,
    content: Array.isArray(m.parts)
      ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
      : (m.content || ''),
  }));

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Fetch live context from backend
  let context = '';
  try {
    const [signalsRes, analyticsRes] = await Promise.all([
      fetch(`${BACKEND}/api/signal-outreach?status=pending&limit=5`),
      fetch(`${BACKEND}/api/analytics`),
    ]);
    const [signals, analytics] = await Promise.all([signalsRes.json(), analyticsRes.json()]);

    const pendingList = (signals.signals || [])
      .map((s: any) => `- ${s.company_name} (${s.signal_type}, ${s.relevance_score}/10): ${s.signal_summary}`)
      .join('\n');

    const o = analytics.overview || {};
    context = `
LIVE SYSTEM STATE:
- Signals found total: ${o.signals_total}
- Emails sent: ${o.emails_sent_total}
- Reply rate: ${o.reply_rate}%
- Meetings booked: ${o.meetings_booked}
- Interested replies: ${o.interested_replies}

PENDING SIGNALS (awaiting approval):
${pendingList || 'None'}
`;
  } catch {}

  const result = streamText({
    model: openai('gpt-5-mini'),
    system: `You are an AI sales assistant for Geodo — an autonomous outbound sales system.

You help the user:
- Understand signals found by the scanner
- Review and improve email drafts
- Analyze reply intent
- Suggest outreach strategy
- Answer questions about their pipeline

${context}

Keep responses concise and actionable. You're a sales expert — be direct, specific, and helpful.
When referring to companies or signals, use the live data above.`,
    messages,
  });

  return result.toTextStreamResponse();
}
