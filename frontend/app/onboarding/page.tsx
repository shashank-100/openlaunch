'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pitch, setPitch] = useState('');
  const [icpIndustry, setIcpIndustry] = useState('');
  const [icpSize, setIcpSize] = useState('');
  const [icpRole, setIcpRole] = useState('');
  const [icpPain, setIcpPain] = useState('');

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch(`${BACKEND}/api/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          pitch,
          icp_industry: icpIndustry,
          icp_company_size: icpSize,
          icp_role: icpRole,
          icp_pain: icpPain,
          tone: 'Direct and casual. Short sentences. No buzzwords.',
          never_say: '"Just checking in", "Circle back", "Hope this finds you well"',
          cta_style: 'Worth a 15-min call this week?',
          example_email: '',
        }),
      });
      router.push('/dashboard');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const canContinueStep1 = name && role && pitch;
  const canContinueStep2 = icpIndustry && icpSize && icpRole && icpPain;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" fill="white" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome to INTAKE</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Let's set up your autonomous sales agent in 2 minutes</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: step >= 1 ? '#6366f1' : '#e5e7eb', transition: 'all 0.3s' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: step >= 2 ? '#6366f1' : '#e5e7eb', transition: 'all 0.3s' }} />
        </div>

        {/* Step 1: About You & Your Product */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 6 }}>Tell us about you</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>INTAKE will use this to write emails that sound like you</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Your role</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Founder, Head of Sales"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>What does your company do?</label>
                <textarea
                  value={pitch}
                  onChange={e => setPitch(e.target.value)}
                  placeholder="e.g. We help B2B SaaS teams automate sales research so reps spend time selling, not Googling."
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canContinueStep1}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: 24,
                background: canContinueStep1 ? '#6366f1' : '#e5e7eb',
                color: canContinueStep1 ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: canContinueStep1 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: ICP */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 6 }}>Who do you sell to?</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>INTAKE will find companies that match this profile</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Industry</label>
                <input
                  value={icpIndustry}
                  onChange={e => setIcpIndustry(e.target.value)}
                  placeholder="e.g. B2B SaaS, Fintech, Healthcare"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Company size</label>
                <input
                  value={icpSize}
                  onChange={e => setIcpSize(e.target.value)}
                  placeholder="e.g. 50-500 employees"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Role / Title you target</label>
                <input
                  value={icpRole}
                  onChange={e => setIcpRole(e.target.value)}
                  placeholder="e.g. VP Sales, Head of RevOps, CRO"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 6 }}>Their biggest pain point</label>
                <textarea
                  value={icpPain}
                  onChange={e => setIcpPain(e.target.value)}
                  placeholder="e.g. SDRs spend 60% of their time on manual research instead of selling"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#666',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!canContinueStep2 || saving}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: canContinueStep2 && !saving ? '#6366f1' : '#e5e7eb',
                  color: canContinueStep2 && !saving ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canContinueStep2 && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Setting up...' : 'Start Finding Leads'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
