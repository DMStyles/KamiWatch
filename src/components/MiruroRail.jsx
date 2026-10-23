import React, { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

/**
 * Miruro-style Slim Left Icon Rail (w-14 / 56px).
 * Features Miruro cat mascot at top, navigation icons matching the screenshots,
 * and profile/settings at bottom.
 */
export default function MiruroRail() {
  const navigate = useNavigate()
  const { downloads, user, setShowAuthModal } = useContext(AppContext)

  const activeDownloads = (downloads || []).filter(d => d.status === 'downloading').length

  const navItems = [
    {
      to: '/home',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      )
    },
    {
      to: '/trending',
      label: 'Trending',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      )
    },
    {
      to: '/discover',
      label: 'Discover',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
        </svg>
      )
    },
    {
      to: '/search',
      label: 'Search',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      to: '/schedule',
      label: 'Schedule',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      to: '/library',
      label: 'Library',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      to: '/manga',
      label: 'Manga',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      to: '/downloads',
      label: 'Downloads',
      badge: activeDownloads,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )
    },
    {
      to: '/extensions',
      label: 'Extensions',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
  ]

  return (
    <aside className="miruro-site-rail" title="Navigation">
      {/* Top: Miruro-Style Cat Mascot */}
      <NavLink to="/home" className="rail-logo-btn" title="KamiWatch Home">
        <div className="rail-mascot">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 4-2.26 5.5-1.76.7 1.63.2 3.65-.5 5 1.34 1.55 2 3.5 2 5.5 0 5-4.03 9-9 9s-9-4-9-9c0-2 .66-3.95 2-5.5-.7-1.35-1.2-3.37-.5-5 1.5-.5 3.72-.24 5.5 1.76.65-.17 1.33-.26 2-.26z" />
            <circle cx="9" cy="13" r="1.2" fill="currentColor" />
            <circle cx="15" cy="13" r="1.2" fill="currentColor" />
            <path d="M11 16c.3.3.6.5 1 .5s.7-.2 1-.5" />
          </svg>
        </div>
      </NavLink>

      {/* Nav Icons Column */}
      <nav className="rail-nav-list">
        {navItems.map(({ to, label, icon, badge, state }) => (
          <NavLink
            key={label}
            to={to}
            state={state}
            className={({ isActive }) => `rail-nav-link${isActive ? ' active' : ''}`}
            title={label}
          >
            {icon}
            {badge > 0 && (
              <span className="rail-badge">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
            <span className="rail-tooltip">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="rail-spacer" />

      {/* Bottom: Settings & Profile Avatar */}
      <div className="rail-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `rail-nav-link${isActive ? ' active' : ''}`}
          title="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rail-icon">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="rail-tooltip">Settings</span>
        </NavLink>

        {user ? (
          <div
            className="rail-profile-item"
            onClick={() => navigate('/settings')}
            title={`Logged in as ${user.name || user.email}`}
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`}
              alt=""
              className="rail-avatar"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`
              }}
            />
            <span className="rail-tooltip">{user.name || 'Profile'}</span>
          </div>
        ) : (
          <button
            className="rail-profile-item"
            onClick={() => setShowAuthModal(true)}
            title="Sign in with Google"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="rail-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span className="rail-tooltip">Sign In</span>
          </button>
        )}
      </div>
    </aside>
  )
}
