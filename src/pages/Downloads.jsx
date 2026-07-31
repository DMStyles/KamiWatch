import React, { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../App'

const API = 'http://localhost:8642'

export default function Downloads() {
  const { downloads, setDownloads } = useContext(AppContext)
  const [confirmCancelId, setConfirmCancelId] = useState(null)
  const isPollRunning = useRef(false)

  useEffect(() => {
    // FIX: Guard overlapping intervals — skip if previous fetch is still running
    const poll = setInterval(async () => {
      if (isPollRunning.current) return
      isPollRunning.current = true
      try {
        const res = await fetch(`${API}/download/all`)
        const data = await res.json()
        setDownloads(data)
      } catch {}
      finally {
        isPollRunning.current = false
      }
    }, 1500)
    return () => clearInterval(poll)
  }, [])

  const cancel = async (id) => {
    setConfirmCancelId(null)
    try {
      await fetch(`${API}/download/${id}`, { method: 'DELETE' })
      setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'cancelled' } : d))
    } catch {}
  }

  const statusColor = {
    downloading: 'var(--accent-light)',
    finished: 'var(--success)',
    error: 'var(--error)',
    cancelled: 'var(--text-muted)',
    starting: 'var(--cyan)'
  }

  return (
    <div className="downloads-page">
      {/* Confirmation dialog for cancel */}
      {confirmCancelId && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setConfirmCancelId(null)}
        >
          <div
            style={{
              background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
              padding: '28px 32px', maxWidth: 360, width: '90%', textAlign: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Cancel Download?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              This will stop the current download. Partial files may be left on disk.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmCancelId(null)}>Keep Going</button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--error)' }}
                onClick={() => cancel(confirmCancelId)}
              >
                ✕ Cancel Download
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Downloads</h1>
        <span style={{color:'var(--text-muted)',fontSize:13}}>
          {(downloads || []).filter(d => d.status === 'downloading').length} active
        </span>
      </div>

      {(downloads || []).length === 0 ? (
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
                  {dl.status === 'downloading'
                    ? `${Math.round(dl.progress)}% · ${dl.speed} · ETA ${dl.eta}`
                    : dl.status === 'error' ? `❌ ${dl.error || 'Download failed'}` : dl.status}
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
                  <button className="btn btn-ghost" style={{fontSize:12}} onClick={() => setConfirmCancelId(dl.id)}>✕ Cancel</button>
                )}
                {dl.status === 'error' && (
                  <span style={{ fontSize: 11, color: 'var(--error)' }}>Failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
