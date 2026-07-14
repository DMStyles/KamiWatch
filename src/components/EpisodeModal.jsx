import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'

const API = 'http://localhost:8765'

export default function EpisodeModal() {
  const { episodeModal, setEpisodeModal, setDownloads, settings } = useContext(AppContext)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [quality, setQuality] = useState(settings.quality || 'best')
  const [subDub, setSubDub] = useState(settings.subDub || 'sub')
  const [queuing, setQueuing] = useState(false)

  useEffect(() => {
    fetchEpisodes()
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
          }),
        })
      } catch {}
    }
    setQueuing(false)
    setEpisodeModal(null)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEpisodeModal(null)}>
      <div className="modal-panel">
        <div className="modal-header">
          <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
            {episodeModal.thumbnail && (
              <img src={episodeModal.thumbnail} alt={episodeModal.title} className="modal-thumb" />
            )}
            <div>
              <h2 className="modal-title">{episodeModal.title}</h2>
              <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                <span className="badge badge-source" style={{textTransform:'capitalize'}}>{episodeModal.source}</span>
                <span className="badge badge-type">{episodeModal.type}</span>
                {episodeModal.sub_episodes !== '0' && <span className="badge badge-sub">SUB</span>}
                {episodeModal.dub_episodes !== '0' && <span className="badge badge-dub">DUB</span>}
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
            <div className="toggle-group">
              {['sub','dub'].map(v => (
                <button key={v} className={`toggle-btn${subDub===v?' active':''}`} onClick={() => setSubDub(v)}>
                  {v.toUpperCase()}
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
          <button className="btn btn-ghost" onClick={() => setEpisodeModal(null)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={startDownloads}
            disabled={selected.size === 0 || queuing}
          >
            {queuing ? <span className="spinner" /> : `Download ${selected.size > 0 ? selected.size + ' Episode' + (selected.size > 1 ? 's' : '') : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
