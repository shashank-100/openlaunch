'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const DEMO_USER = '00000000-0000-0000-0000-000000000001';

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ jobsCreated: number; meetingsFound: number } | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (params.get('calendar_connected') === 'true') {
      setCalendarConnected(true);
      showToast('Google Calendar connected!');
    }
    if (params.get('error') === 'calendar_connection_failed') {
      showToast('Calendar connection failed. Check your Google OAuth credentials.');
    }
  }, [params]);

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
      if (data.jobsCreated > 0) {
        showToast(`${data.jobsCreated} research job${data.jobsCreated > 1 ? 's' : ''} queued!`);
      } else {
        showToast('No new meetings found in the next 2 hours.');
      }
    } catch {
      showToast('Sync failed. Is backend running?');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg transition-all">
          {toast}
        </div>
      )}

      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/30 hover:text-white/60 text-sm transition">
          ← Back
        </button>
        <span className="text-white/20 text-xs uppercase tracking-widest">Intake</span>
        <span className="text-white/20 text-xs">Settings</span>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-white mb-10">Settings</h1>

        {/* Calendar section */}
        <div className="mb-8">
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-5">Calendar</h2>

          <div className="bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${calendarConnected ? 'bg-green-400' : 'bg-white/20'}`} />
                <span className="text-white text-sm font-medium">Google Calendar</span>
              </div>
              {calendarConnected ? (
                <span className="text-green-400/80 text-xs">Connected</span>
              ) : (
                <button
                  onClick={connectCalendar}
                  className="bg-white text-black text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/90 transition"
                >
                  Connect
                </button>
              )}
            </div>
            <p className="text-white/30 text-xs ml-5">
              {calendarConnected
                ? 'Intake will auto-research external attendees 24h before meetings.'
                : 'Connect to auto-trigger research when meetings are scheduled.'}
            </p>

            {calendarConnected && (
              <div className="mt-4 ml-5">
                <button
                  onClick={syncNow}
                  disabled={syncing}
                  className="text-white/50 hover:text-white text-xs border border-white/15 hover:border-white/30 rounded px-3 py-1.5 transition disabled:opacity-40"
                >
                  {syncing ? 'Syncing...' : 'Sync now'}
                </button>
                {syncResult && (
                  <p className="text-white/30 text-xs mt-2">
                    Found {syncResult.meetingsFound} external meetings · {syncResult.jobsCreated} jobs queued
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-8">
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-5">How it works</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Meeting booked with external attendee' },
              { step: '2', text: 'Intake detects it automatically via calendar' },
              { step: '3', text: '8 sources researched: website, news, funding, jobs, competitors...' },
              { step: '4', text: 'Brief ready — company snapshot, signals, suggested openers' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 items-start">
                <span className="text-white/20 text-xs mt-0.5 w-4 flex-shrink-0">{item.step}</span>
                <span className="text-white/50 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model config */}
        <div>
          <h2 className="text-white/30 text-xs uppercase tracking-widest mb-5">AI Model</h2>
          <div className="bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">GPT-5-mini</span>
              <span className="text-white/20 text-xs">via OpenAI</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <SettingsContent />
    </Suspense>
  );
}
