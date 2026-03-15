'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/webhook/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.trim(),
          contactName: contact.trim() || 'Unknown',
          userId: '00000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000002',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to start research');
      }

      const { jobId } = await res.json();
      router.push(`/research/${jobId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-white text-3xl font-semibold tracking-tight">Intake</h1>
        <div className="mt-3 h-px w-48 mx-auto bg-white/10" />
        <p className="mt-4 text-white/40 text-sm tracking-wide uppercase">
          Real-time company intelligence
          <br />
          powered by autonomous agents
        </p>
      </div>

      {/* Input card */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
        <input
          type="text"
          placeholder="Company name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          autoFocus
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-base focus:outline-none focus:border-white/30 focus:bg-white/8 transition"
        />
        <input
          type="text"
          placeholder="Contact name (optional)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-base focus:outline-none focus:border-white/30 focus:bg-white/8 transition"
        />

        <button
          type="submit"
          disabled={loading || !company.trim()}
          className="w-full bg-white text-black font-medium rounded-lg px-4 py-3.5 text-base hover:bg-white/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Starting...' : 'Generate Brief'}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center pt-1">{error}</p>
        )}
      </form>

      <p className="mt-8 text-white/20 text-xs">
        No login. No setup. Just results.
      </p>
    </main>
  );
}
