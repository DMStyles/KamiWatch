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
            <select 
              className="settings-select" 
              style={{padding: '4px 8px', fontSize: 12, height: 28, width: 'auto'}}
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              title="Change Server (If current server is broken/deleted)"
            >
              {playerModal.alternatives.map((alt, i) => (
                <option key={i} value={alt.url}>{alt.name}</option>
              ))}
            </select>
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
