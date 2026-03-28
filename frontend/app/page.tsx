'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      const res = await fetch(`${BACKEND}/api/persona`);
      if (res.ok) {
        const data = await res.json();
        // If no pitch is set, user needs onboarding
        if (!data.persona?.pitch || data.persona.pitch.trim() === '') {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/onboarding');
      }
    } catch {
      router.push('/onboarding');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f6' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <p style={{ fontSize: 14, color: '#666' }}>Loading INTAKE...</p>
      </div>
    </div>
  );
}
