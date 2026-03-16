/**
 * OpenClaw WebSocket RPC client
 * Protocol: connect frame → hello-ok → chat.send → agent.wait
 */
import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'ws://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

export interface MonitorResult {
  signal_type: 'hiring' | 'funding' | 'leadership' | 'product' | 'competitive' | 'general';
  signal_summary: string;
  pain_point: string;
  outreach_angle: string;
  email_subject: string;
  email_body: string;
  source_url: string;
}

export async function runMonitorAgent(
  companyName: string,
  domain: string = '',
  timeoutMs = 120000
): Promise<MonitorResult> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(OPENCLAW_URL, {
      headers: { Authorization: `Bearer ${OPENCLAW_TOKEN}` },
    });

    const sessionKey = `monitor-${randomUUID()}`;
    let connected = false;
    let runId: string | null = null;

    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('OpenClaw timed out'));
    }, timeoutMs);

    function send(method: string, params: any) {
      ws.send(JSON.stringify({ method, params, id: randomUUID() }));
    }

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'connect', token: OPENCLAW_TOKEN }));
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if ((msg.type === 'hello-ok' || msg.ok === true) && !connected) {
          connected = true;
          send('chat.send', {
            sessionKey,
            skill: 'account-monitor',
            message: `Company: ${companyName}${domain ? `\nWebsite: ${domain}` : ''}`,
            idempotencyKey: randomUUID(),
          });
          return;
        }

        if (msg.result?.runId && !runId) {
          runId = msg.result.runId;
          send('agent.wait', { runId, timeout: timeoutMs - 10000 });
          return;
        }

        if (msg.result?.status === 'completed' && msg.result?.output) {
          clearTimeout(timer);
          ws.close();
          const jsonMatch = (msg.result.output as string).match(/\{[\s\S]*\}/);
          if (!jsonMatch) return reject(new Error('No JSON in OpenClaw output'));
          const parsed = JSON.parse(jsonMatch[0]);
          return resolve({
            signal_type: parsed.signal_type || 'general',
            signal_summary: parsed.signal_summary || '',
            pain_point: parsed.pain_point || '',
            outreach_angle: parsed.outreach_angle || '',
            email_subject: parsed.email_subject || '',
            email_body: parsed.email_body || '',
            source_url: parsed.source_url || '',
          });
        }

        if (msg.result?.status === 'failed') {
          clearTimeout(timer);
          ws.close();
          return reject(new Error(msg.result.error || 'OpenClaw agent failed'));
        }

        if (msg.error) {
          clearTimeout(timer);
          ws.close();
          return reject(new Error(msg.error.message || 'OpenClaw RPC error'));
        }
      } catch {
        // ignore non-JSON intermediate messages
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
