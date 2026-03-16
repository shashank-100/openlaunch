'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setSession } from '../../lib/auth';

const BACKEND = 'https://backend-production-d5926.up.railway.app';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, fullName, companyName };

      const res = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setSession({
        userId: data.user.id,
        organizationId: data.organizationId || '00000000-0000-0000-0000-000000000002',
        email: data.user.email,
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <h1 className="text-white text-3xl font-semibold tracking-tight">Intake</h1>
        <div className="mt-3 h-px w-48 mx-auto bg-white/10" />
        <p className="mt-4 text-white/40 text-sm tracking-wide uppercase">
          AI Revenue Researcher
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-white/30 transition"
            />
            <input
              type="text"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-white/30 transition"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-white/30 transition"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-4 py-3.5 text-sm focus:outline-none focus:border-white/30 transition"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-medium rounded-lg px-4 py-3.5 text-sm hover:bg-white/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {error && <p className="text-red-400 text-xs text-center pt-1">{error}</p>}
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
        className="mt-6 text-white/30 text-xs hover:text-white/50 transition"
      >
        {mode === 'login' ? 'No account? Sign up →' : '← Back to sign in'}
      </button>
    </main>
  );
}
