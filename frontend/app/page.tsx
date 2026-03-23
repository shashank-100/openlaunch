'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

const PLACEHOLDER_EXAMPLES = [
  "We sell data integration tools for modern data teams",
  "DevOps monitoring for fast-growing startups",
  "AI interview automation for hiring teams",
  "Revenue intelligence for B2B sales teams",
];

export default function Home() {
  const router = useRouter();
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder every 3 seconds
  useState(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pitch.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pitch: pitch.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start discovery: ${res.status}`);
      }

      // Redirect to results
      router.push('/feed');
    } catch (err: any) {
      console.error('Discovery failed:', err);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 font-mono">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white tracking-tight mb-4 leading-tight">
            Find companies already<br />showing intent to buy your product
          </h1>
          <p className="text-base text-white/40 max-w-lg mx-auto">
            Describe what you sell — GEODO finds high-intent companies, explains why they need you,
            and shows exactly how to reach them.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-white/20 rounded-xl px-6 py-5 text-base focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !pitch.trim()}
            className="w-full mt-3 bg-white text-black font-medium rounded-xl px-6 py-5 text-base hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-25 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Finding companies...
              </span>
            ) : (
              'Find Opportunities →'
            )}
          </button>
        </form>

        {/* Trust Text */}
        <p className="text-center text-sm text-white/20">
          No setup. No manual research. Results in seconds.
        </p>

      </div>

    </main>
  );
}
