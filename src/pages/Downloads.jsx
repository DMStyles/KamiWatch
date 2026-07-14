import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../App'

const API = 'http://localhost:8765'

export default function Downloads() {
  const { downloads, setDownloads } = useContext(AppContext)

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API}/download/all`)
        const data = await res.json()
        setDownloads(data)
      } catch {}
    }, 1000)
    return () => clearInterval(poll)
  }, [])

  const cancel = async (id) => {
    await fetch(`${API}/download/${id}`, { method: 'DELETE' })
  }

  const statusColor = { downloading: 'var(--accent-light)', finished: 'var(--success)', error: 'var(--error)', cancelled: 'var(--text-muted)', starting: 'var(--cyan)' }

  return (
    <div className="downloads-page">
      <div className="page-header">
        <h1 className="page-title">Downloads</h1>
        <span style={{color:'var(--text-muted)',fontSize:13}}>{downloads.filter(d=>d.status==='downloading').length} active</span>
      </div>

      {downloads.length === 0 ? (
        <div className="empty-state">
          <span style={{fontSize:56}}>📥</span>
          <h3>No downloads yet</h3>
          <p>Search for an anime and start downloading episodes</p>
        </div>
      ) : (
        <div className="downloads-list">
          {downloads.map((dl) => (
            <div key={dl.id} className="download-card">
              <div className="download-card-left">
                <div className="download-info">
                  <span className="download-title">{dl.title}</span>
                  <span className="download-ep">{dl.episode}</span>
                </div>
                <div className="download-status" style={{color: statusColor[dl.status] || 'var(--text-muted)'}}>
                  {dl.status === 'downloading' ? `${Math.round(dl.progress)}% · ${dl.speed} · ETA ${dl.eta}` : dl.status}
                </div>
                {dl.status === 'downloading' && (
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${dl.progress}%` }} />
                  </div>
                )}
              </div>
              <div className="download-card-right">
                {dl.status === 'finished' && (
                  <button className="btn btn-secondary" style={{fontSize:12,padding:'5px 12px'}} onClick={() => window.electronAPI?.openFolder(dl.output_path)}>
                    📂 Open
                  </button>
                )}
                {(dl.status === 'downloading' || dl.status === 'starting') && (
                  <button className="btn btn-ghost" style={{fontSize:12}} onClick={() => cancel(dl.id)}>✕ Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
