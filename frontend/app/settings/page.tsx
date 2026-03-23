'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';
const DEMO_USER = '00000000-0000-0000-0000-000000000001';

interface Persona {
  name: string;
  role: string;
  pitch: string;
  icp_company_size: string;
  icp_industry: string;
  icp_role: string;
  icp_pain: string;
  tone: string;
  never_say: string;
  example_email: string;
  cta_style: string;
}

const EMPTY_PERSONA: Persona = {
  name: '', role: '', pitch: '',
  icp_company_size: '', icp_industry: '', icp_role: '', icp_pain: '',
  tone: '', never_say: '', example_email: '', cta_style: '',
};

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ jobsCreated: number; meetingsFound: number } | null>(null);
  const [toast, setToast] = useState('');
  const [persona, setPersona] = useState<Persona>(EMPTY_PERSONA);
  const [savingPersona, setSavingPersona] = useState(false);

  useEffect(() => {
    if (params.get('calendar_connected') === 'true') {
      setCalendarConnected(true);
      showToast('Google Calendar connected!');
    }
    if (params.get('error') === 'calendar_connection_failed') {
      showToast('Calendar connection failed. Check your Google OAuth credentials.');
    }
    loadPersona();
  }, [params]);

  async function loadPersona() {
    try {
      const res = await fetch(`${BACKEND}/api/persona`);
      if (res.ok) {
        const data = await res.json();
        if (data.persona) setPersona({ ...EMPTY_PERSONA, ...data.persona });
      }
    } catch {}
  }

  async function savePersona() {
    setSavingPersona(true);
    try {
      await fetch(`${BACKEND}/api/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });
      showToast('Persona saved — follow-ups will now sound like you.');
    } catch {
      showToast('Save failed.');
    } finally {
      setSavingPersona(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function connectCalendar() {
    window.location.href = `${BACKEND}/api/calendar/connect/google?userId=${DEMO_USER}`;
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${BACKEND}/api/calendar/sync/${DEMO_USER}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: '00000000-0000-0000-0000-000000000002' }),
      });
      const data = await res.json();
      setSyncResult({ jobsCreated: data.jobsCreated || 0, meetingsFound: data.meetingsFound || 0 });
      showToast(data.jobsCreated > 0 ? `${data.jobsCreated} jobs queued!` : 'No new meetings found.');
    } catch {
      showToast('Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  const field = (label: string, key: keyof Persona, placeholder: string, multiline = false) => (
    <div>
      <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={persona[key]}
          onChange={e => setPersona(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-white/20 resize-none font-mono"
        />
      ) : (
        <input
          value={persona[key]}
          onChange={e => setPersona(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-white/80 text-sm placeholder-white/20 focus:outline-none focus:border-white/20"
        />
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/feed')} className="text-white/30 hover:text-white/60 text-sm transition">← Back</button>
        <span className="text-white/20 text-xs uppercase tracking-widest">Geodo</span>
        <span className="text-white/20 text-xs">Settings</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12 space-y-12">

        {/* Persona */}
        <div>
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-1">Your Persona</h2>
          <p className="text-white/20 text-xs mb-6">Fill this in once. Every follow-up will sound like you.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field('Your name', 'name', 'e.g. Shashank')}
              {field('Your role', 'role', 'e.g. Founder / Head of Sales')}
            </div>

            {field('What you sell', 'pitch', 'e.g. We help B2B SaaS teams automate sales research so reps spend time selling, not Googling.')}

            <div className="pt-1">
              <p className="text-white/20 text-[10px] uppercase tracking-widest mb-3">Your ICP</p>
              <div className="grid grid-cols-2 gap-4">
                {field('Company size', 'icp_company_size', 'e.g. 50–500 employees')}
                {field('Industry', 'icp_industry', 'e.g. SaaS, Fintech')}
                {field('Role you sell to', 'icp_role', 'e.g. VP Sales, Head of RevOps')}
                {field('Their biggest pain', 'icp_pain', 'e.g. SDRs spending 60% on research')}
              </div>
            </div>

            {field('Your writing tone', 'tone', 'e.g. Direct and casual. Short sentences. No buzzwords. I write like I talk.')}
            {field('Things you never say', 'never_say', 'e.g. "Just checking in", "Circle back", "Hope this finds you well"')}
            {field('Your CTA style', 'cta_style', 'e.g. "Worth a 15-min call this week?" or "Open to a quick demo?"')}
            {field('Your best cold email (paste it here)', 'example_email', 'The AI will match this style for all follow-ups...', true)}

            <button
              onClick={savePersona}
              disabled={savingPersona}
              className="w-full py-3 bg-white text-black text-sm font-medium rounded-xl hover:bg-white/90 transition disabled:opacity-40"
            >
              {savingPersona ? 'Saving...' : 'Save Persona'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-5">Calendar</h2>
          <div className="bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${calendarConnected ? 'bg-green-400' : 'bg-white/20'}`} />
                <span className="text-white text-sm">Google Calendar</span>
              </div>
              {calendarConnected ? (
                <span className="text-green-400/80 text-xs">Connected</span>
              ) : (
                <button onClick={connectCalendar} className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/90 transition">
                  Connect
                </button>
              )}
            </div>
            <p className="text-white/30 text-xs ml-5">
              {calendarConnected ? 'Auto-researches attendees 24h before meetings.' : 'Connect to trigger research when meetings are scheduled.'}
            </p>
            {calendarConnected && (
              <div className="mt-4 ml-5">
                <button onClick={syncNow} disabled={syncing} className="text-white/50 hover:text-white text-xs border border-white/15 hover:border-white/30 rounded px-3 py-1.5 transition disabled:opacity-40">
                  {syncing ? 'Syncing...' : 'Sync now'}
                </button>
                {syncResult && (
                  <p className="text-white/30 text-xs mt-2">
                    {syncResult.meetingsFound} meetings · {syncResult.jobsCreated} jobs queued
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Model */}
        <div>
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-5">AI Model</h2>
          <div className="bg-white/3 border border-white/8 rounded-xl p-5 flex items-center justify-between">
            <span className="text-white/60 text-sm">GPT-4o</span>
            <span className="text-white/20 text-xs">via OpenAI</span>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0a0a]" />}>
      <SettingsContent />
    </Suspense>
  );
}
