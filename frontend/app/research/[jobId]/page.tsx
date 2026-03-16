'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND = 'https://backend-production-d5926.up.railway.app';

const SOURCES = [
  'Company Overview',
  'Funding & Company Info',
  'Recent News',
  'Tech Stack',
  'Hiring Signals',
  'Reviews & Reputation',
  'Competitor Research',
  'Contact Research',
];

type SourceStatus = 'waiting' | 'active' | 'done' | 'error';

interface JobState {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  briefId?: string;
  error?: string;
}

export default function ResearchPage() {
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

  // Elapsed timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Derive source statuses from progress
  useEffect(() => {
    const progress = job.progress;
    // Progress 10-90 maps to 8 sources
    // Each source = 10 progress points
    const sourcesCompleted = Math.floor((Math.max(0, progress - 10)) / 10);

    setSourceStatuses((prev) =>
      SOURCES.map((_, i) => {
        if (i < sourcesCompleted) return 'done';
        if (i === sourcesCompleted && progress > 10) return 'active';
        return 'waiting';
      })
    );
  }, [job.progress]);

  // Simulate log messages as progress moves
  const lastProgress = useRef(-1);
  useEffect(() => {
    const p = job.progress;
    if (p === lastProgress.current) return;
    lastProgress.current = p;

    if (p === 10) addLog('Agent started. Querying sources...');
    if (p > 10 && p <= 90) {
      const idx = Math.floor((p - 10) / 10);
      if (idx < SOURCES.length) addLog(`Scanning ${SOURCES[idx]}...`);
    }
    if (p === 90) addLog('Analyzing signals...');
    if (p === 95) addLog('Generating brief with GPT-5-mini...');
    if (p === 100) addLog('Brief complete. Loading...');
  }, [job.progress]);

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev.slice(-40), `${ts}  ${msg}`]);
  }

  // Poll job status
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
          setTimeout(() => router.push(`/brief/${jobData.returnvalue.briefId}`), 800);
        }

        if (jobData.state === 'failed') {
          clearInterval(pollRef.current!);
          addLog(`Error: ${jobData.failedReason || 'Research failed'}`);
        }
      } catch {
        // Network error — keep polling
      }
    }

    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current!);
  }, [jobId, router]);

  const progressPct = Math.min(100, job.progress);
  const isFailed = job.state === 'failed';
  const isDone = job.state === 'completed';

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Intake</p>
          <h2 className="text-2xl font-semibold text-white">
            {isDone ? 'Research complete' : isFailed ? 'Research failed' : 'Researching...'}
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {isDone ? 'Opening brief...' : isFailed ? 'Something went wrong' : `${elapsed}s elapsed`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">Progress</span>
            <span className="text-white/60 text-xs tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Source checklist */}
        <div className="mb-8 space-y-2.5">
          {SOURCES.map((source, i) => {
            const status = sourceStatuses[i];
            return (
              <div key={source} className="flex items-center gap-3">
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {status === 'done' && (
                    <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'active' && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                  {status === 'waiting' && (
                    <div className="w-2 h-2 rounded-full bg-white/15" />
                  )}
                  {status === 'error' && (
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  )}
                </div>
                <span className={`text-sm transition-colors ${
                  status === 'done' ? 'text-white/70' :
                  status === 'active' ? 'text-white' :
                  'text-white/25'
                }`}>
                  {source}
                </span>
              </div>
            );
          })}
        </div>

        {/* Log terminal */}
        <div
          ref={logRef}
          className="bg-white/3 border border-white/8 rounded-lg px-4 py-3 h-32 overflow-y-auto font-mono text-xs text-white/40 space-y-1"
        >
          {logs.length === 0 && (
            <span className="text-white/20">Initializing agent...</span>
          )}
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? 'text-white/60' : ''}>
              {log}
            </div>
          ))}
        </div>

        {isFailed && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-white/40 hover:text-white text-sm underline transition"
            >
              ← Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
