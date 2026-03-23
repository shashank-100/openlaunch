'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Signal {
  id: string;
  signal_type: string;
  signal_summary: string;
  pain_point: string;
  product_insight?: string;
  opportunity?: string;
  relevance_score?: number;
  outreach_angle: string;
  prospect_name: string | null;
  prospect_email: string | null;
  email_subject: string;
  email_body: string;
  source_url: string | null;
  is_new: boolean;
  detected_at: string;
  priority?: 'high' | 'medium' | 'low';
  action?: string;
  reason?: string;
  tech_stack?: string[];
  accounts: { id: string; company_name: string } | null;
}

const TYPE_COLOR: Record<string, string> = {
  funding: '#22c55e',
  hiring: '#f59e0b',
  leadership: '#a78bfa',
  product: '#60a5fa',
  competitive: '#f87171',
  general: '#6b7280',
};

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function FeedPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`${BACKEND}/api/signals`)
      .then(r => r.json())
      .then(d => setSignals(d.signals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? signals
    : signals.filter(s => s.signal_type === filter);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.push('/')} className="hover:text-white/50 transition">← home</button>
          <span className="tracking-widest uppercase">GEODO</span>
          <span className="text-white/10">signal feed</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {['all', 'funding', 'hiring', 'leadership', 'product', 'competitive'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-[10px] tracking-wider uppercase px-2.5 py-1 rounded border transition ${
                filter === t
                  ? 'border-white/30 text-white/70'
                  : 'border-white/10 text-white/25 hover:border-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-20 text-white/20 text-sm animate-pulse">loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/25 text-sm mb-3">No signals yet</p>
            <button
              onClick={() => router.push('/')}
              className="text-white/40 text-xs border border-white/15 hover:border-white/30 rounded px-4 py-2 transition"
            >
              find companies →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(signal => {
              const color = TYPE_COLOR[signal.signal_type] || TYPE_COLOR.general;
              return (
                <div
                  key={signal.id}
                  className="bg-white/[0.03] border border-white/8 rounded-xl p-4 hover:border-white/15 transition"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {signal.is_new && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                      )}
                      <span className="text-white/60 text-sm font-medium">
                        {signal.accounts?.company_name}
                      </span>
                      {signal.relevance_score && signal.relevance_score >= 8 && (
                        <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">
                          {signal.relevance_score}/10
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}>
                        {signal.signal_type}
                      </span>
                      <span className="text-white/20 text-[10px]">{timeAgo(signal.detected_at)}</span>
                    </div>
                  </div>

                  {/* Signal summary */}
                  <p className="text-white/85 text-sm mb-3">{signal.signal_summary}</p>

                  {/* Tech Stack */}
                  {signal.tech_stack && signal.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {signal.tech_stack.slice(0, 5).map(tech => (
                        <span key={tech} className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Intelligence Sections */}
                  {signal.product_insight && (
                    <div className="mb-2 px-3 py-2 bg-blue-500/5 border-l-2 border-blue-500/30 rounded-r-lg">
                      <p className="text-blue-300/60 text-[9px] tracking-widest uppercase mb-1">Why this matters</p>
                      <p className="text-blue-200/80 text-[11px] leading-relaxed">{signal.product_insight}</p>
                    </div>
                  )}

                  {signal.opportunity && (
                    <div className="mb-2 px-3 py-2 bg-purple-500/5 border-l-2 border-purple-500/30 rounded-r-lg">
                      <p className="text-purple-300/60 text-[9px] tracking-widest uppercase mb-1">Opportunity</p>
                      <p className="text-purple-200/80 text-[11px] leading-relaxed">{signal.opportunity}</p>
                    </div>
                  )}

                  {/* Prospect Info */}
                  {signal.prospect_name && (
                    <div className="mb-2 px-3 py-2 bg-green-500/5 border-l-2 border-green-500/30 rounded-r-lg">
                      <p className="text-green-300/60 text-[9px] tracking-widest uppercase mb-1">Contact</p>
                      <p className="text-green-200/80 text-[11px]">
                        <strong>{signal.prospect_name}</strong>
                        {signal.prospect_email && <span className="text-green-200/50"> ({signal.prospect_email})</span>}
                      </p>
                      {signal.action && <p className="text-green-200/70 text-[11px] mt-1">{signal.action}</p>}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => router.push(`/brief/${signal.id}`)}
                      className="flex-1 text-xs py-2 rounded-lg border border-white/15 text-white/60 hover:border-white/30 hover:text-white/90 transition"
                    >
                      View Brief
                    </button>
                    <button
                      onClick={() => router.push(`/send/${signal.id}`)}
                      className="flex-1 text-xs py-2 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition"
                    >
                      Act on this →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
