'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Globe, 
  Zap,
  Shield
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function V2ResearchEntry() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: company.trim() }),
      });
      const { account } = await res.json();
      
      // Trigger scan which returns queued status
      const scanRes = await fetch(`${BACKEND}/api/accounts/${account.id}/scan`, { method: 'POST' });
      // Since our scan doesn't return jobId, we'll go to feed or a placeholder
      // In a real scenario, the scan should return the jobId to redirect to /research/[jobId]
      router.push('/v2/feed');
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
      
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase italic">Autonomous Research Engine</span>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter leading-tight">
          Identify your next <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Strategic Opportunity.</span>
        </h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Enter any organization to deploy a cluster of AI agents for deep market analysis and signal extraction.
        </p>
      </div>

      <div className="w-full max-w-2xl relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <form onSubmit={handleSubmit} className="relative flex items-center p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="pl-4 pr-2">
            <Search className="w-6 h-6 text-slate-600" />
          </div>
          <input
            type="text"
            placeholder="Search company or domain (e.g. Acme Corp)..."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 text-lg py-4"
          />
          <button
            type="submit"
            disabled={loading || !company.trim()}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-cyan-400 transition-all disabled:opacity-20 shadow-lg"
          >
            {loading ? 'Deploying...' : 'Start Research'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="flex gap-8">
        {[
          { icon: Globe, label: 'Global News' },
          { icon: Zap, label: 'Hiring Signals' },
          { icon: Shield, label: 'Financial Data' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </div>
        ))}
      </div>

      <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
         {['Stripe', 'OpenAI', 'Anthropic', 'Scale AI'].map(name => (
           <button
             key={name}
             onClick={() => setCompany(name)}
             className="px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm hover:border-slate-700 hover:text-white transition-all text-center"
           >
             {name}
           </button>
         ))}
      </div>

    </div>
  );
}
