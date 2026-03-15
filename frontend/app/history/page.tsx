'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const DEMO_USER = '00000000-0000-0000-0000-000000000001';

interface BriefSummary {
  id: string;
  companyName: string;
  contactName: string;
  sourcesVisited: number;
  createdAt: string;
}

export default function HistoryPage() {
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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/30 hover:text-white/60 text-sm transition">
          ← New brief
        </button>
        <span className="text-white/20 text-xs uppercase tracking-widest">Intake</span>
        <span className="text-white/20 text-xs">{briefs.length} briefs</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-white mb-8">History</h1>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        )}

        {!loading && briefs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 mb-6">No briefs yet</p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-black text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-white/90 transition"
            >
              Research a company
            </button>
          </div>
        )}

        {!loading && briefs.length > 0 && (
          <div className="space-y-2">
            {briefs.map((brief) => (
              <button
                key={brief.id}
                onClick={() => router.push(`/brief/${brief.id}`)}
                className="w-full text-left group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-xl px-5 py-4 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{brief.companyName}</p>
                    {brief.contactName && brief.contactName !== 'Unknown' && (
                      <p className="text-white/40 text-sm mt-0.5">{brief.contactName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white/30 text-xs">
                      {new Date(brief.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-white/20 text-xs mt-1">{brief.sourcesVisited} sources</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
