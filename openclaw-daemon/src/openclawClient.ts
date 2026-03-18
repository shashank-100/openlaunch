/**
 * OpenClaw WebSocket RPC client
 * Protocol:
 *   1. Server sends connect.challenge {nonce}
 *   2. Client sends {type:"req", method:"connect", params:{auth:{token}, minProtocol:3, ...}}
 *   3. Server sends hello-ok
 *   4. Client sends {type:"req", method:"chat.send", params:{...}}
 *   5. Server sends result with runId
 *   6. Agent runs, client polls or waits for completion event
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
    const ws = new WebSocket(OPENCLAW_URL);

    const sessionKey = `monitor-${randomUUID()}`;
    let connected = false;
    let runId: string | null = null;

    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('OpenClaw timed out'));
    }, timeoutMs);

    function req(method: string, params: any) {
      ws.send(JSON.stringify({ type: 'req', id: randomUUID(), method, params }));
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // Step 1: server sends challenge — respond with connect request
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          req('connect', {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: 'gateway-client',
              version: '1.0.0',
              platform: process.platform,
              mode: 'backend',
            },
            auth: { token: OPENCLAW_TOKEN },
            role: 'operator',
            scopes: ['operator.admin'],
            caps: [],
          });
          return;
        }

        // Step 2: connected — server responds with {ok:true, payload:{type:"hello-ok"}}
        if (!connected && msg.type === 'res' && msg.ok === true) {
          connected = true;
          req('chat.send', {
            sessionKey,
            skill: 'account-monitor',
            message: `Company: ${companyName}${domain ? `\nWebsite: ${domain}` : ''}`,
            idempotencyKey: randomUUID(),
          });
          return;
        }

        // Step 3: got runId — agent is running
        if (msg.type === 'res' && msg.result?.runId && !runId) {
          runId = msg.result.runId;
          // Now wait for the agent completion event
          return;
        }

        // Step 4: agent completed — parse JSON output
        if (msg.type === 'event' && msg.event === 'agent.done' && msg.payload?.runId === runId) {
          clearTimeout(timer);
          ws.close();
          const output = msg.payload?.output as string || '';
          const jsonMatch = output.match(/\{[\s\S]*\}/);
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

        // Also handle polling-style completion
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
        // ignore parse errors on intermediate messages
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
