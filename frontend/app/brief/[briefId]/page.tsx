'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Brief {
  id: string;
  signal_id: string;
  account_id: string;
  what_they_do: string;
  the_signal: string;
  the_pain: string;
  your_angle: string;
  the_email: string;
  created_at: string;
}

interface Signal {
  id: string;
  signal_type: string;
  signal_summary: string;
  email_subject: string;
  email_body: string;
  accounts: { company_name: string } | null;
}

const TYPE_COLOR: Record<string, string> = {
  funding: '#22c55e',
  hiring: '#f59e0b',
  leadership: '#a78bfa',
  product: '#60a5fa',
  competitive: '#f87171',
  general: '#6b7280',
};

export default function BriefPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // briefId could be a brief ID or signal ID — backend handles both
        const [briefRes, signalRes] = await Promise.all([
          fetch(`${BACKEND}/api/briefs/${briefId}`),
          fetch(`${BACKEND}/api/signals/${briefId}`),
        ]);
        if (briefRes.ok) {
          const { brief: b } = await briefRes.json();
          setBrief(b);
        }
        if (signalRes.ok) {
          const { signal: s } = await signalRes.json();
          setSignal(s);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [briefId]);

  function copyEmail() {
    const emailText = brief?.the_email || `${signal?.email_subject}\n\n${signal?.email_body}`;
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const companyName = signal?.accounts?.company_name || 'Company';
  const color = TYPE_COLOR[signal?.signal_type || 'general'] || TYPE_COLOR.general;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="text-white/20 text-sm font-mono animate-pulse tracking-widest">LOADING</span>
      </main>
    );
  }

  if (!brief && !signal) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/30 text-sm font-mono">Brief not found</p>
          <button onClick={() => router.push('/feed')} className="text-white/20 text-xs mt-4 hover:text-white/40 transition">← back to feed</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-xl mx-auto px-6 py-12">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.push('/feed')} className="hover:text-white/50 transition">← feed</button>
          <span className="tracking-widest uppercase">INTAKE</span>
          <span
            className="text-[10px] px-2 py-0.5 rounded"
            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
          >
            {signal?.signal_type}
          </span>
        </div>

        {/* Company header */}
        <div className="mb-8">
          <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-1">{companyName}</p>
          <p className="text-white/80 text-base leading-snug">{signal?.signal_summary}</p>
        </div>

        <div className="text-white/10 text-xs mb-8">{'─'.repeat(52)}</div>

        {brief ? (
          <div className="space-y-7">

            {/* Section 1 */}
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">What They Do</p>
              <p className="text-white/70 text-sm leading-relaxed">{brief.what_they_do}</p>
            </div>

            {/* Section 2 */}
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">The Signal</p>
              <p className="text-white/70 text-sm leading-relaxed">{brief.the_signal}</p>
            </div>

            {/* Section 3 */}
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">The Pain</p>
              <p className="text-white/70 text-sm leading-relaxed">{brief.the_pain}</p>
            </div>

            {/* Section 4 */}
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Your Angle</p>
              <p style={{ color }} className="text-sm leading-relaxed font-medium">{brief.your_angle}</p>
            </div>

            {/* Section 5 — The Email */}
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">The Email</p>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">{brief.the_email}</pre>
              </div>
            </div>

          </div>
        ) : (
          // Signal has no brief yet — show email draft from signal
          <div className="space-y-7">
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">The Email</p>
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-white/50 text-[10px] mb-2">Subject: {signal?.email_subject}</p>
                <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">{signal?.email_body}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-10">
          <button
            onClick={copyEmail}
            className="flex-1 py-3 text-xs border border-white/15 text-white/50 rounded-xl hover:border-white/30 hover:text-white/80 transition"
          >
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
          <button
            onClick={() => router.push(`/send/${signal?.id || briefId}`)}
            className="flex-1 py-3 text-xs bg-white text-black font-medium rounded-xl hover:bg-white/90 transition"
          >
            Send Email
          </button>
        </div>

      </div>
    </main>
  );
}
