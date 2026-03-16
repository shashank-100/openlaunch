'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  Bell, 
  Settings, 
  LogOut,
  Zap,
  Globe
} from 'lucide-react';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Intelligence Feed', icon: Bell, href: '/v2/feed' },
    { label: 'Market Research', icon: Search, href: '/v2/research' },
    { label: 'Strategic Accounts', icon: Building2, href: '/v2/accounts' },
    { label: 'Global Insights', icon: Globe, href: '/v2/insights' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl z-50 flex flex-col p-6">
        
        {/* Brand */}
        <div className="flex items-center gap-3 mb-12 px-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-white font-semibold tracking-tight leading-none text-lg">INTAKE</h1>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] font-medium mt-1 uppercase">AI Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                  active 
                    ? 'bg-slate-800/50 text-cyan-400 border border-slate-700/50' 
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${active ? 'text-cyan-400' : 'group-hover:text-slate-200'}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {active && <div className="ml-auto w-1 h-4 bg-cyan-400 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* User / Bottom */}
        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 transition-all duration-300">
            <Settings className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-400/10 hover:text-red-400 transition-all duration-300">
            <LogOut className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Live Pulse</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-xs text-slate-500 font-medium">Monitoring 482 global signals per minute</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
                </div>
              ))}
            </div>
            <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

    </div>
  );
}
