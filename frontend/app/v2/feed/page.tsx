'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpRight, 
  Clock, 
  ExternalLink, 
  Mail, 
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Users,
  AlertCircle
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Signal {
  id: string;
  signal_type: string;
  signal_summary: string;
  pain_point: string;
  outreach_angle: string;
  email_subject: string;
  email_body: string;
  source_url: string | null;
  is_new: boolean;
  detected_at: string;
  accounts: { id: string; company_name: string } | null;
}

const TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  funding: { color: 'text-emerald-400', icon: Rocket, label: 'Capital Expansion' },
  hiring: { color: 'text-blue-400', icon: Users, label: 'Talent Acquisition' },
  leadership: { color: 'text-purple-400', icon: AlertCircle, label: 'Executive Shift' },
  product: { color: 'text-cyan-400', icon: Plus, label: 'Product Launch' },
  competitive: { color: 'text-rose-400', icon: Search, label: 'Market Conflict' },
  general: { color: 'text-slate-400', icon: Clock, label: 'General Update' },
};

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function V2FeedPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`${BACKEND}/api/signals`)
      .then(r => r.json())
      .then(d => setSignals(d.signals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? signals
    : signals.filter(s => s.signal_type === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Feed</h2>
          <p className="text-slate-500 mt-2 text-sm max-w-md">
            Real-time autonomous research identifying strategic revenue opportunities across your target market.
          </p>
        </div>
        
        <div className="flex gap-2">
          {['all', 'funding', 'hiring', 'leadership', 'product'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border ${
                filter === t
                  ? 'bg-white text-black border-white'
                  : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 4, 5].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <Search className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No signals detected</p>
          <p className="text-slate-600 text-sm mt-1">Try expanding your monitoring list</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((signal, index) => {
            const config = TYPE_CONFIG[signal.signal_type] || TYPE_CONFIG.general;
            const Icon = config.icon;
            
            return (
              <div
                key={signal.id}
                className="group relative flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-2xl p-6 hover:bg-slate-900/60 hover:border-slate-700/80 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Status bar */}
                <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Top: Meta */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 transition-colors`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold leading-tight group-hover:text-cyan-400 transition-colors">
                        {signal.accounts?.company_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(signal.detected_at)}
                    </span>
                  </div>
                </div>

                {/* Body: Summary */}
                <div className="flex-1">
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4">
                    {signal.signal_summary}
                  </p>
                  
                  {signal.outreach_angle && (
                    <div className="px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-cyan-400/80 italic">
                      Strategic Angle: {signal.outreach_angle}
                    </div>
                  )}
                </div>

                {/* Footer: Actions */}
                <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {signal.source_url && (
                      <a 
                        href={signal.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/v2/brief/${signal.id}`)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                      Analyze
                    </button>
                    <button 
                      onClick={() => router.push(`/v2/send/${signal.id}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white text-black hover:bg-cyan-400 hover:text-slate-900 transition-all group/btn"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Dispatch
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* New Badge */}
                {signal.is_new && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex items-center gap-1.5 bg-cyan-500 px-2 py-0.5 rounded-full shadow-lg shadow-cyan-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase tracking-tighter">NEW</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
