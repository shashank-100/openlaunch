'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Cpu, 
  Database, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Activity,
  Network,
  Globe,
  Lock,
  Zap,
  ChevronRight
} from 'lucide-react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

const SOURCES = [
  { id: 'overview', label: 'Entity Profile Mapping', icon: Globe },
  { id: 'funding', label: 'Capital Flow Analysis', icon: Database },
  { id: 'news', label: 'Global Media Sentiment', icon: Activity },
  { id: 'stack', label: 'Technographic Fingerprinting', icon: Lock },
  { id: 'hiring', label: 'Human Capital Velocity', icon: Zap },
  { id: 'reputation', label: 'Market Credibility Index', icon: Search },
  { id: 'competitor', label: 'Adversarial Landscape', icon: Network },
  { id: 'contact', label: 'Key Stakeholder Extraction', icon: Cpu },
];

type SourceStatus = 'waiting' | 'active' | 'done' | 'error';

interface JobState {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  briefId?: string;
  error?: string;
}

export default function V2ResearchPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<JobState>({ state: 'waiting', progress: 0 });
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>(
    SOURCES.map(() => 'waiting')
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const progress = job.progress;
    const sourcesCompleted = Math.floor((Math.max(0, progress - 10)) / 10);

    setSourceStatuses((prev) =>
      SOURCES.map((_, i) => {
        if (i < sourcesCompleted) return 'done';
        if (i === sourcesCompleted && progress > 10) return 'active';
        return 'waiting';
      })
    );
  }, [job.progress]);

  const lastProgress = useRef(-1);
  useEffect(() => {
    const p = job.progress;
    if (p === lastProgress.current) return;
    lastProgress.current = p;

    if (p === 10) addLog('NEURAL_NODE_ACTIVE: Initiating multi-source recursive search...');
    if (p > 10 && p <= 90) {
      const idx = Math.floor((p - 10) / 10);
      if (idx < SOURCES.length) addLog(`FETCHING_DATA: Processing ${SOURCES[idx].label}...`);
    }
    if (p === 90) addLog('SYNTHESIZING: Aggregate analysis in progress...');
    if (p === 95) addLog('GENERATING_INSIGHTS: Crafting strategic briefing via GPT-DeepResearch...');
    if (p === 100) addLog('PROTOCOL_COMPLETE: Dispatching results to secure buffer.');
  }, [job.progress]);

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    setLogs((prev) => [...prev.slice(-40), `[${ts}] ${msg}`]);
  }

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`${BACKEND}/api/webhook/job/${jobId}`);
        if (!res.ok) return;
        const { job: jobData } = await res.json();

        setJob({
          state: jobData.state,
          progress: jobData.progress ?? 0,
          briefId: jobData.returnvalue?.briefId,
          error: jobData.failedReason,
        });

        if (jobData.state === 'completed' && jobData.returnvalue?.briefId) {
          clearInterval(pollRef.current!);
          clearInterval(intervalRef.current!);
          setTimeout(() => router.push(`/v2/brief/${jobData.returnvalue.briefId}`), 1000);
        }

        if (jobData.state === 'failed') {
          clearInterval(pollRef.current!);
          addLog(`CRITICAL_FAILURE: ${jobData.failedReason || 'Unknown core error'}`);
        }
      } catch {}
    }

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current!);
  }, [jobId, router]);

  const progressPct = Math.min(100, job.progress);
  const isFailed = job.state === 'failed';
  const isDone = job.state === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 animate-in fade-in duration-700">
      
      {/* Processing Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-[10px] text-cyan-400 font-black tracking-[0.3em] uppercase italic">Neural Processing Live</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter">
          {isDone ? 'Sequence Complete' : isFailed ? 'Sequence Terminated' : 'Analyzing Market Signal'}
        </h2>
        <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
          T-plus {elapsed}s | Entropy: 0.124 | Node: 0xF24A
        </p>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Progress & Checklist */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 shadow-2xl shadow-cyan-500/5">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neural Progress</span>
              <span className="text-3xl font-black text-white tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-1">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCES.map((source, i) => {
              const status = sourceStatuses[i];
              return (
                <div 
                  key={source.id} 
                  className={`p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4 ${
                    status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    status === 'active' ? 'bg-cyan-500/5 border-cyan-500/30' :
                    'bg-slate-900/20 border-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                    status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    status === 'active' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                    'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <source.icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold tracking-tight ${
                      status === 'done' ? 'text-emerald-400' :
                      status === 'active' ? 'text-white' :
                      'text-slate-600'
                    }`}>
                      {source.label}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {status === 'done' ? 'VERIFIED' : status === 'active' ? 'RECURSING...' : 'PENDING'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Console */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">System Console</span>
              <Activity className="w-4 h-4 text-cyan-500" />
            </div>
            
            <div
              ref={logRef}
              className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed"
            >
              {logs.length === 0 && (
                <span className="text-slate-800">Initializing secure handshake...</span>
              )}
              {logs.map((log, i) => (
                <div key={i} className={i === logs.length - 1 ? 'text-cyan-400' : 'text-slate-600'}>
                  {log}
                </div>
              ))}
            </div>

            {isFailed && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Kernel Panic
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed">
                  The automated research protocol was interrupted by a target firewall or internal node failure.
                </p>
                <button 
                  onClick={() => router.push('/v2')}
                  className="mt-4 w-full py-2 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors"
                >
                  Hard Reset
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Aesthetic Footer */}
      <div className="flex items-center justify-center gap-8 py-8 border-t border-slate-800/50">
         <div className="flex items-center gap-2 grayscale opacity-30">
           <div className="w-6 h-6 rounded bg-white" />
           <span className="text-xs font-black tracking-tighter text-white">INTAKE</span>
         </div>
         <div className="h-4 w-[1px] bg-slate-800" />
         <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase italic">
           Autonomous Revenue Agent v4.0.2-prod
         </p>
      </div>

    </div>
  );
}
