import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'

export default function EpisodeModal() {
  const navigate = useNavigate()
  const { episodeModal, setEpisodeModal, setDownloads, settings, setPlayerModal } = useContext(AppContext)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [quality, setQuality] = useState(settings.quality || 'best')
  const [subDub, setSubDub] = useState(settings.subDub || 'sub')
  const [queuing, setQueuing] = useState(false)
  const [watching, setWatching] = useState(false)

  const [follows, setFollows] = useState([])
  const [isFollowed, setIsFollowed] = useState(false)

  // Keep quality and subDub in sync with settings context (settings load async)
  useEffect(() => {
    if (settings.subDub) setSubDub(settings.subDub)
    if (settings.quality) setQuality(settings.quality)
  }, [settings.subDub, settings.quality])

  useEffect(() => {
    fetchEpisodes()
    fetchFollows()
  }, [episodeModal])

  const fetchEpisodes = async () => {
    setLoading(true)
    try {
      const source = episodeModal.source
      const res = await fetch(`${API}/${source}/episodes?url=${encodeURIComponent(episodeModal.url)}`)
      const data = await res.json()
      setEpisodes(data.episodes || [])
    } catch {
      setEpisodes([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFollows = async () => {
    try {
      const res = await fetch(`${API}/library/follows`)
      const data = await res.json()
      setFollows(data)
      const found = data.find(f => f.title === episodeModal.title)
      setIsFollowed(!!found)
    } catch {}
  }

  const toggleFollow = async () => {
    try {
      if (isFollowed) {
        const found = follows.find(f => f.title === episodeModal.title)
        if (found) {
          await fetch(`${API}/library/follows/${found.id}`, { method: 'DELETE' })
        }
      } else {
        await fetch(`${API}/library/follows?title=${encodeURIComponent(episodeModal.title)}&url=${encodeURIComponent(episodeModal.url)}&thumbnail=${encodeURIComponent(episodeModal.thumbnail)}&source=${encodeURIComponent(episodeModal.source)}`, {
          method: 'POST'
        })
      }
      fetchFollows()
    } catch {}
  }

  const toggleEp = (num) => {
    setSelected(s => {
      const ns = new Set(s)
      ns.has(num) ? ns.delete(num) : ns.add(num)
      return ns
    })
  }

  const selectAll = () => setSelected(new Set(episodes.map(e => e.number)))
  const clearAll = () => setSelected(new Set())

  const startDownloads = async () => {
    if (selected.size === 0) return
    setQueuing(true)
    const toDownload = episodes.filter(e => selected.has(e.number))
    for (const ep of toDownload) {
      const dlId = `${Date.now()}-${ep.number}`
      try {
        await fetch(`${API}/download/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: ep.url,
            title: episodeModal.title,
            episode: `Episode ${ep.number}`,
            quality,
            download_id: dlId,
            thumbnail: episodeModal.thumbnail,
            source: episodeModal.source,
            sub_dub: subDub,
          }),
        })
      } catch {}
    }
    setQueuing(false)
    setEpisodeModal(null)
  }

  const handleWatch = async () => {
    if (selected.size !== 1) return
    const epNum = Array.from(selected)[0]
    const ep = episodes.find(e => e.number === epNum)
    if (!ep) return
    
    setWatching(true)
    try {
      let finalUrl = ep.url
      let alternatives = null
      if (finalUrl.startsWith('anikoto:')) {
        const dataIds = finalUrl.split('anikoto:')[1]
        const res = await fetch(`${API}/anikoto/resolve?data_ids=${encodeURIComponent(dataIds)}&sub_dub=${subDub}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
        if (data.alternatives) alternatives = data.alternatives
      } else if (finalUrl.startsWith('kissanime:') || finalUrl.includes('kissanime.com.vc')) {
        const res = await fetch(`${API}/kissanime/resolve?url=${encodeURIComponent(finalUrl)}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
      }
      setPlayerModal({ title: `${episodeModal.title} - Episode ${ep.number}`, url: finalUrl, alternatives })
      setEpisodeModal(null)
    } catch {}
    setWatching(false)
  }

  const isDownloadDisabled = false
  const modalTitle = episodeModal?.title || episodeModal?.animeTitle || 'Unknown'
  const modalThumb = episodeModal?.thumbnail || episodeModal?.cover || ''
  const targetId = episodeModal?.id || episodeModal?.animeId || episodeModal?.malId

  const handleGoToDetails = () => {
    setEpisodeModal(null)
    if (targetId && String(targetId).match(/^\d+$/)) {
      navigate(`/anime/${targetId}`)
    } else if (modalTitle && modalTitle !== 'Unknown') {
      navigate('/search', { state: { searchQuery: modalTitle } })
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEpisodeModal(null)}>
      <div className="modal-panel">
        <div className="modal-header">
          <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
            {modalThumb && (
              <img src={modalThumb} alt={modalTitle} className="modal-thumb" />
            )}
            <div>
              <h2 className="modal-title">{modalTitle}</h2>
              <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                {episodeModal.source && <span className="badge badge-source" style={{textTransform:'capitalize'}}>{episodeModal.source}</span>}
                {episodeModal.type && <span className="badge badge-type">{episodeModal.type}</span>}
                {episodeModal.sub_episodes !== '0' && <span className="badge badge-sub">SUB</span>}
                {episodeModal.dub_episodes !== '0' && <span className="badge badge-dub">DUB</span>}
              </div>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <button
                  className={`btn ${isFollowed ? 'btn-secondary' : 'btn-primary'}`}
                  style={{padding: '4px 10px', fontSize: 11}}
                  onClick={toggleFollow}
                >
                  {isFollowed ? '❤️ Followed' : '🤍 Follow Series'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{padding: '4px 10px', fontSize: 11}}
                  onClick={handleGoToDetails}
                >
                  📖 View Details
                </button>
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={() => setEpisodeModal(null)}>✕</button>
        </div>

        <div className="modal-controls">
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={selectAll}>Select All</button>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={clearAll}>Clear</button>
            <span style={{color:'var(--text-muted)',fontSize:12,alignSelf:'center'}}>{selected.size} selected</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <select className="settings-select" value={quality} onChange={e => setQuality(e.target.value)}>
              <option value="best">Best</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
            <div className="subdub-toggle" title="Switch between Subtitled and Dubbed audio">
              {['sub', 'dub'].map(v => (
                <button key={v} className={`subdub-btn${subDub === v ? ' active' : ''}`} onClick={() => setSubDub(v)}>
                  {v === 'sub' ? '🔤 SUB' : '🎙️ DUB'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-episodes">
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:40}}><span className="spinner" style={{width:32,height:32}} /></div>
          ) : episodes.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No episodes found</div>
          ) : (
            <div className="ep-grid">
              {episodes.map(ep => (
                <button
                  key={ep.number}
                  className={`ep-btn${selected.has(ep.number) ? ' selected' : ''}`}
                  onClick={() => toggleEp(ep.number)}
                  title={ep.title}
                >
                  {ep.number}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {isDownloadDisabled && <span style={{fontSize:12, color:'var(--text-muted)', marginRight:'auto'}}>Downloads are currently disabled for protected streams. Please use Watch.</span>}
          <button className="btn btn-ghost" onClick={() => setEpisodeModal(null)}>Cancel</button>
          <button
            className="btn btn-secondary"
            onClick={handleWatch}
            disabled={selected.size !== 1 || queuing || watching}
          >
            {watching ? <span className="spinner" /> : '▶ Watch'}
          </button>
          <button
            className="btn btn-primary"
            onClick={startDownloads}
            disabled={selected.size === 0 || queuing || isDownloadDisabled}
            title={isDownloadDisabled ? "Downloads are disabled for this source" : ""}
          >
            {queuing ? <span className="spinner" /> : `Download ${selected.size > 0 ? selected.size + ' Episode' + (selected.size > 1 ? 's' : '') : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
