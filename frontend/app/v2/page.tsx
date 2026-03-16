'use client';

import { useRouter } from 'next/navigation';
import { 
  Zap, 
  ArrowRight, 
  Shield, 
  Target, 
  Cpu,
  BarChart3,
  Network
} from 'lucide-react';

export default function V2Dashboard() {
  const router = useRouter();

  const stats = [
    { label: 'Intelligence Points', value: '1,284', icon: Target, color: 'text-cyan-400' },
    { label: 'Active Monitors', value: '42', icon: Shield, color: 'text-emerald-400' },
    { label: 'Signals Captured', value: '8.4k', icon: Zap, color: 'text-amber-400' },
    { label: 'Neural Compute', value: '98.2%', icon: Cpu, color: 'text-purple-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* Hero / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-12 flex items-center justify-between shadow-2xl shadow-cyan-500/5">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase italic">System Operational</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            The next generation of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Revenue Intelligence.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Deploy autonomous agents to monitor market movements, analyze leadership shifts, and identify high-intent revenue signals before your competition.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => router.push('/v2/feed')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-cyan-400 transition-all group shadow-xl shadow-white/5"
            >
              Enter Intelligence Feed
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/v2/accounts')}
              className="px-8 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all"
            >
              Configure Targets
            </button>
          </div>
        </div>

        {/* Abstract Visual Component */}
        <div className="hidden lg:block relative w-80 h-80">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl" />
          <div className="relative w-full h-full border-2 border-slate-800 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
            <div className="w-3/4 h-3/4 border-2 border-cyan-500/20 rounded-full flex items-center justify-center animate-[spin_15s_linear_infinite_reverse]">
              <div className="w-1/2 h-1/2 border-2 border-blue-500/40 rounded-full flex items-center justify-center">
                <Zap className="w-12 h-12 text-cyan-400" fill="currentColor" />
              </div>
            </div>
            {/* Orbitals */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-white/50" />
            <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-cyan-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 transition-colors`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <BarChart3 className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1 group-hover:text-cyan-400 transition-colors">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-500" />
              Global Pulse Network
            </h3>
            <span className="text-xs text-slate-500">Live visualization of agent nodes</span>
          </div>
          <div className="aspect-[2/1] bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative text-slate-700 text-xs font-mono uppercase tracking-[0.4em] animate-pulse">
              Initializing Neural Mapping...
            </div>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20">
          <h3 className="text-xl font-bold text-white mb-4">Deployment Guide</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You are currently operating in <span className="text-cyan-400 font-bold">Stealth Mode</span>. Signals are being routed through private proxies to ensure anonymity.
          </p>
          <div className="space-y-3">
            {[
              'Monitor 10+ new domains',
              'Enable leadership alerts',
              'Connect LinkedIn API',
              'Set up Slack webhooks'
            ].map(task => (
              <div key={task} className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-4 h-4 rounded border border-cyan-500/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-500/20" />
                </div>
                {task}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
