'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface ExperimentStats {
  total_replies: number;
  positive_replies: number;
  positive_reply_rate: number;
  by_intent: Record<string, number>;
  last_updated: string;
}

interface Experiment {
  timestamp: string;
  metric: string;
  value: number;
  is_baseline?: boolean;
  verdict?: 'keep' | 'discard';
  note?: string;
}

interface ExperimentHistory {
  experiments: Experiment[];
  baseline: Experiment | null;
  count: number;
}

export default function ExperimentsPage() {
  const [stats, setStats] = useState<ExperimentStats | null>(null);
  const [history, setHistory] = useState<ExperimentHistory | null>(null);
  const [ideas, setIdeas] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, historyRes, ideasRes] = await Promise.all([
        fetch(`${BACKEND}/api/experiments/stats`),
        fetch(`${BACKEND}/api/experiments/history`),
        fetch(`${BACKEND}/api/experiments/ideas`),
      ]);

      const [statsData, historyData, ideasData] = await Promise.all([
        statsRes.json(),
        historyRes.json(),
        ideasRes.json(),
      ]);

      setStats(statsData);
      setHistory(historyData);
      setIdeas(ideasData.ideas || '');
    } catch (e) {
      console.error('Failed to load experiment data:', e);
    } finally {
      setLoading(false);
    }
  };

  const runBenchmark = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${BACKEND}/api/experiments/run-benchmark`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        alert(`✅ Benchmark complete!\n\nReply Rate: ${data.metrics.positive_reply_rate}%\nTotal Replies: ${data.metrics.total_replies}`);
      } else {
        alert(`❌ Benchmark failed: ${data.error}`);
      }
    } catch (e) {
      alert(`❌ Error: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const intentColors: Record<string, [string, string]> = {
    interested: ['#f0fdf4', '#16a34a'],
    meeting_request: ['#eff6ff', '#3b82f6'],
    question: ['#fefce8', '#ca8a04'],
    not_interested: ['#f4f4f5', '#9ca3af'],
    objection: ['#fef2f2', '#dc2626'],
    out_of_office: ['#f5f5f4', '#78716c'],
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: '#f7f7f6' }}>
      <Sidebar onNav={() => {}} activeSection="experiments" counts={{ inbox: 0, sent: 0, replies: 0 }} />

      <div style={{ flex: 1, overflowY: 'auto', background: '#f7f7f6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Autoresearch</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-0.5px' }}>Email Optimization Experiments</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>AI-powered A/B testing to maximize your positive reply rate</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>Loading...</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Positive Reply Rate</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#111', letterSpacing: '-1px' }}>{stats?.positive_reply_rate.toFixed(1)}%</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{stats?.positive_replies} / {stats?.total_replies} replies</p>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Total Experiments</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#111', letterSpacing: '-1px' }}>{history?.count || 0}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {history?.baseline ? `Baseline: ${history.baseline.value.toFixed(1)}%` : 'No baseline yet'}
                  </p>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Status</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: stats?.total_replies && stats.total_replies > 0 ? '#16a34a' : '#dc2626', marginTop: 8 }}>
                    {stats?.total_replies && stats.total_replies > 0 ? '✅ Ready to optimize' : '⚠️ Need reply data'}
                  </p>
                  <button
                    onClick={runBenchmark}
                    disabled={running}
                    style={{
                      marginTop: 12,
                      background: '#18181b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: running ? 'not-allowed' : 'pointer',
                      opacity: running ? 0.5 : 1,
                    }}
                  >
                    {running ? 'Running...' : '▶ Run Benchmark'}
                  </button>
                </div>
              </div>

              {/* Reply Intent Breakdown */}
              {stats && stats.total_replies > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px', marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Reply Intent Breakdown</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(stats.by_intent).map(([intent, count]) => {
                      const colors = intentColors[intent] || ['#f4f4f5', '#71717a'];
                      const percentage = ((count as number / stats.total_replies) * 100).toFixed(1);
                      return (
                        <div
                          key={intent}
                          style={{
                            background: colors[0],
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: `1px solid ${colors[0]}`,
                          }}
                        >
                          <p style={{ fontSize: 11, color: colors[1], fontWeight: 600, textTransform: 'capitalize' }}>
                            {intent.replace('_', ' ')}
                          </p>
                          <p style={{ fontSize: 18, fontWeight: 700, color: colors[1], marginTop: 2 }}>
                            {count} <span style={{ fontSize: 12, fontWeight: 500 }}>({percentage}%)</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Experiment History */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Experiment History</p>
                  {history && history.count > 0 && (
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{history.count} runs</span>
                  )}
                </div>

                {!history || history.count === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                    <p style={{ fontSize: 13, marginBottom: 8 }}>No experiments yet</p>
                    <p style={{ fontSize: 12, color: '#c0c0be' }}>Run <code style={{ background: '#f4f4f5', padding: '2px 6px', borderRadius: 4 }}>/autoresearch setup</code> in OpenClaw to start</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.experiments.slice().reverse().map((exp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          background: '#fafaf9',
                          borderRadius: 10,
                          border: '1px solid #f0f0ef',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                            {exp.is_baseline && '🎯 '}
                            Reply Rate: {exp.value.toFixed(1)}%
                          </p>
                          {exp.note && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{exp.note}</p>}
                          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                            {new Date(exp.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {exp.verdict && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: exp.verdict === 'keep' ? '#f0fdf4' : '#fef2f2',
                              color: exp.verdict === 'keep' ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {exp.verdict === 'keep' ? '✅ Keep' : '❌ Discard'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ideas Backlog */}
              {ideas && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 16 }}>Optimization Ideas</p>
                  <pre
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'ui-monospace, monospace',
                      background: '#fafaf9',
                      padding: '14px',
                      borderRadius: 8,
                      overflow: 'auto',
                      maxHeight: 400,
                    }}
                  >
                    {ideas}
                  </pre>
                </div>
              )}

              {/* Quick Start Guide */}
              {stats?.total_replies === 0 && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 14,
                    padding: '20px 22px',
                    marginTop: 24,
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 12 }}>🚀 Getting Started</p>
                  <ol style={{ fontSize: 13, color: '#78350f', lineHeight: 1.8, paddingLeft: 20 }}>
                    <li>Send some test emails via the Dashboard</li>
                    <li>Wait for replies (or simulate with test data)</li>
                    <li>
                      Run:{' '}
                      <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                        openclaw chat
                      </code>
                    </li>
                    <li>
                      Initialize:{' '}
                      <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                        /autoresearch setup
                      </code>
                    </li>
                    <li>Let AI optimize your email prompts automatically!</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
