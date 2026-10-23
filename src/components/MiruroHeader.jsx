import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

/**
 * Miruro-style Fixed Header Bar.
 * Sits at top from left-14 (offset by slim rail) with center search box,
 * cloud sync pill, and native Electron window controls.
 */
export default function MiruroHeader() {
  const navigate = useNavigate()
  const { user, syncStatus, syncCloudData } = useContext(AppContext)

  const [searchVal, setSearchVal] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const searchInputRef = useRef(null)

  // Global Ctrl+K / Cmd+K listener
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

  const handleMinimize = () => window.electronAPI?.minimizeWindow()
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow()
    setIsMaximized(prev => !prev)
  }
  const handleClose = () => window.electronAPI?.closeWindow()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchVal.trim()
    if (trimmed) {
      navigate('/search', { state: { searchQuery: trimmed } })
    } else {
      navigate('/search')
    }
  }

  return (
    <header className="miruro-site-header">
      {/* Background glass layer */}
      <div className="header-glass-backdrop" />

      <div className="header-inner">
        {/* Left: Desktop Window Title / Brand */}
        <div className="header-left">
          <span className="header-brand-title">KamiWatch</span>
        </div>

        {/* Center: Miruro Search Input Form */}
        <div className="header-center">
          <form className="miruro-search-form" onSubmit={handleSearchSubmit}>
            <div className="miruro-search-input-wrap">
              <input
                ref={searchInputRef}
                type="text"
                className="miruro-search-input"
                placeholder="Search anime..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                maxLength={200}
                autoComplete="off"
              />
              {searchVal ? (
                <button
                  type="button"
                  className="miruro-search-clear"
                  onClick={() => {
                    setSearchVal('')
                    searchInputRef.current?.focus()
                  }}
                  title="Clear"
                >
                  ✕
                </button>
              ) : (
                <span className="miruro-search-shortcut" title="Shortcut: Ctrl+K">
                  Ctrl K
                </span>
              )}
            </div>

            <button type="submit" className="miruro-search-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-btn-icon">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right: Cloud Sync Status + Window Controls */}
        <div className="header-right">
          {user && (
            <button
              className="header-sync-pill"
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

          {/* Window Controls */}
          <div className="header-window-controls">
            <button className="win-btn minimize" onClick={handleMinimize} title="Minimize">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
              </svg>
            </button>
            <button className="win-btn maximize" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
            <button className="win-btn close" onClick={handleClose} title="Close">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
