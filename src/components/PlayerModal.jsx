import React, { useContext, useEffect, useRef } from 'react'
import { AppContext } from '../App'

export default function PlayerModal() {
  const { playerModal, setPlayerModal } = useContext(AppContext)
  const videoRef = useRef()
  const [currentUrl, setCurrentUrl] = React.useState(playerModal.url)

  useEffect(() => {
    setCurrentUrl(playerModal.url)
  }, [playerModal.url])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setPlayerModal(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="modal-overlay" style={{zIndex:2000}} onClick={(e) => e.target === e.currentTarget && setPlayerModal(null)}>
      <div className="player-panel">
        <div className="player-header" style={{display:'flex', alignItems:'center', gap: 12}}>
          <span style={{fontWeight:700,fontSize:14, flex:1}}>{playerModal.title}</span>
          
          {playerModal.alternatives && playerModal.alternatives.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Server:</span>
              {playerModal.alternatives.map((alt, i) => {
                const isActive = currentUrl === alt.url
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentUrl(alt.url)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: 6,
                      border: '1px solid ' + (isActive ? 'var(--accent, #6366f1)' : 'rgba(255,255,255,0.15)'),
                      background: isActive ? 'var(--accent, #6366f1)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : '#ccc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 8, color: isActive ? '#fff' : '#888' }}>●</span>
                    {alt.name}
                  </button>
                )
              })}
            </div>
          )}

          <button className="modal-close" onClick={() => setPlayerModal(null)}>✕</button>
        </div>
        {(() => {
          const isDirectVideo = currentUrl.includes('/library/stream') || 
                                currentUrl.includes('.mp4') || 
                                currentUrl.includes('.m3u8') || 
                                currentUrl.includes('.mkv');

          if (isDirectVideo) {
            return (
              <video
                ref={videoRef}
                src={currentUrl}
                controls
                autoPlay
                className="player-video"
                style={{ width: '100%', height: 'calc(100% - 48px)', background: '#000', border: 'none', outline: 'none' }}
              />
            );
          }

          return (
            <iframe
              src={currentUrl}
              allowFullScreen
              className="player-video"
              style={{ width: '100%', height: 'calc(100% - 48px)', background: '#000', border: 'none', outline: 'none' }}
            />
          );
        })()}
      </div>
    </div>
  )
}
