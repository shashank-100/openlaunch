'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state
  const [intro, setIntro] = useState('');
  const [icp, setIcp] = useState('');
  const [cta, setCta] = useState('');

  async function handleFinish() {
    setSaving(true);
    try {
      // Parse intro for name and pitch
      const lines = intro.split('\n');
      const firstLine = lines[0] || '';
      const namePart = firstLine.match(/Hi, I'm ([^.]+)\./);
      const name = namePart ? namePart[1].trim() : '';

      await fetch(`${BACKEND}/api/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'User',
          role: 'Founder',
          pitch: intro,
          icp_industry: 'B2B SaaS',
          icp_company_size: '50-500 employees',
          icp_role: extractFromICP(icp, 'role'),
          icp_pain: extractFromICP(icp, 'pain'),
          tone: 'Direct and casual. Short sentences. No buzzwords.',
          never_say: '"Just checking in", "Circle back", "Hope this finds you well"',
          cta_style: cta || 'Worth a 15-min call this week?',
          example_email: intro,
        }),
      });
      router.push('/dashboard');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function extractFromICP(text: string, field: string) {
    if (field === 'role') {
      const match = text.match(/(VP|Head|Director|CRO|CMO|CEO)([^,.\n]*)/i);
      return match ? match[0] : 'VP Sales';
    }
    return text.substring(0, 200);
  }

  const canContinueStep1 = intro.trim().length > 20;
  const canContinueStep2 = icp.trim().length > 20;
  const canFinish = cta.trim().length > 10;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Logo - top center */}
        {step === 3 && (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ width: 48, height: 48, margin: '0 auto', borderRadius: 12, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <p style={{ fontSize: 12, color: '#000', marginTop: 8, fontWeight: 500 }}>geodo</p>
          </div>
        )}

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            STEP {step} OF 3
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= 1 ? '#000' : '#e5e7eb' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= 2 ? '#000' : '#e5e7eb' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= 3 ? '#000' : '#e5e7eb' }} />
          </div>
        </div>

        {/* Step 1: Intro */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: '#000', marginBottom: 12, lineHeight: 1.2 }}>
              Let's get you set up.<br />
              Tell us your name and a bit about yourself and your company.
            </h1>

            <textarea
              value={intro}
              onChange={e => setIntro(e.target.value)}
              placeholder="Hi, I'm Sarah. I run a B2B SaaS startup that helps sales teams automate their outreach. We're a 15-person team based in New York, Series A stage..."
              rows={6}
              style={{
                width: '100%',
                padding: '16px',
                marginTop: 32,
                marginBottom: 40,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 15,
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!canContinueStep1}
              style={{
                padding: '14px 32px',
                background: canContinueStep1 ? '#000' : '#e5e7eb',
                color: canContinueStep1 ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: 99,
                fontSize: 15,
                fontWeight: 600,
                cursor: canContinueStep1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Continue
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* Step 2: ICP */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: '#000', marginBottom: 12, lineHeight: 1.2 }}>
              Who is your ideal customer profile?<br />
              Describe the companies and roles you want to reach.
            </h1>

            <textarea
              value={icp}
              onChange={e => setIcp(e.target.value)}
              placeholder="Our ICP is VP of Sales or Head of Growth at mid-market SaaS companies with 50-500 employees, mostly US and Canada, ideally in the tech or fintech space."
              rows={6}
              style={{
                width: '100%',
                padding: '16px',
                marginTop: 32,
                marginBottom: 40,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 15,
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '14px 32px',
                  background: '#f3f4f6',
                  color: '#666',
                  border: 'none',
                  borderRadius: 99,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                style={{
                  padding: '14px 32px',
                  background: canContinueStep2 ? '#000' : '#e5e7eb',
                  color: canContinueStep2 ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: 99,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canContinueStep2 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Continue
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: CTA */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 600, color: '#000', marginBottom: 12, lineHeight: 1.2 }}>
              What's your call to action?<br />
              What do you want people to do after hearing from you?
            </h1>

            <textarea
              value={cta}
              onChange={e => setCta(e.target.value)}
              placeholder="Our call to action is that we give them a one-week free trial of our product and return to feedback, and then we implement every feature that they want in the product in under 24 hours."
              rows={6}
              style={{
                width: '100%',
                padding: '16px',
                marginTop: 32,
                marginBottom: 40,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 15,
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '14px 32px',
                  background: '#f3f4f6',
                  color: '#666',
                  border: 'none',
                  borderRadius: 99,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!canFinish || saving}
                style={{
                  padding: '14px 32px',
                  background: canFinish && !saving ? '#000' : '#e5e7eb',
                  color: canFinish && !saving ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: 99,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: canFinish && !saving ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {saving ? 'Setting up...' : 'Finish'}
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
