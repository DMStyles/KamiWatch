import React, { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../App'

export default function PlayerModal() {
  const { playerModal, setPlayerModal } = useContext(AppContext)
  const videoRef = useRef()
  const iframeRef = useRef()
  const [currentUrl, setCurrentUrl] = useState(playerModal?.url || '')
  const [activeTab, setActiveTab] = useState('Online streaming')
  const [subDub, setSubDub] = useState('sub')
  const [episodesList, setEpisodesList] = useState(playerModal?.episodes || [])

  useEffect(() => {
    if (playerModal?.url) setCurrentUrl(playerModal.url)
    if (playerModal?.episodes) setEpisodesList(playerModal.episodes)
  }, [playerModal])

  // Sync Discord RPC
  useEffect(() => {
    if (playerModal?.title) {
      window.electronAPI?.discord?.updatePresence({
        details: playerModal.title,
        state: `Watching Episode ${playerModal.epNumber || 1}`,
        startTimestamp: Date.now()
      })
    }
    return () => {
      window.electronAPI?.discord?.clearPresence()
    }
  }, [playerModal?.title, playerModal?.epNumber])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setPlayerModal(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!playerModal) return null

  const isDirectVideo = currentUrl.includes('/library/stream') || 
                        currentUrl.includes('.mp4') || 
                        currentUrl.includes('.m3u8') || 
                        currentUrl.includes('.mkv')

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 2000, background: 'rgba(5, 7, 13, 0.94)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && setPlayerModal(null)}
    >
      <div
        style={{
          width: '100%', maxWidth: 1380, height: '90vh', background: '#0b0d14',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
          boxShadow: '0 25px 80px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* ── Top Header Bar (Matching Seanime Screenshot 1) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: '#07090e', borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              {playerModal.title}
            </span>
            <button
              style={{
                padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              📥 Download next episode
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Local library', 'Torrent streaming', 'Online streaming', 'AIOStreams'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px', borderRadius: 99, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: activeTab === tab ? 'var(--accent-purple, #6366f1)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'Online streaming' ? '🌐 Online streaming' : tab}
              </button>
            ))}
            <button
              onClick={() => setPlayerModal(null)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', marginLeft: 8
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Sub-Control Bar (Matching Seanime Controls) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px', background: '#0e111a', borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: 12, color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Server Alternatives */}
            {playerModal.alternatives && playerModal.alternatives.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>SERVER:</span>
                {playerModal.alternatives.map((alt, i) => {
                  const isActive = currentUrl === alt.url
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentUrl(alt.url)}
                      style={{
                        padding: '3px 10px', fontSize: 11, borderRadius: 6,
                        border: '1px solid ' + (isActive ? '#6366f1' : 'rgba(255,255,255,0.1)'),
                        background: isActive ? '#6366f1' : 'rgba(255,255,255,0.04)',
                        color: isActive ? '#fff' : '#aaa', cursor: 'pointer'
                      }}
                    >
                      {alt.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ cursor: 'pointer', opacity: 0.8 }}>⚙ Cache</span>
            <span style={{ cursor: 'pointer', opacity: 0.8 }}>🔍 Manual match</span>
            <span
              onClick={() => setSubDub(s => s === 'sub' ? 'dub' : 'sub')}
              style={{ cursor: 'pointer', color: '#818cf8', fontWeight: 700 }}
            >
              🎧 Switch to {subDub === 'sub' ? 'Dub' : 'Sub'}
            </span>
          </div>
        </div>

        {/* ── Main Viewport + Episode Sidebar Grid ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, background: '#000' }}>
          
          {/* Left: Video Player */}
          <div style={{ flex: 1, height: '100%', position: 'relative', background: '#000' }}>
            {isDirectVideo ? (
              <video
                ref={videoRef}
                src={currentUrl}
                controls
                autoPlay
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                ref={iframeRef}
                src={currentUrl}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>

          {/* Right: Vertical Episode Cards Sidebar */}
          {episodesList.length > 0 && (
            <div style={{
              width: 320, background: '#080a10', borderLeft: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column', height: '100%'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Episodes ({episodesList.length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {episodesList.map((ep, idx) => {
                  const isActive = ep.number === playerModal.epNumber
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentUrl(ep.url || currentUrl)}
                      style={{
                        display: 'flex', gap: 10, padding: 8, borderRadius: 10,
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid ' + (isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.05)'),
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 80, height: 48, borderRadius: 6, background: '#1a1d28', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <img
                          src={playerModal.cover || 'https://via.placeholder.com/80x48'}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#818cf8' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Episode {ep.number}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                          {ep.title || playerModal.title}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
