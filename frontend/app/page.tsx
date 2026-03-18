'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function Home() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Add to accounts if not already there
      const res = await fetch(`${BACKEND}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: company.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to add account: ${res.status}`);
      }

      const { account } = await res.json();

      // Trigger immediate scan
      const scanRes = await fetch(`${BACKEND}/api/accounts/${account.id}/scan`, { method: 'POST' });

      if (!scanRes.ok) {
        throw new Error(`Failed to start scan: ${scanRes.status}`);
      }

      // Go to feed to see result
      router.push('/feed');
    } catch (err: any) {
      console.error('Research failed:', err);
      setError(err.message || 'Failed to start research. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 font-mono">

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-12">
          <p className="text-white/15 text-[10px] tracking-[0.4em] uppercase mb-4">INTAKE</p>
          <h1 className="text-white text-3xl font-light tracking-tight leading-tight">
            Know when to reach out.<br />
            <span className="text-white/40">Before anyone else does.</span>
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter a company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition"
            />
          </div>
          {error && (
            <div className="text-red-400 text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !company.trim()}
            className="w-full bg-white text-black font-medium rounded-xl px-5 py-4 text-sm hover:bg-white/90 active:scale-[0.99] transition disabled:opacity-25 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-black/30 border-t-black rounded-full animate-spin" />
                Queuing research...
              </span>
            ) : 'Research this company →'}
          </button>
        </form>

        {/* Examples */}
        <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
          <span className="text-white/20 text-[10px]">Try:</span>
          {['Stripe', 'Notion', 'Vercel', 'Linear'].map(name => (
            <button
              key={name}
              onClick={() => setCompany(name)}
              className="text-white/25 text-[10px] hover:text-white/50 transition underline underline-offset-2"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-10 mb-6 border-t border-white/5" />

        {/* Nav */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => router.push('/feed')}
            className="text-white/25 text-xs hover:text-white/60 transition"
          >
            Signal Feed
          </button>
          <span className="text-white/10 text-xs">·</span>
          <button
            onClick={() => router.push('/accounts')}
            className="text-white/25 text-xs hover:text-white/60 transition"
          >
            Accounts
          </button>
        </div>

      </div>
    </main>
  );
}
