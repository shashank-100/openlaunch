'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface BriefSection {
  text: string;
  bullets: string[];
}

interface Brief {
  id: string;
  companyName: string;
  contactName: string;
  sourcesVisited: number;
  createdAt: string;
  companySnapshot: BriefSection | null;
  recentSignals: BriefSection | null;
  contactIntel: BriefSection | null;
  techStack: BriefSection | null;
  competitiveContext: BriefSection | null;
  suggestedOpeners: BriefSection | null;
  fullBriefMarkdown: string;
}

interface Signal {
  type: string;
  title: string;
  description: string;
  importanceScore: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SIGNAL_COLORS: Record<string, string> = {
  hiring: '#f59e0b',
  funding: '#22c55e',
  product: '#60a5fa',
  leadership: '#a78bfa',
  competitive: '#f87171',
  partnership: '#34d399',
  expansion: '#fb923c',
  general: '#9ca3af',
};

export default function BriefPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BACKEND}/api/briefs/${briefId}`);
        if (!res.ok) throw new Error('Brief not found');
        const { brief: data } = await res.json();
        setBrief({
          id: data.id,
          companyName: data.company_name,
          contactName: data.contact_name,
          sourcesVisited: data.sources_visited,
          createdAt: data.created_at,
          companySnapshot: data.company_snapshot,
          recentSignals: data.recent_signals,
          contactIntel: data.contact_intel,
          techStack: data.tech_stack,
          competitiveContext: data.competitive_context,
          suggestedOpeners: data.suggested_openers,
          fullBriefMarkdown: data.full_brief_markdown,
        });
        setSignals(data.signals || []);
      } catch {
        // Brief not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [briefId]);

  function copyAll() {
    if (!brief?.fullBriefMarkdown) return;
    navigator.clipboard.writeText(brief.fullBriefMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyOpener(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="font-mono text-white/20 text-sm tracking-widest animate-pulse">LOADING</span>
      </main>
    );
  }

  if (!brief) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-white/30 text-sm mb-4">Brief not found</p>
          <button onClick={() => router.push('/')} className="text-white/50 underline text-xs">
            ← Back
          </button>
        </div>
      </main>
    );
  }

  const topSignals = signals.slice(0, 6);
  const openers = brief.suggestedOpeners?.bullets || [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.push('/')} className="hover:text-white/50 transition">← new</button>
          <div className="flex items-center gap-5">
            <button onClick={() => router.push('/history')} className="hover:text-white/50 transition">history</button>
            <button onClick={() => setShowRaw(!showRaw)} className="hover:text-white/50 transition">
              {showRaw ? 'formatted' : 'raw'}
            </button>
          </div>
        </div>

        {showRaw ? (
          <pre className="text-white/40 text-xs leading-relaxed whitespace-pre-wrap">
            {brief.fullBriefMarkdown || 'No markdown available'}
          </pre>
        ) : (
          <>
            {/* Brief header */}
            <div className="mb-8">
              <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4">INTAKE INTELLIGENCE BRIEF</p>
              <div className="text-white/10 text-xs mb-5">{'━'.repeat(48)}</div>
              <div className="space-y-1">
                <div className="flex gap-4">
                  <span className="text-white/25 text-xs w-16 flex-shrink-0">COMPANY</span>
                  <span className="text-white text-sm">{brief.companyName}</span>
                </div>
                {brief.contactName && brief.contactName !== 'Unknown' && (
                  <div className="flex gap-4">
                    <span className="text-white/25 text-xs w-16 flex-shrink-0">CONTACT</span>
                    <span className="text-white/70 text-sm">{brief.contactName}</span>
                  </div>
                )}
                <div className="flex gap-4">
                  <span className="text-white/25 text-xs w-16 flex-shrink-0">GENERATED</span>
                  <span className="text-white/40 text-xs mt-0.5">{timeAgo(brief.createdAt)} · {brief.sourcesVisited} live sources</span>
                </div>
              </div>
            </div>

            {/* Signals */}
            {topSignals.length > 0 && (
              <section className="mb-8">
                <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4">RECENT SIGNALS</p>
                <div className="space-y-2.5">
                  {topSignals.map((s, i) => {
                    const color = SIGNAL_COLORS[s.type] || SIGNAL_COLORS.general;
                    const tag = s.type || 'signal';
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-white/15 text-xs mt-0.5 flex-shrink-0 w-3">·</span>
                        <span className="text-white/75 text-sm leading-snug flex-1">{s.title}</span>
                        <span
                          className="text-[10px] flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded tracking-wide"
                          style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}28` }}
                        >
                          {tag}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="text-white/8 text-xs mb-8">{'━'.repeat(48)}</div>

            {/* Company Snapshot */}
            <BulletSection label="COMPANY SNAPSHOT" data={brief.companySnapshot} />

            {/* Tech Stack — inline pill style */}
            {brief.techStack?.bullets?.length ? (
              <section className="mb-8">
                <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-3">TECH STACK</p>
                <p className="text-white/55 text-sm leading-relaxed tracking-wide">
                  {brief.techStack.bullets.map((b, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-white/20 mx-2">·</span>}
                      {b.replace(/^(uses?|built on|powered by|running)\s*/i, '')}
                    </span>
                  ))}
                </p>
              </section>
            ) : null}

            {/* Competitive Context */}
            <BulletSection label="COMPETITIVE CONTEXT" data={brief.competitiveContext} />

            {/* Contact Intel */}
            <BulletSection label="CONTACT INTEL" data={brief.contactIntel} />

            <div className="text-white/8 text-xs mb-8">{'━'.repeat(48)}</div>

            {/* Suggested Openers */}
            {openers.length > 0 && (
              <section className="mb-8">
                <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4">SUGGESTED OPENERS</p>
                <div className="space-y-4">
                  {openers.map((opener, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-3 cursor-pointer"
                      onClick={() => copyOpener(opener, i)}
                    >
                      <span className="text-white/20 text-xs mt-0.5 flex-shrink-0">{i + 1}</span>
                      <p className="text-white/70 text-sm leading-relaxed flex-1">
                        &ldquo;{opener}&rdquo;
                      </p>
                      <span className="text-white/20 text-[10px] mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition w-8 text-right">
                        {copiedIdx === i ? '✓' : 'copy'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="text-white/8 text-xs mb-8">{'━'.repeat(48)}</div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <button
                onClick={copyAll}
                className="text-white/20 text-xs hover:text-white/50 transition"
              >
                {copied ? '✓ copied' : 'copy brief'}
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-white/20 text-xs hover:text-white/50 transition"
                >
                  research another
                </button>
                <button
                  onClick={() => router.push(`/buyer/${briefId}`)}
                  className="text-white/40 text-xs border border-white/15 hover:border-white/35 hover:text-white/70 rounded px-3 py-1.5 transition"
                >
                  buyer one-pager →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function BulletSection({ label, data }: { label: string; data: BriefSection | null }) {
  if (!data?.bullets?.length) return null;
  return (
    <section className="mb-8">
      <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-3">{label}</p>
      <div className="space-y-2">
        {data.bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-white/15 text-xs mt-0.5 flex-shrink-0 w-3">·</span>
            <p className="text-white/65 text-sm leading-relaxed">{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
