'use client';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Analytics {
  overview: {
    signals_total: number; signals_this_week: number;
    emails_sent_total: number; emails_sent_week: number;
    replies_total: number; interested_replies: number;
    meetings_booked: number; follow_ups_sent: number;
    reply_rate: number; meeting_rate: number;
  };
  signal_types: Record<string, number>;
  activity: { date: string; signals: number; sent: number }[];
  best_signals: { company_name: string; signal_type: string; relevance_score: number }[];
}

function Stat({ label, value, sub, color = '#111' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '18px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  funding: '#3b82f6', hiring: '#16a34a', product_launch: '#9333ea',
  partnership: '#ea580c', expansion: '#0d9488', general: '#9ca3af',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/api/analytics`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const maxActivity = data ? Math.max(...data.activity.map(d => d.signals), 1) : 1;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: '#f7f7f6' }}>

      {/* Sidebar */}
      <aside style={{ width: 210, background: '#18181b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>Geodo</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Signal outreach</p>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { href: '/dashboard', label: 'Inbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { href: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: true },
            { href: '/settings', label: 'Settings', icon: 'M12 2v2m0 16v2M2 12h2m16 0h2m-3.05-6.95-1.41 1.41M7.46 16.54l-1.41 1.41M17 17l1.41 1.41M7.46 7.46 6.05 6.05' },
            { href: '/dashboard?section=chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
          ].map(({ href, label, icon, active }) => (
            <a key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8,
              background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.38)',
              textDecoration: 'none', fontSize: 13.5, fontWeight: active ? 500 : 400,
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ opacity: active ? 1 : 0.6 }}>
                <path d={icon}/>
              </svg>
              {label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.4px', marginBottom: 20 }}>Analytics</h1>

          {loading ? (
            <p style={{ color: '#ccc', fontSize: 13 }}>Loading...</p>
          ) : !data ? (
            <p style={{ color: '#ccc', fontSize: 13 }}>Failed to load analytics</p>
          ) : (
            <>
              {/* Overview stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                <Stat label="Signals Found" value={data.overview.signals_total} sub={`+${data.overview.signals_this_week} this week`} />
                <Stat label="Emails Sent" value={data.overview.emails_sent_total} sub={`+${data.overview.emails_sent_week} this week`} color="#6366f1" />
                <Stat label="Reply Rate" value={`${data.overview.reply_rate}%`} sub={`${data.overview.replies_total} total replies`} color={data.overview.reply_rate > 10 ? '#16a34a' : '#111'} />
                <Stat label="Meetings Booked" value={data.overview.meetings_booked} sub={`${data.overview.meeting_rate}% meeting rate`} color="#9333ea" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                <Stat label="Interested Replies" value={data.overview.interested_replies} sub="hot leads" color="#ea580c" />
                <Stat label="Follow-Ups Sent" value={data.overview.follow_ups_sent} sub="automated" />
                <Stat label="Auto Pipeline" value={`${data.overview.emails_sent_total + data.overview.follow_ups_sent}`} sub="total touchpoints" />
                <Stat label="Conversion" value={data.overview.emails_sent_total > 0 ? `${((data.overview.meetings_booked / data.overview.emails_sent_total) * 100).toFixed(1)}%` : '0%'} sub="signal → meeting" color="#16a34a" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                {/* Activity chart */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '18px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Activity (last 7 days)</p>
                  {data.activity.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#ccc' }}>No activity yet</p>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                      {data.activity.map(day => (
                        <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-end', height: 60 }}>
                            <div style={{ width: '100%', background: '#6366f1', borderRadius: 3, height: `${(day.signals / maxActivity) * 52}px`, minHeight: day.signals > 0 ? 4 : 0 }} title={`${day.signals} signals`} />
                            <div style={{ width: '100%', background: '#16a34a', borderRadius: 3, height: `${(day.sent / maxActivity) * 52}px`, minHeight: day.sent > 0 ? 4 : 0 }} title={`${day.sent} sent`} />
                          </div>
                          <span style={{ fontSize: 9, color: '#ccc' }}>{day.date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#6366f1', borderRadius: 2, display: 'inline-block' }}/>Signals</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: 2, display: 'inline-block' }}/>Sent</span>
                  </div>
                </div>

                {/* Signal types */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '18px 20px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Signal Types</p>
                  {Object.keys(data.signal_types).length === 0 ? (
                    <p style={{ fontSize: 12, color: '#ccc' }}>No signals yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(data.signal_types).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
                        const total = Object.values(data.signal_types).reduce((a,b) => a+b, 0);
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: '#555', textTransform: 'capitalize' }}>{type.replace('_',' ')}</span>
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ height: 5, background: '#f4f4f5', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: TYPE_COLORS[type] || '#9ca3af', borderRadius: 99 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Best signals */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '18px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 14 }}>Top Signals Sent</p>
                {data.best_signals.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#ccc' }}>No emails sent yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data.best_signals.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < data.best_signals.length-1 ? '1px solid #f5f5f4' : 'none' }}>
                        <span style={{ fontSize: 12, color: '#ccc', width: 16 }}>#{i+1}</span>
                        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: '#111' }}>{s.company_name}</span>
                        <span style={{ fontSize: 11, background: '#f4f4f5', color: '#71717a', padding: '2px 8px', borderRadius: 99 }}>{(s.signal_type||'signal').replace('_',' ')}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{s.relevance_score}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
