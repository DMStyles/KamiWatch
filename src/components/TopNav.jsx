import React, { useState, useEffect, useRef, useContext } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../App'
import EditProfileModal from './EditProfileModal'

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    downloads,
    user,
    setUser,
    setShowAuthModal,
    syncStatus,
    syncCloudData,
    handleSignOut,
  } = useContext(AppContext)

  const [searchVal, setSearchVal] = useState('')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  const activeDownloads = (downloads || []).filter(d => d.status === 'downloading').length

  // Global Ctrl+K / Cmd+K listener to focus omnisearch
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [profileDropdownOpen])

  // Window control functions
  const handleMinimize = () => window.electronAPI?.minimizeWindow()
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow()
    setIsMaximized(prev => !prev)
  }
  const handleClose = () => window.electronAPI?.closeWindow()

  // Handle omnisearch submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchVal.trim()
    if (trimmed) {
      navigate('/search', { state: { searchQuery: trimmed } })
    } else {
      navigate('/search')
    }
  }

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/search', label: 'Browse' },
    { to: '/manga', label: 'Manga' },
    { to: '/schedule', label: 'Schedule' },
    { to: '/downloads', label: 'Downloads', badge: activeDownloads },
    { to: '/library', label: 'Library' },
    { to: '/extensions', label: 'Extensions' },
  ]

  return (
    <>
      <header className="miruro-topnav">
        {/* Left: Brand / Logo */}
        <div className="topnav-left">
          <NavLink to="/home" className="topnav-brand" title="KamiWatch Home">
            <div className="topnav-brand-emblem">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className="topnav-brand-title">KamiWatch</span>
          </NavLink>

          {/* Navigation Links */}
          <nav className="topnav-nav">
            {navLinks.map(({ to, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
              >
                <span>{label}</span>
                {badge > 0 && (
                  <span className="topnav-link-badge">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Center: Miruro Omnisearch */}
        <div className="topnav-center">
          <form className="omnisearch-form" onSubmit={handleSearchSubmit}>
            <svg className="omnisearch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="omnisearch-input"
              placeholder="Search anime, manga..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {searchVal ? (
              <button
                type="button"
                className="omnisearch-clear"
                onClick={() => {
                  setSearchVal('')
                  searchInputRef.current?.focus()
                }}
                title="Clear"
              >
                ✕
              </button>
            ) : (
              <span className="omnisearch-kbd" title="Shortcut: Ctrl + K">
                Ctrl K
              </span>
            )}
          </form>
        </div>

        {/* Right: Sync Status + Profile / Auth + Settings + Window Controls */}
        <div className="topnav-right">
          {/* Cloud Sync Status */}
          {user && (
            <button
              className="topnav-sync-pill"
              onClick={() => syncCloudData()}
              title={syncStatus === 'syncing' ? 'Syncing to cloud...' : 'Cloud Synced. Click to force re-sync.'}
            >
              <span className={`sync-dot${syncStatus === 'syncing' ? ' spinning' : ''}`}>
                {syncStatus === 'syncing' ? '🔄' : '☁️'}
              </span>
              <span className="sync-text">
                {syncStatus === 'syncing' ? 'Syncing' : 'Synced'}
              </span>
            </button>
          )}

          {/* Profile / Login */}
          <div className="topnav-profile-container" ref={dropdownRef}>
            {user ? (
              <button
                className="topnav-profile-btn"
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                title={`Logged in as ${user.name || user.email}`}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`}
                  alt=""
                  className="topnav-profile-avatar"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`
                  }}
                />
                <span className="topnav-profile-name">{user.name || 'User'}</span>
                <svg className={`topnav-profile-chevron${profileDropdownOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ) : (
              <button
                className="topnav-signin-btn"
                onClick={() => setShowAuthModal(true)}
                title="Sign in with Google to sync history and watchlist"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && user && (
              <div className="profile-dropdown-menu">
                <div className="profile-dropdown-header">
                  <img
                    src={user.avatar}
                    alt=""
                    className="profile-dropdown-avatar"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`
                    }}
                  />
                  <div className="profile-dropdown-userinfo">
                    <p className="profile-dropdown-name">{user.name || 'User'}</p>
                    <p className="profile-dropdown-email">{user.email}</p>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileDropdownOpen(false)
                    syncCloudData()
                  }}
                >
                  <span className="dropdown-item-icon">🔄</span>
                  <span>Sync Cloud Now</span>
                </button>

                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileDropdownOpen(false)
                    setShowEditProfile(true)
                  }}
                >
                  <span className="dropdown-item-icon">✏️</span>
                  <span>Edit Profile</span>
                </button>

                <button
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileDropdownOpen(false)
                    navigate('/settings')
                  }}
                >
                  <span className="dropdown-item-icon">⚙️</span>
                  <span>Settings</span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item logout"
                  onClick={() => {
                    setProfileDropdownOpen(false)
                    handleSignOut()
                  }}
                >
                  <span className="dropdown-item-icon">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Settings Quick Icon */}
          <NavLink
            to="/settings"
            className={({ isActive }) => `topnav-icon-btn${isActive ? ' active' : ''}`}
            title="Settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </NavLink>

          {/* Window Controls Divider */}
          <div className="topnav-controls-divider" />

          {/* Electron Window Controls */}
          <div className="window-controls">
            <button className="window-btn minimize" onClick={handleMinimize} title="Minimize">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
              </svg>
            </button>
            <button className="window-btn maximize" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
            <button className="window-btn close" onClick={handleClose} title="Close">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {showEditProfile && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={(updatedUser) => {
            setUser(updatedUser)
            syncCloudData(updatedUser)
          }}
        />
      )}
    </>
  )
}
