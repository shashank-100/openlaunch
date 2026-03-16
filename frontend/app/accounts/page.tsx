'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Account {
  id: string;
  company_name: string;
  domain: string | null;
  monitoring_frequency: string;
  last_monitored_at: string | null;
  created_at: string;
}

function timeAgo(d: string | null) {
  if (!d) return 'never';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`${BACKEND}/api/accounts`);
    const { accounts: data } = await res.json();
    setAccounts(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setAdding(true);
    const res = await fetch(`${BACKEND}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: input.trim() }),
    });
    if (res.ok) { setInput(''); await load(); }
    setAdding(false);
  }

  async function remove(id: string) {
    await fetch(`${BACKEND}/api/accounts/${id}`, { method: 'DELETE' });
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  async function scan(id: string) {
    setScanning(id);
    await fetch(`${BACKEND}/api/accounts/${id}/scan`, { method: 'POST' });
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, last_monitored_at: new Date().toISOString() } : a));
    setScanning(null);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      <div className="max-w-xl mx-auto px-6 py-12">

        <div className="flex items-center justify-between mb-10 text-white/20 text-xs">
          <button onClick={() => router.push('/feed')} className="hover:text-white/50 transition">← feed</button>
          <span className="tracking-widest uppercase">Accounts</span>
          <span className="text-white/10">{accounts.length} monitored</span>
        </div>

        <form onSubmit={add} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Company name (e.g. Stripe)"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="bg-white text-black font-medium rounded-lg px-5 py-3 text-sm hover:bg-white/90 transition disabled:opacity-30"
          >
            {adding ? '...' : 'Add'}
          </button>
        </form>

        {loading ? (
          <div className="text-center py-20 text-white/20 animate-pulse text-sm">loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/25 text-sm">No accounts yet</p>
            <p className="text-white/15 text-xs mt-2">Add companies above to start monitoring</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map(account => (
              <div key={account.id} className="flex items-center justify-between px-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-xl group">
                <div>
                  <p className="text-white/85 text-sm">{account.company_name}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    {account.monitoring_frequency} · last scan: {timeAgo(account.last_monitored_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => scan(account.id)}
                    disabled={scanning === account.id}
                    className="text-white/25 text-xs hover:text-white/60 transition disabled:opacity-30"
                  >
                    {scanning === account.id ? 'scanning...' : 'scan now'}
                  </button>
                  <button
                    onClick={() => remove(account.id)}
                    className="text-white/15 text-xs hover:text-red-400/60 transition"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
