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

export default function BriefPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'brief' | 'raw'>('brief');
  const [copied, setCopied] = useState(false);

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

  function copyMarkdown() {
    if (!brief?.fullBriefMarkdown) return;
    navigator.clipboard.writeText(brief.fullBriefMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      </main>
    );
  }

  if (!brief) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">Brief not found</p>
          <button onClick={() => router.push('/')} className="text-white/60 underline text-sm">
            Start over
          </button>
        </div>
      </main>
    );
  }

  const topSignals = signals.slice(0, 4);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white/30 hover:text-white/60 text-sm transition">
            ← New
          </button>
          <button onClick={() => router.push('/history')} className="text-white/30 hover:text-white/60 text-sm transition">
            History
          </button>
        </div>
        <span className="text-white/20 text-xs uppercase tracking-widest">Intake</span>
        <div className="flex items-center gap-4">
          <span className="text-white/20 text-xs">
            {brief.sourcesVisited} sources · {new Date(brief.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={copyMarkdown}
            className="text-white/40 hover:text-white text-xs border border-white/10 hover:border-white/30 rounded px-2.5 py-1 transition"
          >
            {copied ? 'Copied!' : 'Copy all'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">{brief.companyName}</h1>
          {brief.contactName && brief.contactName !== 'Unknown' && (
            <p className="text-white/40 mt-1">Contact: {brief.contactName}</p>
          )}
        </div>

        {topSignals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {topSignals.map((s, i) => (
              <div
                key={i}
                title={s.description}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: s.importanceScore >= 8 ? '#ef4444' : s.importanceScore >= 6 ? '#f59e0b' : '#6b7280',
                  }}
                />
                <span className="text-white/70 text-xs">{s.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-6 mb-8 border-b border-white/8">
          {(['brief', 'raw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm transition-colors ${activeTab === tab ? 'text-white border-b-2 border-white -mb-px' : 'text-white/30 hover:text-white/60'}`}
            >
              {tab === 'raw' ? 'Raw markdown' : 'Brief'}
            </button>
          ))}
        </div>

        {activeTab === 'brief' ? (
          <div className="space-y-10">
            <Section title="Company Snapshot" data={brief.companySnapshot} />
            <Section title="Recent Signals" data={brief.recentSignals} accent />
            <Section title="Contact Intel" data={brief.contactIntel} />
            <Section title="Tech Stack" data={brief.techStack} />
            <Section title="Competitive Context" data={brief.competitiveContext} />
            <OpenerSection data={brief.suggestedOpeners} />
          </div>
        ) : (
          <div className="bg-white/3 border border-white/8 rounded-xl p-6">
            <pre className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap font-mono">
              {brief.fullBriefMarkdown}
            </pre>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-white/8 flex items-center justify-between">
          <span className="text-white/20 text-xs">
            Intake · {brief.sourcesVisited} sources · {new Date(brief.createdAt).toLocaleString()}
          </span>
          <button onClick={() => router.push('/')} className="text-white/40 hover:text-white text-sm transition">
            Research another →
          </button>
        </div>
      </div>
    </main>
  );
}

function Section({ title, data, accent = false }: { title: string; data: BriefSection | null; accent?: boolean }) {
  if (!data?.bullets?.length) {
    return (
      <div>
        <h2 className="text-white/25 text-xs uppercase tracking-widest mb-3">{title}</h2>
        <p className="text-white/20 text-sm italic">Not found</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className={`text-xs uppercase tracking-widest mb-4 ${accent ? 'text-white/60' : 'text-white/30'}`}>{title}</h2>
      <ul className="space-y-3">
        {data.bullets.map((bullet, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className={`mt-2 w-1 h-1 rounded-full flex-shrink-0 ${accent ? 'bg-white/50' : 'bg-white/20'}`} />
            <span className="text-white/80 text-sm leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenerSection({ data }: { data: BriefSection | null }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  if (!data?.bullets?.length) {
    return (
      <div>
        <h2 className="text-white/25 text-xs uppercase tracking-widest mb-3">Suggested Openers</h2>
        <p className="text-white/20 text-sm italic">Not found</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-white/60 text-xs uppercase tracking-widest mb-4">Suggested Openers</h2>
      <div className="space-y-3">
        {data.bullets.map((opener, i) => (
          <div key={i} className="group relative bg-white/4 border border-white/8 rounded-xl px-4 py-4 hover:border-white/15 transition">
            <p className="text-white/80 text-sm leading-relaxed pr-16">{opener}</p>
            <button
              onClick={() => copy(opener, i)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-white/50 hover:text-white text-xs border border-white/15 rounded px-2 py-1 transition"
            >
              {copiedIdx === i ? '✓' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
