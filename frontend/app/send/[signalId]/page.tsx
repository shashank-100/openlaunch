'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function SendEmailPage() {
  const { signalId } = useParams<{ signalId: string }>();
  const router = useRouter();
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/signals/${signalId}`)
      .then(r => r.json())
      .then(({ signal }) => {
        if (signal) {
          setSubject(signal.email_subject || '');
          setBody(signal.email_body || '');
          if (signal.prospect_email) {
            setToEmail(signal.prospect_email);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [signalId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!toEmail || !subject || !body) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND}/api/outreach/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId, to: toEmail, subject, body }),
      });
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-white/70 text-sm mb-2">Email sent.</p>
          <button onClick={() => router.push('/feed')} className="text-white/25 text-xs hover:text-white/50 transition">← back to feed</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.back()} className="hover:text-white/50 transition">← back</button>
          <span className="tracking-widest uppercase">Send Email</span>
          <span />
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/20 animate-pulse text-sm">loading...</div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div>
              <label className="text-white/30 text-[10px] tracking-wider uppercase block mb-1.5">To</label>
              <input
                type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="contact@company.com"
                required
                autoFocus
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition"
              />
            </div>
            <div>
              <label className="text-white/30 text-[10px] tracking-wider uppercase block mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition"
              />
            </div>
            <div>
              <label className="text-white/30 text-[10px] tracking-wider uppercase block mb-1.5">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                required
                rows={8}
                className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !toEmail}
              className="w-full py-3 bg-white text-black font-medium rounded-xl text-sm hover:bg-white/90 transition disabled:opacity-40"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
