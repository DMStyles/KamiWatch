import React, { useContext, useEffect, useRef } from 'react'
import { AppContext } from '../App'

export default function PlayerModal() {
  const { playerModal, setPlayerModal } = useContext(AppContext)
  const videoRef = useRef()

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setPlayerModal(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="modal-overlay" style={{zIndex:2000}} onClick={(e) => e.target === e.currentTarget && setPlayerModal(null)}>
      <div className="player-panel">
        <div className="player-header">
          <span style={{fontWeight:700,fontSize:14}}>{playerModal.title}</span>
          <button className="modal-close" onClick={() => setPlayerModal(null)}>✕</button>
        </div>
        <iframe
          src={playerModal.url}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin"
          className="player-video"
          style={{width:'100%',height:'calc(100% - 48px)',background:'#000',border:'none',outline:'none'}}
        />
      </div>
    </div>
  )
}
