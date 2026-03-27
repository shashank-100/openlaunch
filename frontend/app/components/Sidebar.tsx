'use client';

const NAV = [
  { label: 'Inbox',   href: '/dashboard', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { label: 'Sent',    href: '/dashboard', icon: 'm22 2-7 20-4-9-9-4 20-7Zm0 0-9 9' },
  { label: 'Replies', href: '/dashboard', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { label: 'Chat',    href: '/dashboard', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
];

interface Props {
  /** Pass section buttons instead of links for dashboard */
  children?: React.ReactNode;
  onNav?: (label: string) => void;
  activeSection?: string;
  counts?: Record<string, number>;
  settingsActive?: boolean;
}

export default function Sidebar({ onNav, activeSection, counts = {}, settingsActive }: Props) {
  return (
    <aside style={{ width: 210, background: '#18181b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>Geodo</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Signal outreach</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(({ label, href, icon }) => {
          const active = activeSection === label.toLowerCase();
          const count  = counts[label.toLowerCase()] || 0;
          const Tag    = onNav ? 'button' : 'a';
          const extra  = onNav
            ? { onClick: () => onNav(label.toLowerCase()), type: 'button' as const }
            : { href };
          return (
            <Tag key={label} {...extra} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.38)',
              fontSize: 13.5, fontWeight: active ? 500 : 400,
              textDecoration: 'none', textAlign: 'left', transition: 'all 0.12s',
            }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }}>
                <path d={icon}/>
              </svg>
              <span style={{ flex: 1 }}>{label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                  background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                }}>{count}</span>
              )}
            </Tag>
          );
        })}
      </nav>

      {/* Settings */}
      <div style={{ padding: '10px 8px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/settings" style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8,
          background: settingsActive ? 'rgba(255,255,255,0.09)' : 'transparent',
          color: settingsActive ? '#fff' : 'rgba(255,255,255,0.38)',
          textDecoration: 'none', fontSize: 13.5, fontWeight: settingsActive ? 500 : 400,
        }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: settingsActive ? 1 : 0.6 }}>
            <circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.05-6.95-1.41 1.41M7.46 16.54l-1.41 1.41M17 17l1.41 1.41M7.46 7.46 6.05 6.05"/>
          </svg>
          Settings
        </a>
      </div>
    </aside>
  );
}
