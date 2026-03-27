'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import { Suspense } from 'react';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

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
  const params = useSearchParams();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [persona, setPersona] = useState<Persona>(EMPTY_PERSONA);
  const [savingPersona, setSavingPersona] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [calendlyLink, setCalendlyLink] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (params.get('gmail_connected') === 'true') {
      setGmailConnected(true);
      showToast('Gmail connected!');
    }
    if (params.get('gmail_error') === 'true') {
      showToast('Gmail connection failed. Try again.', false);
    }
    loadPersona();
    loadSettings();
  }, [params]);

  async function loadSettings() {
    try {
      const res = await fetch(`${BACKEND}/api/settings`);
      if (res.ok) {
        const d = await res.json();
        setAutoSend(d.auto_send || false);
        setCalendlyLink(d.calendly_link || '');
      }
    } catch {}
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch(`${BACKEND}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_send: autoSend, calendly_link: calendlyLink }),
      });
      showToast('Settings saved');
    } catch { showToast('Save failed', false); }
    finally { setSavingSettings(false); }
  }

  async function loadPersona() {
    try {
      const res = await fetch(`${BACKEND}/api/persona`);
      if (res.ok) {
        const data = await res.json();
        if (data.persona) {
          setPersona({ ...EMPTY_PERSONA, ...data.persona });
          if (data.persona.gmail_access_token) setGmailConnected(true);
        }
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
      showToast('Persona saved');
    } catch {
      showToast('Save failed', false);
    } finally {
      setSavingPersona(false);
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function connectGmail() {
    window.location.href = `${BACKEND}/api/gmail/connect`;
  }

  const inp = (label: string, key: keyof Persona, placeholder: string, multiline = false) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{label}</label>
      {multiline ? (
        <textarea
          value={persona[key]}
          onChange={e => setPersona(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={4}
          style={{ width: '100%', background: '#f7f7f6', border: '1px solid #ececea', borderRadius: 8, padding: '8px 12px', color: '#111', fontSize: 13.5, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
        />
      ) : (
        <input
          value={persona[key]}
          onChange={e => setPersona(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: '100%', background: '#f7f7f6', border: '1px solid #ececea', borderRadius: 8, padding: '8px 12px', color: '#111', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
        />
      )}
    </div>
  );


  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: '#f7f7f6' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toast.ok ? '#111' : '#dc2626', color: '#fff',
          fontSize: 13, fontWeight: 500, padding: '10px 18px', borderRadius: 10,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}

      <Sidebar settingsActive />

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '16px 28px 12px', borderBottom: '1px solid #f0f0ef', background: '#fff' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Configuration</p>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.4px' }}>Settings</h1>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 28px' }}>

          {/* Persona */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '22px 24px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Your Persona</p>
            <p style={{ fontSize: 12.5, color: '#aaa', marginBottom: 20 }}>Fill this in once. Every follow-up will sound like you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {inp('Your name', 'name', 'e.g. Shashank')}
                {inp('Your role', 'role', 'e.g. Founder / Head of Sales')}
              </div>
              {inp('What you sell', 'pitch', 'e.g. We help B2B SaaS teams automate sales research so reps spend time selling, not Googling.')}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Your ICP</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {inp('Company size', 'icp_company_size', 'e.g. 50–500 employees')}
                  {inp('Industry', 'icp_industry', 'e.g. SaaS, Fintech')}
                  {inp('Role you sell to', 'icp_role', 'e.g. VP Sales, Head of RevOps')}
                  {inp('Their biggest pain', 'icp_pain', 'e.g. SDRs spending 60% on research')}
                </div>
              </div>
              {inp('Your writing tone', 'tone', 'e.g. Direct and casual. Short sentences. No buzzwords.')}
              {inp('Things you never say', 'never_say', 'e.g. "Just checking in", "Circle back", "Hope this finds you well"')}
              {inp('Your CTA style', 'cta_style', 'e.g. "Worth a 15-min call this week?"')}
              {inp('Your best cold email (paste it here)', 'example_email', 'The AI will match this style for all follow-ups...', true)}
              <button onClick={savePersona} disabled={savingPersona} style={{
                width: '100%', padding: '12px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingPersona ? 0.5 : 1,
              }}>
                {savingPersona ? 'Saving...' : 'Save Persona'}
              </button>
            </div>
          </div>

          {/* Gmail */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '22px 24px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Gmail</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: gmailConnected ? '#16a34a' : '#d1d5db' }} />
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: '#111' }}>Gmail</p>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                    {gmailConnected ? 'Inbox monitored. Hot leads trigger Telegram alerts.' : 'Connect to monitor inbox for hot leads.'}
                  </p>
                </div>
              </div>
              {gmailConnected ? (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>Connected</span>
              ) : (
                <button onClick={connectGmail} style={{
                  background: '#111', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Connect</button>
              )}
            </div>
          </div>

          {/* Automation */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '22px 24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Automation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: '#111' }}>Auto-send mode</p>
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Emails send automatically without Telegram approval</p>
                </div>
                <button onClick={() => setAutoSend(!autoSend)} style={{
                  width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: autoSend ? '#6366f1' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, transition: 'left 0.2s', left: autoSend ? 23 : 3,
                  }} />
                </button>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Calendly Link</label>
                <input
                  value={calendlyLink}
                  onChange={e => setCalendlyLink(e.target.value)}
                  placeholder="https://calendly.com/your-link"
                  style={{ width: '100%', background: '#f7f7f6', border: '1px solid #ececea', borderRadius: 8, padding: '8px 12px', color: '#111', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: 11.5, color: '#aaa', marginTop: 6 }}>Used when someone replies with meeting interest</p>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} style={{
                padding: '12px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: savingSettings ? 0.5 : 1,
              }}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', background: '#f7f7f6' }} />}>
      <SettingsContent />
    </Suspense>
  );
}
