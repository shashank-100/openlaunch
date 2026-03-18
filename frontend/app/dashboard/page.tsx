'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';
const DEMO_USER = '00000000-0000-0000-0000-000000000001';

interface BriefSummary {
  id: string;
  companyName: string;
  contactName: string;
  sourcesVisited: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<BriefSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/api/briefs?userId=${DEMO_USER}`)
      .then((r) => r.json())
      .then(({ briefs: data }) => {
        setBriefs(
          (data || []).map((b: any) => ({
            id: b.id,
            companyName: b.company_name,
            contactName: b.contact_name,
            sourcesVisited: b.sources_visited,
            createdAt: b.created_at,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const thisWeek = briefs.filter((b) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(b.createdAt) > weekAgo;
  }).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Nav */}
        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.push('/')} className="hover:text-white/50 transition">← new brief</button>
          <span className="tracking-widest uppercase">Intake</span>
          <button onClick={() => router.push('/settings')} className="hover:text-white/50 transition">settings</button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-white/20 text-[10px] tracking-[0.25em] uppercase mb-4">RESEARCH DASHBOARD</p>
          <div className="text-white/10 text-xs mb-5">{'━'.repeat(48)}</div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-white text-2xl font-semibold">{briefs.length}</p>
              <p className="text-white/30 text-xs mt-1">total briefs</p>
            </div>
            <div>
              <p className="text-white text-2xl font-semibold">{thisWeek}</p>
              <p className="text-white/30 text-xs mt-1">this week</p>
            </div>
            <div>
              <p className="text-white text-2xl font-semibold">
                {briefs.length > 0
                  ? Math.round(briefs.reduce((s, b) => s + (b.sourcesVisited || 0), 0) / briefs.length)
                  : 0}
              </p>
              <p className="text-white/30 text-xs mt-1">avg sources</p>
            </div>
          </div>

          <div className="text-white/10 text-xs">{'━'.repeat(48)}</div>
        </div>

        {/* Brief list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="font-mono text-white/20 text-sm tracking-widest animate-pulse">LOADING</span>
          </div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm mb-6">No briefs yet</p>
            <button
              onClick={() => router.push('/')}
              className="text-white/50 text-xs border border-white/15 hover:border-white/35 hover:text-white/70 rounded px-4 py-2 transition"
            >
              research first company →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {briefs.map((brief) => (
              <button
                key={brief.id}
                onClick={() => router.push(`/brief/${brief.id}`)}
                className="w-full text-left flex items-center justify-between px-0 py-3 border-b border-white/5 hover:border-white/15 group transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-white/15 text-xs w-3 flex-shrink-0">·</span>
                  <div>
                    <span className="text-white/80 text-sm group-hover:text-white transition">{brief.companyName}</span>
                    {brief.contactName && brief.contactName !== 'Unknown' && (
                      <span className="text-white/30 text-xs ml-3">{brief.contactName}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/20 text-xs flex-shrink-0">
                  <span>{brief.sourcesVisited} src</span>
                  <span>{timeAgo(brief.createdAt)}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
