import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { AppContext } from '../App'

const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  manga: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  downloads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  extensions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
}

const navItems = [
  { to: '/home', icon: icons.home, label: 'Home' },
  { to: '/search', icon: icons.search, label: 'Search' },
  { to: '/manga', icon: icons.manga, label: 'Manga' },
  { to: '/downloads', icon: icons.downloads, label: 'Downloads' },
  { to: '/schedule', icon: icons.schedule, label: 'Schedule' },
  { to: '/library', icon: icons.library, label: 'Library' },
  { to: '/extensions', icon: icons.extensions, label: 'Extensions' },
]

export default function Sidebar() {
  const { downloads, user, setShowAuthModal } = useContext(AppContext)
  const activeDownloads = downloads.filter(d => d.status === 'downloading').length

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">K</div>
        <span className="sidebar-brand-name">KamiWatch</span>
      </div>

      {/* Nav Items */}
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          {icon}
          <span className="sidebar-label">{label}</span>
          {label === 'Downloads' && activeDownloads > 0 && (
            <span className="sidebar-badge" />
          )}
        </NavLink>
      ))}

      <div className="sidebar-spacer" />

      {/* Google User Account Badge */}
      <div style={{ padding: '0 8px', marginBottom: 6 }}>
        {user ? (
          <div
            onClick={() => setShowAuthModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            title={`Logged in as ${user.email}`}
          >
            <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1d28' }} />
            <div className="sidebar-label" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>☁️ Synced</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 12, background: 'rgba(66, 133, 244, 0.12)', border: '1px solid rgba(66, 133, 244, 0.3)',
              color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 700
            }}
          >
            <span style={{ fontSize: 14 }}>🌐</span>
            <span className="sidebar-label">Google Sync</span>
          </button>
        )}
      </div>

      <NavLink
        to="/settings"
        className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
      >
        {icons.settings}
        <span className="sidebar-label">Settings</span>
      </NavLink>
    </nav>
  )
}
