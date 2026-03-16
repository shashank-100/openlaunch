'use client';

import { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Zap, 
  MoreVertical,
  Globe,
  RefreshCw
} from 'lucide-react';

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
  if (!d) return 'Never';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function V2AccountsPage() {
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
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Strategic Accounts</h2>
          <p className="text-slate-500 mt-2 text-sm max-w-md">
            Manage the organizations and domains your AI agents are currently monitoring for revenue signals.
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-medium text-slate-400">
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            {accounts.length} Active Targets
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-1 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center shadow-2xl shadow-cyan-500/5">
        <form onSubmit={add} className="flex-1 flex items-center">
          <div className="pl-5 pr-3">
            <Search className="w-5 h-5 text-slate-600" />
          </div>
          <input
            type="text"
            placeholder="Search or add a new company domain..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 text-sm py-4"
          />
          <div className="pr-1.5">
            <button
              type="submit"
              disabled={adding || !input.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-cyan-400 hover:text-slate-950 transition-all duration-300 disabled:opacity-20"
            >
              {adding ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {adding ? 'Initializing...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {accounts.map((account) => (
            <div 
              key={account.id}
              className="group flex items-center justify-between p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/60 hover:border-slate-700/80 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                  <Building2 className="w-6 h-6 text-slate-500 group-hover:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{account.company_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {account.monitoring_frequency}
                    </span>
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      Last Scan: <span className="text-slate-400">{timeAgo(account.last_monitored_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => scan(account.id)}
                  disabled={scanning === account.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    scanning === account.id
                      ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-white hover:text-black'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${scanning === account.id ? 'animate-pulse' : ''}`} />
                  {scanning === account.id ? 'Analyzing...' : 'Scan Now'}
                </button>
                
                <div className="w-[1px] h-8 bg-slate-800 mx-2" />
                
                <button 
                  onClick={() => remove(account.id)}
                  className="p-2.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <button className="p-2.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 text-sm">No accounts currently monitored.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
