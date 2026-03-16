'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Mail, 
  ShieldCheck, 
  ExternalLink,
  Info,
  ChevronRight,
  Target,
  Zap
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Brief {
  id: string;
  signal_id: string;
  account_id: string;
  what_they_do: string;
  the_signal: string;
  the_pain: string;
  your_angle: string;
  the_email: string;
  created_at: string;
}

interface Signal {
  id: string;
  signal_type: string;
  signal_summary: string;
  email_subject: string;
  email_body: string;
  accounts: { company_name: string } | null;
}

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  funding: { color: 'text-emerald-400', label: 'Capital Expansion' },
  hiring: { color: 'text-blue-400', label: 'Talent Acquisition' },
  leadership: { color: 'text-purple-400', label: 'Executive Shift' },
  product: { color: 'text-cyan-400', label: 'Product Launch' },
  competitive: { color: 'text-rose-400', label: 'Market Conflict' },
  general: { color: 'text-slate-400', label: 'General Update' },
};

export default function V2BriefPage() {
  const { briefId } = useParams<{ briefId: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [briefRes, signalRes] = await Promise.all([
          fetch(`${BACKEND}/api/briefs/${briefId}`),
          fetch(`${BACKEND}/api/signals/${briefId}`),
        ]);
        if (briefRes.ok) {
          const { brief: b } = await briefRes.json();
          setBrief(b);
        }
        if (signalRes.ok) {
          const { signal: s } = await signalRes.json();
          setSignal(s);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [briefId]);

  function copyEmail() {
    const emailText = brief?.the_email || `${signal?.email_subject}

${signal?.email_body}`;
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const companyName = signal?.accounts?.company_name || 'Strategic Entity';
  const config = TYPE_CONFIG[signal?.signal_type || 'general'] || TYPE_CONFIG.general;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin" />
        <span className="text-slate-500 font-mono text-xs tracking-widest uppercase">Analyzing Data Nodes...</span>
      </div>
    );
  }

  if (!brief && !signal) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Brief data not found.</p>
        <button onClick={() => router.push('/v2/feed')} className="mt-4 text-cyan-400 flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/v2/feed')}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Intelligence
        </button>
        
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Verified Insight
          </div>
          <div className={`px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 ${config.color}`}>
            <Zap className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>
      </div>

      {/* Main Brief Header */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 relative overflow-hidden group shadow-2xl shadow-cyan-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        
        <p className="text-cyan-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Strategic Briefing</p>
        <h2 className="text-4xl font-black text-white tracking-tighter mb-4">{companyName}</h2>
        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">{signal?.signal_summary}</p>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Deep Dive */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all">
            <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Intelligence Core
            </h4>
            <div className="space-y-6">
              <div>
                <p className="text-white font-bold text-sm mb-1.5 flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
                  What They Do
                </p>
                <p className="text-slate-400 text-sm leading-relaxed pl-5">{brief?.what_they_do || 'No entity profile data available.'}</p>
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-1.5 flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
                  The Pain Point
                </p>
                <p className="text-slate-400 text-sm leading-relaxed pl-5">{brief?.the_pain || 'Identifying operational friction...'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20">
            <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Strategic Angle
            </h4>
            <p className="text-white font-bold text-lg leading-snug">{brief?.your_angle || 'Calculating optimal outreach velocity...'}</p>
          </div>
        </div>

        {/* Email Draft Section */}
        <div className="flex flex-col">
          <div className="flex-1 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col group shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Dispatch Draft
              </h4>
              <button 
                onClick={copyEmail}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex-1 font-mono text-xs text-slate-300 leading-loose bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                 <ShieldCheck className="w-12 h-12" />
               </div>
               <p className="text-slate-500 mb-4 pb-4 border-b border-slate-800 italic">
                 Subject: {signal?.email_subject}
               </p>
               <pre className="whitespace-pre-wrap">{brief?.the_email || signal?.email_body}</pre>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => router.push(`/v2/send/${briefId}`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-cyan-400 transition-all shadow-lg"
              >
                Dispatch Strategy
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-8 border-t border-slate-800/50 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            AI Conf. 94%
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Source: Global Web Index</span>
        </div>
        <button className="flex items-center gap-1 hover:text-white transition-colors">
          View Raw Telemetry
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
}
