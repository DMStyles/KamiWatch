import React from 'react'

export default function TitleBar() {
  const minimize = () => window.electronAPI?.minimizeWindow()
  const maximize = () => window.electronAPI?.maximizeWindow()
  const close = () => window.electronAPI?.closeWindow()

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <span className="titlebar-logo">AniVault</span>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={minimize} title="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="0" y="5.5" width="12" height="1" fill="currentColor"/></svg>
        </button>
        <button className="titlebar-btn" onClick={maximize} title="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
        </button>
        <button className="titlebar-btn close" onClick={close} title="Close">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
