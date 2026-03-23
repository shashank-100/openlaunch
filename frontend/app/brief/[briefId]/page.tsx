'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Signal {
  id: string;
  signal_type: string;
  signal_summary: string;
  pain_point: string;
  outreach_angle: string;
  email_subject: string;
  email_body: string;
  tech_stack?: string[];
  product_insight?: string;
  opportunity?: string;
  action?: string;
  reason?: string;
  priority?: string;
  should_contact?: boolean;
  prospect_name?: string;
  prospect_email?: string;
  prospect_title?: string;
  prospect_linkedin?: string;
  relevance_score?: number;
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
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BACKEND}/api/signals/${briefId}`);
        if (res.ok) {
          const { signal: s } = await res.json();
          setSignal(s);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [briefId]);

  function copyEmail() {
    navigator.clipboard.writeText(`Subject: ${signal?.email_subject}\n\n${signal?.email_body}`);
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

  if (!signal) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/30 text-sm font-mono">Signal not found</p>
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
            {signal.signal_type}
          </span>
        </div>

        {/* Company + score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase">{companyName}</p>
            {signal.relevance_score && (
              <span className="text-[10px] text-white/30">{signal.relevance_score}/10 relevance</span>
            )}
          </div>
          <p className="text-white/80 text-base leading-snug mb-3">{signal.signal_summary}</p>
          {signal.tech_stack && signal.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {signal.tech_stack.map(tech => (
                <span key={tech} className="text-[9px] bg-white/5 text-white/40 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-white/10 text-xs mb-8">{'─'.repeat(52)}</div>

        <div className="space-y-7">

          {/* Why it matters */}
          {signal.product_insight && (
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Why This Matters</p>
              <p className="text-white/70 text-sm leading-relaxed">{signal.product_insight}</p>
            </div>
          )}

          {/* The opportunity */}
          {signal.opportunity && (
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">The Opportunity</p>
              <p style={{ color }} className="text-sm leading-relaxed">{signal.opportunity}</p>
            </div>
          )}

          {/* The pain */}
          {signal.pain_point && (
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Their Pain</p>
              <p className="text-white/70 text-sm leading-relaxed italic border-l border-white/10 pl-4">{signal.pain_point}</p>
            </div>
          )}

          {/* Who to contact */}
          {signal.prospect_name && (
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Who To Contact</p>
              <div className="space-y-1">
                <p className="text-white/70 text-sm">{signal.prospect_name} — <span className="text-white/40">{signal.prospect_title}</span></p>
                {signal.prospect_email && (
                  <p className="text-white/40 text-xs">{signal.prospect_email}</p>
                )}
                {signal.prospect_linkedin && (
                  <a href={signal.prospect_linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400/50 text-xs hover:text-blue-400/80 transition">LinkedIn →</a>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          {signal.action && (
            <div>
              <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Next Action</p>
              <p className="text-white/70 text-sm leading-relaxed">{signal.action}</p>
            </div>
          )}

          {/* The Email */}
          <div>
            <p className="text-white/25 text-[10px] tracking-[0.2em] uppercase mb-2">Draft Email</p>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-[10px] mb-3 pb-3 border-b border-white/5">Subject: {signal.email_subject}</p>
              <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">{signal.email_body}</pre>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-10">
          <button
            onClick={copyEmail}
            className="flex-1 py-3 text-xs border border-white/15 text-white/50 rounded-xl hover:border-white/30 hover:text-white/80 transition"
          >
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
          <button
            onClick={() => router.push(`/send/${signal.id}`)}
            className="flex-1 py-3 text-xs bg-white text-black font-medium rounded-xl hover:bg-white/90 transition"
          >
            Send Email
          </button>
        </div>

      </div>
    </main>
  );
}
