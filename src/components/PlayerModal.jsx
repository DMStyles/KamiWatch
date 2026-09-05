import React, { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../App'
import Hls from 'hls.js'

export default function PlayerModal() {
  const { playerModal, setPlayerModal } = useContext(AppContext)
  const videoRef = useRef()
  const iframeRef = useRef()
  const hlsRef = useRef(null)
  const [currentUrl, setCurrentUrl] = useState(playerModal?.url || '')
  const [activeTab, setActiveTab] = useState('online')
  const [subDub, setSubDub] = useState('sub')
  const [episodesList, setEpisodesList] = useState(playerModal?.episodes || [])
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    if (playerModal?.url) { setCurrentUrl(playerModal.url); setVideoError(false) }
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
    return () => { window.electronAPI?.discord?.clearPresence() }
  }, [playerModal?.title, playerModal?.epNumber])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setPlayerModal(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // More robust video detection using URL extension + pathname
  const urlPath = (() => { try { return new URL(currentUrl).pathname } catch { return currentUrl } })()
  const isHls = currentUrl.includes('.m3u8') || currentUrl.includes('m3u8')
  const isDirectVideo = isHls || ['/library/stream', '.mp4', '.mkv', '.webm', '.ogg']
    .some(s => urlPath.includes(s)) || currentUrl.startsWith('blob:') || currentUrl.startsWith('file:')

  // HLS / HTML5 Video player setup
  useEffect(() => {
    if (!videoRef.current || !currentUrl || activeTab !== 'online' || !isDirectVideo) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })
        hlsRef.current = hls
        hls.loadSource(currentUrl)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn('[Hls.js Error]', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError()
                break
              default:
                hls.destroy()
                setVideoError(true)
                break
            }
          }
        })
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = currentUrl
        videoRef.current.play().catch(() => {})
      }
    } else {
      videoRef.current.src = currentUrl
      videoRef.current.play().catch(() => {})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [currentUrl, isDirectVideo, isHls, activeTab])

  if (!playerModal) return null

  const handleSelectEpisode = async (ep) => {
    setVideoError(false)
    let url = ep.url
    let alternatives = playerModal.alternatives
    if (playerModal?.source?.startsWith('ext_')) {
      const extId = playerModal.source.replace('ext_', '')
      try {
        const srvRes = await window.electronAPI?.extensions?.callProvider(extId, 'findEpisodeServer', [ep, 'Auto'])
        const src = srvRes?.result?.videoSources?.[0]
        if (src?.url) url = src.url
      } catch (err) {
        console.error('Failed to resolve extension episode:', err)
      }
    } else if (url && url.startsWith('anikoto:')) {
      const dataIds = url.split('anikoto:')[1]
      try {
        const res = await fetch(`http://localhost:8642/anikoto/resolve?data_ids=${encodeURIComponent(dataIds)}&sub_dub=${subDub}`)
        const data = await res.json()
        if (data.url) url = data.url
        if (data.alternatives) alternatives = data.alternatives
      } catch {}
    }
    setCurrentUrl(url)
    setPlayerModal(prev => ({
      ...prev,
      title: `${prev.title.split(' - Episode')[0]} - Episode ${ep.number}`,
      epNumber: ep.number,
      url,
      alternatives,
      dataIds: ep.url?.startsWith('anikoto:') ? ep.url.split('anikoto:')[1] : prev.dataIds
    }))
  }

  const handleSwitchSubDub = async (newType) => {
    setSubDub(newType)
    if (playerModal.dataIds) {
      try {
        const res = await fetch(`http://localhost:8642/anikoto/resolve?data_ids=${encodeURIComponent(playerModal.dataIds)}&sub_dub=${newType}`)
        const data = await res.json()
        if (data.url) {
          setCurrentUrl(data.url)
          setVideoError(false)
        }
      } catch {}
    }
  }

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'online':
        return (
          <div style={{ flex: 1, height: '100%', position: 'relative', background: '#000' }}>
            {videoError ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, color:'rgba(255,255,255,0.6)' }}>
                <span style={{ fontSize: 48 }}>⚠️</span>
                <p style={{ fontSize: 14 }}>Stream failed to load.</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Try switching to a different server below.</p>
              </div>
            ) : isDirectVideo ? (
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setVideoError(true)}
              />
            ) : (
              <iframe
                ref={iframeRef}
                src={currentUrl}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ width: '100%', height: '100%', border: 'none' }}
                onError={() => setVideoError(true)}
              />
            )}
          </div>
        )

      case 'local':
        return (
          <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'rgba(255,255,255,0.5)', background:'#060810' }}>
            <span style={{ fontSize: 52 }}>📂</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Local Library</p>
            <p style={{ fontSize: 13, textAlign:'center', maxWidth: 320, lineHeight: 1.6 }}>
              Play a downloaded episode from your local files. Go to <strong>Downloads</strong> and click <strong>📂 Open</strong> to browse your downloaded episodes.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.electronAPI?.selectDownloadFolder?.().then(p => p && setCurrentUrl(`file://${p}`))}
            >
              📁 Browse Local Files
            </button>
          </div>
        )

      case 'torrent':
        return (
          <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'rgba(255,255,255,0.5)', background:'#060810' }}>
            <span style={{ fontSize: 52 }}>🧲</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Torrent Streaming</p>
            <p style={{ fontSize: 13, textAlign:'center', maxWidth: 320, lineHeight: 1.6 }}>
              Torrent-based streaming is not yet supported. This feature is coming soon in a future update.
            </p>
            <span style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>Coming Soon</span>
          </div>
        )

      case 'aiostreams':
        return (
          <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, color:'rgba(255,255,255,0.5)', background:'#060810' }}>
            <span style={{ fontSize: 52 }}>🔗</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>AIOStreams</p>
            <p style={{ fontSize: 13, textAlign:'center', maxWidth: 320, lineHeight: 1.6 }}>
              AIOStreams integration lets you aggregate streams from multiple providers. Configure your AIOStreams API key in Settings to enable this.
            </p>
            <button className="btn btn-secondary" onClick={() => setPlayerModal(null)}>⚙️ Go to Settings</button>
          </div>
        )

      default:
        return null
    }
  }

  const tabs = [
    { id: 'online', label: '🌐 Online' },
    { id: 'local', label: '📂 Local Library' },
    { id: 'torrent', label: '🧲 Torrent' },
    { id: 'aiostreams', label: '🔗 AIOStreams' },
  ]

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 2000, background: 'rgba(5, 7, 13, 0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
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
        {/* ── Top Header Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: '#07090e', borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>
              {playerModal.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setVideoError(false) }}
                style={{
                  padding: '6px 14px', borderRadius: 99, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--accent-purple, #6366f1)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
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

        {/* ── Server & Sub/Dub Controls (only for online tab) ── */}
        {activeTab === 'online' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px', background: '#0e111a', borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: 12, color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {playerModal.alternatives && playerModal.alternatives.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>SERVER:</span>
                  {playerModal.alternatives.map((alt, i) => {
                    const isActive = currentUrl === alt.url
                    return (
                      <button
                        key={i}
                        onClick={() => { setCurrentUrl(alt.url); setVideoError(false) }}
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
              <span
                onClick={() => handleSwitchSubDub(subDub === 'sub' ? 'dub' : 'sub')}
                style={{ cursor: 'pointer', color: '#818cf8', fontWeight: 700 }}
              >
                🎧 Switch to {subDub === 'sub' ? 'Dub' : 'Sub'}
              </span>
            </div>
          </div>
        )}

        {/* ── Main Content + Episode Sidebar ── */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {renderTabContent()}

          {/* Right: Vertical Episode Cards Sidebar (online tab only) */}
          {activeTab === 'online' && episodesList.length > 0 && (
            <div style={{
              width: 280, background: '#080a10', borderLeft: '1px solid rgba(255,255,255,0.07)',
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
                      onClick={() => handleSelectEpisode(ep)}
                      style={{
                        display: 'flex', gap: 10, padding: 8, borderRadius: 10,
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid ' + (isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.05)'),
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 80, height: 48, borderRadius: 6, background: '#1a1d28', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={playerModal.cover || 'https://via.placeholder.com/80x48'}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => e.target.style.display = 'none'}
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

