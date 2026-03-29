import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

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
  let pendingSignals: any[] = [];
  try {
    const signalsRes = await fetch(`${BACKEND}/api/signal-outreach?status=pending&limit=10`);
    const signals = await signalsRes.json();
    pendingSignals = signals.signals || [];

    const pendingList = pendingSignals
      .map((s: any, i: number) => `${i + 1}. ${s.company_name} (ID: ${s.id.substring(0, 8)}..., ${s.signal_type}, ${s.relevance_score}/10): ${s.signal_summary}`)
      .join('\n');

    context = `
PENDING SIGNALS (awaiting approval):
${pendingList || 'None'}
`;
  } catch {}

  const result = await streamText({
    model: openai('gpt-5-mini'),
    system: `You are an AI sales assistant for INTAKE — an autonomous outbound sales system.

You help the user take ACTION:
- Approve and send emails
- Reject/skip signals
- Trigger manual scans
- Review and improve email drafts
- Analyze reply intent and suggest strategy
- Answer questions about their pipeline

${context}

When the user asks you to DO something (approve, send, skip, scan), tell them the action has been queued and provide instructions on how to execute it in the dashboard.

Keep responses concise and actionable. You're a sales expert — be direct, specific, and helpful.`,
    messages,
    tools: {
      list_pending_signals: {
        description: 'Get detailed list of all pending signals with full IDs for approval/rejection',
        inputSchema: z.object({}) as any,
        execute: async () => {
          const signalsList = pendingSignals.map((s: any, i: number) =>
            `${i + 1}. **${s.company_name}**\n   ID: \`${s.id}\`\n   Type: ${s.signal_type} | Score: ${s.relevance_score}/10\n   ${s.signal_summary}\n   To: ${s.recipient_email || '❌ No email set'}\n   Subject: ${s.email_subject}`
          ).join('\n\n');
          return signalsList || 'No pending signals found';
        },
      },
      approve_email: {
        description: 'Approve and immediately send an outreach email. Only use when user explicitly confirms "yes send it" or "approve".',
        inputSchema: z.object({
          signalId: z.string().describe('The exact UUID of the signal from list_pending_signals'),
          companyName: z.string().describe('Company name for confirmation message'),
        }) as any,
        execute: async ({ signalId, companyName }: any) => {
          try {
            const res = await fetch(`${BACKEND}/api/signal-outreach/${signalId}/approve`, {
              method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
              return `✅ **Email sent to ${companyName}!** The outreach is now in your Sent folder. Follow-ups are scheduled for Day 3, 7, and 14.`;
            }
            return `❌ Failed: ${data.detail || 'Unknown error'}`;
          } catch (e) {
            return `❌ Error sending email: ${String(e)}`;
          }
        },
      },
      reject_signal: {
        description: 'Skip/reject a signal. Use when user says "skip", "reject", "no", or "pass".',
        inputSchema: z.object({
          signalId: z.string().describe('The exact UUID of the signal'),
          companyName: z.string().describe('Company name for confirmation'),
        }) as any,
        execute: async ({ signalId, companyName }: any) => {
          try {
            await fetch(`${BACKEND}/api/signal-outreach/${signalId}/reject`, {
              method: 'POST',
            });
            return `⏭️ **Skipped ${companyName}** — removed from inbox`;
          } catch (e) {
            return `❌ Error: ${String(e)}`;
          }
        },
      },
      trigger_discovery_scan: {
        description: 'Start a manual signal discovery scan to find new companies. Takes 2-5 minutes.',
        inputSchema: z.object({}) as any,
        execute: async () => {
          try {
            const res = await fetch(`${BACKEND}/api/run/scan`, {
              method: 'POST',
            });
            const data = await res.json();

            if (data.error) {
              return `❌ ${data.error}`;
            }

            return `🔍 **Scan complete!**\n\n📊 Researched: ${data.scanned || 0} companies\n📧 Found: ${data.signals_found || 0} new signals\n${data.emails_sent ? `✉️ Auto-sent: ${data.emails_sent} emails` : ''}\n\n✅ Check your Inbox to review new signals.`;
          } catch (e) {
            return `❌ Scan failed: ${String(e)}`;
          }
        },
      },
    } as any,
  });

  return result.toTextStreamResponse();
}
