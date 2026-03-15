'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function BuyerAssetPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [asset, setAsset] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load brief to get company name
    fetch(`${BACKEND}/api/briefs/${briefId}`)
      .then((r) => r.json())
      .then(({ brief }) => setCompanyName(brief?.company_name || ''));
  }, [briefId]);

  async function generate() {
    setGenerating(true);
    setAsset('');
    try {
      const res = await fetch(`${BACKEND}/api/briefs/${briefId}/buyer-asset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNotes: notes }),
      });
      const data = await res.json();
      setAsset(data.markdown || 'Generation failed.');
    } catch {
      setAsset('Failed to generate. Check backend connection.');
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(asset);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push(`/brief/${briefId}`)} className="text-white/30 hover:text-white/60 text-sm transition">
          ← Back to brief
        </button>
        <span className="text-white/20 text-xs uppercase tracking-widest">Intake</span>
        <span className="text-white/20 text-xs">Buyer asset</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Buyer One-Pager</h1>
          {companyName && <p className="text-white/40 mt-1">For {companyName}</p>}
          <p className="text-white/30 text-sm mt-2">
            A personalized document for their internal buy-in — not your pitch deck.
          </p>
        </div>

        {!asset && (
          <div className="space-y-4">
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">
                Meeting notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did they say? What problems came up? What matters to them?"
                rows={5}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 resize-none transition"
              />
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="w-full bg-white text-black font-medium rounded-xl py-3.5 text-sm hover:bg-white/90 transition disabled:opacity-40"
            >
              {generating ? 'Generating buyer asset...' : 'Generate buyer one-pager'}
            </button>
          </div>
        )}

        {asset && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/40 text-xs uppercase tracking-wider">Buyer one-pager</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setAsset('')}
                  className="text-white/30 hover:text-white/60 text-xs transition"
                >
                  Regenerate
                </button>
                <button
                  onClick={copy}
                  className="text-white/50 hover:text-white text-xs border border-white/15 hover:border-white/30 rounded px-3 py-1.5 transition"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-6">
              <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {asset}
              </pre>
            </div>
            <p className="text-white/20 text-xs mt-4 text-center">
              Send this to {companyName || 'the buyer'} — it's written for their team, not yours.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
