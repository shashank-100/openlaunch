'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import Sidebar from '../components/Sidebar';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-production-d5926.up.railway.app';

interface Signal {
  id: string;
  company_name: string;
  signal_type: string;
  signal_summary: string;
  relevance_score: number;
  email_subject: string;
  email_body: string;
  recipient_email: string | null;
  approval_status: string;
  sent_at: string | null;
  created_at: string;
  source_url: string | null;
}

interface Reply {
  id: string;
  outreach_id: string;
  from_email: string;
  from_name: string | null;
  reply_body: string;
  reply_intent: string;
  received_at: string;
  response_body: string | null;
  response_approved: boolean;
  response_sent_at: string | null;
  signal_outreach?: { company_name: string; email_subject: string };
}

type Section = 'inbox' | 'sent' | 'replies' | 'chat';

const SIG_COLORS: Record<string, [string, string]> = {
  funding:        ['#eff6ff', '#3b82f6'],
  hiring:         ['#f0fdf4', '#16a34a'],
  product_launch: ['#faf5ff', '#9333ea'],
  partnership:    ['#fff7ed', '#ea580c'],
  expansion:      ['#f0fdfa', '#0d9488'],
  general:        ['#f4f4f5', '#71717a'],
};

const INTENT_COLORS: Record<string, [string, string]> = {
  interested:      ['#f0fdf4', '#16a34a'],
  meeting_request: ['#eff6ff', '#3b82f6'],
  question:        ['#fefce8', '#ca8a04'],
  not_interested:  ['#f4f4f5', '#9ca3af'],
  objection:       ['#fef2f2', '#dc2626'],
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 500, background: bg, color, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: '0 14px' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f0f0ef' }}>
          <div style={{ height: 13, width: '60%', background: '#f0f0ef', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 11, width: '90%', background: '#f7f7f6', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 20, width: 60, background: '#f7f7f6', borderRadius: 99 }} />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [section, setSection]   = useState<Section>('inbox');
  const [signals, setSignals]   = useState<Signal[]>([]);
  const [replies, setReplies]   = useState<Reply[]>([]);
  const [counts, setCounts]     = useState({ inbox: 0, sent: 0, replies: 0 });
  const [selected, setSelected] = useState<Signal | Reply | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody]       = useState('');
  const [editEmail, setEditEmail]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [acting, setActing]   = useState(false);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  const loadAll = useCallback(async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${BACKEND}/api/signal-outreach?status=pending`),
        fetch(`${BACKEND}/api/signal-outreach?status=approved`),
        fetch(`${BACKEND}/api/signal-replies`),
      ]);
      const [p, s, rep] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      const inbox   = p.signals   || [];
      const sent    = s.signals   || [];
      const repList = rep.replies || [];
      setCounts({ inbox: inbox.length, sent: sent.length, replies: repList.length });
      setSignals(section === 'inbox' ? inbox : sent);
      setReplies(repList);
    } finally { setLoading(false); }
  }, [section]);

  useEffect(() => { loadAll(); }, [section]);
  useEffect(() => { const t = setInterval(loadAll, 60000); return () => clearInterval(t); }, [loadAll]);

  async function approve(sig: Signal) {
    if (!sig.recipient_email) {
      setEditing(true);
      setEditSubject(sig.email_subject);
      setEditBody(sig.email_body);
      setEditEmail('');
      showToast('Add recipient email first', false);
      return;
    }
    setActing(true);
    const res  = await fetch(`${BACKEND}/api/signal-outreach/${sig.id}/approve`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const sent_at = data.sent_at || new Date().toISOString();
      const updated = { ...sig, approval_status: 'approved', sent_at };
      setSelected(updated);
      setSignals(prev => prev.map(s => s.id === sig.id ? updated : s));
      showToast(`Sent to ${sig.recipient_email}`);
      loadAll();
    } else showToast(data.detail || 'Send failed', false);
    setActing(false);
  }

  async function reject(sig: Signal) {
    setActing(true);
    await fetch(`${BACKEND}/api/signal-outreach/${sig.id}/reject`, { method: 'POST' });
    showToast('Skipped');
    setSelected(null);
    loadAll();
    setActing(false);
  }

  async function saveEdit(sig: Signal) {
    setSaving(true);
    const body = { email_subject: editSubject, email_body: editBody, recipient_email: editEmail || sig.recipient_email };
    await fetch(`${BACKEND}/api/signal-outreach/${sig.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const updated = { ...sig, ...body } as Signal;
    setSelected(updated);
    setSignals(prev => prev.map(s => s.id === sig.id ? updated : s));
    setEditing(false);
    setSaving(false);
    showToast('Saved');
  }

  const isSignal = (x: any): x is Signal => 'email_subject' in x;
  const items    = section === 'replies' ? replies : signals;

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({ transport: new TextStreamChatTransport({ api: '/api/chat' }) });
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", background: '#f7f7f6' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: toast.ok ? '#18181b' : '#dc2626', color: '#fff',
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}

      <Sidebar
        onNav={(label) => { setSection(label as Section); setSelected(null); setEditing(false); }}
        activeSection={section}
        counts={{ inbox: counts.inbox, sent: counts.sent, replies: counts.replies }}
      />

      {/* ── CHAT VIEW ── */}
      {section === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7f7f6' }}>
          <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #f0f0ef', background: '#fff', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>AI Sales Assistant</p>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.4px' }}>Chat</h1>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560, margin: '0 auto', width: '100%' }}>
                <p style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Ask me anything about your pipeline:</p>
                {['Which signals should I focus on?', 'Improve this email draft', "What's my reply rate?", 'Suggest outreach strategy'].map(s => (
                  <button key={s} onClick={() => sendMessage({ text: s })}
                    style={{ textAlign: 'left', background: '#fff', border: '1px solid #ececea', borderRadius: 10, padding: '10px 14px', color: '#555', fontSize: 13, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                maxWidth: 620, padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.7,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#6366f1' : '#fff',
                color: m.role === 'user' ? '#fff' : '#111',
                border: m.role === 'user' ? 'none' : '1px solid #ececea',
                whiteSpace: 'pre-wrap',
              }}>
                {m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || (m as any).content || ''}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #ececea', borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>···</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) { sendMessage({ text: chatInput }); setChatInput(''); } }}
            style={{ padding: '12px 24px 16px', borderTop: '1px solid #f0f0ef', background: '#fff', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about your pipeline..."
              style={{ flex: 1, background: '#f7f7f6', border: '1px solid #ececea', borderRadius: 10, padding: '10px 14px', color: '#111', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" disabled={isLoading || !chatInput.trim()} style={{
              background: '#6366f1', border: 'none', borderRadius: 10, padding: '10px 16px',
              color: '#fff', cursor: 'pointer', fontSize: 14, opacity: (!chatInput.trim() || isLoading) ? 0.4 : 1,
            }}>↑</button>
          </form>
        </div>
      )}

      {/* ── LIST ── */}
      {section !== 'chat' && (
        <div style={{ width: 310, background: '#fff', borderRight: '1px solid #ececea', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <Skeleton /> : items.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f7f7f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#d1d5db' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: '#c0c0be', lineHeight: 1.7 }}>
                  {section === 'inbox' ? <>No signals yet.<br/>Scanner runs every 2 hrs.</> :
                   section === 'sent'  ? 'No emails sent yet.' : 'No replies yet.'}
                </p>
              </div>
            ) : items.map((item: any) => {
              const isSig  = isSignal(item);
              const active = selected && 'id' in selected && selected.id === item.id;
              const sc     = isSig ? (SIG_COLORS[item.signal_type] || SIG_COLORS.general) : null;
              const ic     = !isSig ? (INTENT_COLORS[item.reply_intent] || INTENT_COLORS.not_interested) : null;
              return (
                <button key={item.id}
                  onClick={() => { setSelected(item); setEditing(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '13px 16px',
                    borderBottom: '1px solid #f7f7f6', border: 'none', cursor: 'pointer',
                    background: active ? '#fafaf9' : '#fff',
                    borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111', letterSpacing: '-0.1px', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isSig ? item.company_name : (item.signal_outreach?.company_name || item.from_email)}
                    </span>
                    <span style={{ fontSize: 11, color: '#c8c8c6', flexShrink: 0 }}>
                      {timeAgo(isSig ? item.created_at : item.received_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
                    {isSig ? item.signal_summary : item.reply_body?.substring(0, 75) + '…'}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {isSig ? (
                      <>
                        <Badge label={(item.signal_type?.split('|')[0] || 'signal').replace('_', ' ')} bg={sc![0]} color={sc![1]} />
                        <Badge label={`${item.relevance_score}/10`} bg="#f4f4f5" color="#71717a" />
                        {!item.recipient_email && <Badge label="No email" bg="#fef2f2" color="#dc2626" />}
                      </>
                    ) : (
                      <Badge label={(item.reply_intent || 'reply').replace('_', ' ')} bg={ic![0]} color={ic![1]} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DETAIL ── */}
      {section !== 'chat' && (
        <div style={{ flex: 1, overflowY: 'auto', background: '#f7f7f6' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: '#ececea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <p style={{ fontSize: 13.5, color: '#c0c0be' }}>Select a signal to review</p>
            </div>

          ) : isSignal(selected) ? (
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '28px 20px' }}>

              {/* Company header */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {selected.company_name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>{selected.company_name}</h2>
                      {(() => { const c = SIG_COLORS[selected.signal_type] || SIG_COLORS.general; return <Badge label={(selected.signal_type || 'signal').replace('_', ' ')} bg={c[0]} color={c[1]} />; })()}
                      <Badge label={`${selected.relevance_score}/10`} bg="#f4f4f5" color="#71717a" />
                    </div>
                    {selected.source_url && (
                      <a href={selected.source_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        View source
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>
                      </a>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.75 }}>{selected.signal_summary}</p>
              </div>

              {/* Recipient */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '14px 22px', marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>To</p>
                {editing ? (
                  <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    placeholder="prospect@company.com" autoFocus
                    style={{ width: '100%', border: '1.5px solid #6366f1', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none', color: '#111', background: '#fafaf9' }} />
                ) : (
                  <p style={{ fontSize: 13.5, color: selected.recipient_email ? '#111' : '#dc2626', fontWeight: selected.recipient_email ? 400 : 500 }}>
                    {selected.recipient_email || '⚠ No email — click Edit to add'}
                  </p>
                )}
              </div>

              {/* Email draft */}
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '12px 22px', borderBottom: '1px solid #f4f4f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Email Draft</p>
                  {['pending', 'edited'].includes(selected.approval_status) && (
                    <button
                      onClick={() => { setEditing(!editing); setEditSubject(selected.email_subject); setEditBody(selected.email_body); setEditEmail(selected.recipient_email || ''); }}
                      style={{ fontSize: 12.5, color: editing ? '#dc2626' : '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '3px 0' }}>
                      {editing ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                {editing ? (
                  <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Subject</label>
                      <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none', color: '#111' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Body</label>
                      <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={9}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none', resize: 'none', lineHeight: 1.75, color: '#111', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>
                    <button onClick={() => saveEdit(selected)} disabled={saving}
                      style={{ alignSelf: 'flex-start', background: '#18181b', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '18px 22px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 14, letterSpacing: '-0.1px' }}>{selected.email_subject}</p>
                    <p style={{ fontSize: 13.5, color: '#4b5563', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{selected.email_body}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {['pending', 'edited'].includes(selected.approval_status) && !editing && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => approve(selected)} disabled={acting}
                    style={{ flex: 1, background: acting ? '#52525b' : '#18181b', color: '#fff', border: 'none', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: acting ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                    {acting ? 'Sending…' : '↑ Send Email'}
                  </button>
                  <button onClick={() => reject(selected)} disabled={acting}
                    style={{ padding: '13px 22px', background: '#fff', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                    Skip
                  </button>
                </div>
              )}

              {selected.approval_status === 'approved' && (
                <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, color: '#16a34a', fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Email sent {selected.sent_at ? timeAgo(selected.sent_at) : ''}
                </div>
              )}
            </div>

          ) : (
            // Reply detail
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '28px 20px' }}>
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '20px 22px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px', flex: 1 }}>
                    {(selected as Reply).signal_outreach?.company_name || (selected as Reply).from_email}
                  </h2>
                  {(selected as Reply).reply_intent && (() => {
                    const c = INTENT_COLORS[(selected as Reply).reply_intent] || INTENT_COLORS.not_interested;
                    return <Badge label={(selected as Reply).reply_intent.replace('_', ' ')} bg={c[0]} color={c[1]} />;
                  })()}
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>{(selected as Reply).from_email} · {timeAgo((selected as Reply).received_at)}</p>
              </div>

              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', padding: '18px 22px', marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Their Reply</p>
                <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{(selected as Reply).reply_body}</p>
              </div>

              {(selected as Reply).response_body && (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ebebea', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 22px', borderBottom: '1px solid #f4f4f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Auto-Response Sent</p>
                    {(selected as Reply).response_approved && (
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        Sent
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '18px 22px' }}>
                    <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{(selected as Reply).response_body}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
