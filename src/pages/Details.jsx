import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'
const SOURCES = [
  { id: 'anikoto', name: 'AniKoto (Fast, Multi-Server)' },
  { id: 'kissanime', name: 'KissAnime (Backup)' },
  { id: 'animetake', name: 'AnimeTake (Dub/Sub)' }
]

export default function Details() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { setPlayerModal, setDownloads, settings } = useContext(AppContext)

  // Anime Details States
  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [watchOrder, setWatchOrder] = useState(null)

  // Scraper Source States
  const [activeSource, setActiveSource] = useState(SOURCES[0].id)
  const [searchResults, setSearchResults] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [searchingSource, setSearchingSource] = useState(false)

  // Episode States
  const [episodes, setEpisodes] = useState([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [selectedEpisodes, setSelectedEpisodes] = useState(new Set())
  const [quality, setQuality] = useState(settings.quality || 'best')
  const [subDub, setSubDub] = useState(settings.subDub || 'sub')
  const [queuing, setQueuing] = useState(false)
  const [watchingEp, setWatchingEp] = useState(null) // Ep number being resolved for watch

  useEffect(() => {
    fetchAnimeDetails()
  }, [id, location.state])

  const fetchWatchOrder = async (animeId) => {
    try {
      const res = await fetch(`${API}/jikan/watch-order?id=${animeId}`)
      const data = await res.json()
      setWatchOrder(data.watch_order || null)
    } catch {
      setWatchOrder(null)
    }
  }

  const fetchAnimeDetails = async () => {
    setLoading(true)
    setError('')
    setAnime(null)
    setSelectedMatch(null)
    setEpisodes([])
    setSearchResults([])
    setSelectedEpisodes(new Set())
    setWatchOrder(null)

    try {
      const searchTitle = location.state?.searchQuery
      const url = id && id !== '0'
        ? `${API}/jikan/details?id=${id}` 
        : `${API}/jikan/details?title=${encodeURIComponent(searchTitle)}`
        
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setAnime(data)
        // Immediately start searching sources for matching title
        searchSourceScraper(data.title, activeSource)
        if (data.id) {
          fetchWatchOrder(data.id)
        }
      }
    } catch {
      setError('Failed to fetch anime details')
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on selected source when it changes or anime loads
  const searchSourceScraper = async (title, sourceId) => {
    if (!title) return
    setSearchingSource(true)
    setEpisodes([])
    setSelectedMatch(null)
    try {
      const res = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(title)}`)
      const data = await res.json()
      const results = data.results || []
      setSearchResults(results)

      if (results.length > 0) {
        // Find best match (exact or containing title)
        const best = results.find(r => r.title.toLowerCase() === title.toLowerCase()) || results[0]
        setSelectedMatch(best)
        fetchSourceEpisodes(best.url, sourceId)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearchingSource(false)
    }
  }

  const fetchSourceEpisodes = async (url, sourceId) => {
    setLoadingEpisodes(true)
    setEpisodes([])
    setSelectedEpisodes(new Set())
    try {
      const res = await fetch(`${API}/${sourceId}/episodes?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      setEpisodes(data.episodes || [])
    } catch {
      setEpisodes([])
    } finally {
      setLoadingEpisodes(false)
    }
  }

  const handleSourceChange = (sourceId) => {
    setActiveSource(sourceId)
    if (anime) {
      searchSourceScraper(anime.title, sourceId)
    }
  }

  const handleMatchSelect = (match) => {
    setSelectedMatch(match)
    fetchSourceEpisodes(match.url, activeSource)
  }

  const toggleEp = (num) => {
    setSelectedEpisodes(s => {
      const ns = new Set(s)
      ns.has(num) ? ns.delete(num) : ns.add(num)
      return ns
    })
  }

  const selectAll = () => setSelectedEpisodes(new Set(episodes.map(e => e.number)))
  const clearAll = () => setSelectedEpisodes(new Set())

  const startDownloads = async () => {
    if (selectedEpisodes.size === 0 || !selectedMatch) return
    setQueuing(true)
    const toDownload = episodes.filter(e => selectedEpisodes.has(e.number))
    for (const ep of toDownload) {
      const dlId = `${Date.now()}-${ep.number}`
      try {
        await fetch(`${API}/download/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: ep.url,
            title: anime.title,
            episode: `Episode ${ep.number}`,
            quality,
            download_id: dlId,
            thumbnail: anime.cover,
            source: activeSource,
          }),
        })
      } catch {}
    }
    setQueuing(false)
    setSelectedEpisodes(new Set())
  }

  const handleWatch = async (epNum) => {
    const ep = episodes.find(e => e.number === epNum)
    if (!ep) return
    
    setWatchingEp(epNum)
    try {
      let finalUrl = ep.url
      if (finalUrl.startsWith('anikoto:')) {
        const dataIds = finalUrl.split('anikoto:')[1]
        const res = await fetch(`${API}/anikoto/resolve?data_ids=${encodeURIComponent(dataIds)}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
      } else if (finalUrl.startsWith('kissanime:') || finalUrl.includes('kissanime.com.vc')) {
        const res = await fetch(`${API}/kissanime/resolve?url=${encodeURIComponent(finalUrl)}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
      }
      setPlayerModal({ title: `${anime.title} - Episode ${ep.number}`, url: finalUrl })
      try {
        const historyStr = localStorage.getItem('anivault-history') || '[]'
        let history = JSON.parse(historyStr)
        history = history.filter(item => item.animeTitle !== anime.title)
        history.unshift({
          animeTitle: anime.title,
          animeId: anime.id,
          episodeNumber: ep.number,
          episodeTitle: ep.title,
          thumbnail: anime.cover,
          url: ep.url,
          source: activeSource,
          timestamp: Date.now()
        })
        if (history.length > 15) history = history.slice(0, 15)
        localStorage.setItem('anivault-history', JSON.stringify(history))
      } catch (e) {
        console.error('Failed to save to continue watching:', e)
      }
    } catch {}
    setWatchingEp(null)
  }

  if (loading) {
    return (
      <div className="details-loading">
        <span className="spinner large" />
        <p>Fetching full anime details...</p>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="details-error">
        <span style={{fontSize:50}}>😞</span>
        <h2>Failed to load details</h2>
        <p>{error || 'Anime not found.'}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="details-page">
      {/* Hero Banner Area */}
      <div 
        className="details-hero" 
        style={{ backgroundImage: anime.banner ? `url(${anime.banner})` : `url(${anime.cover})` }}
      >
        <div className="details-hero-overlay" />
        <div className="details-hero-content">
          <button className="btn btn-secondary back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          
          <div className="details-main-info">
            <h1 className="details-title">{anime.title}</h1>
            {anime.title_romaji && anime.title_romaji !== anime.title && (
              <p className="details-subtitle-romaji">🇯🇵 {anime.title_romaji}</p>
            )}
            <div className="details-badges">
              {anime.score && <span className="badge badge-sub">⭐ {anime.score} Score</span>}
              <span className="badge badge-type">{anime.type}</span>
              {anime.year && <span className="badge badge-source">{anime.season} {anime.year}</span>}
              <span className="badge badge-source">{anime.status}</span>
              {anime.studio && <span className="badge badge-source">{anime.studio}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="details-container">
        
        {/* Left Column: Metadata & Relations */}
        <div className="details-col-left">
          <div className="cover-art-container">
            <img src={anime.cover} alt={anime.title} className="details-cover-img" />
          </div>

          <div className="details-metadata-card">
            <h3>Synopsis</h3>
            <p className="details-description">{anime.description || 'No description available.'}</p>
            
            <div className="details-genres">
              {anime.genres.map(g => (
                <span key={g} className="details-genre-tag">{g}</span>
              ))}
            </div>
          </div>

          {/* Franchise Watch Order */}
          {watchOrder && watchOrder.length > 1 && (
            <div className="details-relations-card">
              <h3>🌸 Franchise Watch Order</h3>
              <div className="relations-list">
                {watchOrder.map(item => (
                  <button 
                    key={item.id} 
                    className={`relation-item-btn${item.id === anime.id ? ' active' : ''}`}
                    style={item.id === anime.id ? { borderColor: 'var(--accent)', background: 'var(--accent-glow)' } : {}}
                    onClick={() => navigate(`/anime/${item.id}`, { state: { cacheBuster: Date.now() } })}
                  >
                    <div style={{display:'flex', alignItems:'flex-start', gap:10, flex:1, marginRight:12}}>
                      <span className="relation-type" style={{ color: 'var(--accent-light)', minWidth: 40, marginTop: 1 }}>#{item.order}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', wordBreak:'break-word' }}>{item.title}</span>
                    </div>
                    <span className="relation-status" style={{flexShrink:0}}>{item.year} · {item.format}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Seasons / Prequels / Sequels */}
          {anime.relations && anime.relations.length > 0 && (
            <div className="details-relations-card">
              <h3>Related Seasons & Shows</h3>
              <div className="relations-list">
                {anime.relations.map(rel => (
                  <button 
                    key={rel.id} 
                    className="relation-item-btn"
                    onClick={() => navigate(`/anime/${rel.id}`, { state: { cacheBuster: Date.now() } })}
                  >
                    <div style={{display:'flex', alignItems:'flex-start', gap:10, flex:1, marginRight:12}}>
                      <span className="relation-type" style={{ minWidth: 80, marginTop: 1 }}>{rel.relation}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', wordBreak:'break-word' }}>{rel.title}</span>
                    </div>
                    <span className="relation-status" style={{flexShrink:0}}>{rel.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {anime.recommendations && anime.recommendations.length > 0 && (
            <div className="details-recommendations-card">
              <h3>Recommended Shows</h3>
              <div className="recommendations-grid">
                {anime.recommendations.map(rec => (
                  <div 
                    key={rec.id} 
                    className="rec-card"
                    onClick={() => navigate(`/anime/${rec.id}`, { state: { cacheBuster: Date.now() } })}
                  >
                    <img src={rec.thumbnail} alt={rec.title} />
                    <p className="rec-title">{rec.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sources & Episodes */}
        <div className="details-col-right">
          <div className="details-scraper-card">
            <div className="scraper-header">
              <h3>Watch & Download</h3>
              <div className="scraper-source-picker">
                <label>Stream Source: </label>
                <select 
                  className="settings-select" 
                  value={activeSource} 
                  onChange={e => handleSourceChange(e.target.value)}
                >
                  {SOURCES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matching Search Results from Selected Scraper */}
            {searchingSource ? (
              <div className="source-matching-loading">
                <span className="spinner" />
                <p>Searching source library for "{anime.title}"...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="source-results-selector">
                <label>Linked Title Match: </label>
                <select 
                  className="settings-select full-width"
                  value={selectedMatch ? JSON.stringify(selectedMatch) : ''}
                  onChange={e => handleMatchSelect(JSON.parse(e.target.value))}
                >
                  {searchResults.map((r, i) => (
                    <option key={i} value={JSON.stringify(r)}>{r.title}</option>
                  ))}
                </select>
                <p className="scraper-tip">⚠️ If the episodes look incorrect, try choosing a different Linked Title Match above.</p>
              </div>
            ) : (
              <div className="source-no-results">
                <p>❌ No matching title found on {SOURCES.find(s => s.id === activeSource)?.name}.</p>
                <p>This anime may not be available on this server. Try switching the Stream Source above.</p>
              </div>
            )}

            {/* Episodes List */}
            {selectedMatch && (
              <div className="scraper-episodes-section">
                <div className="episodes-controls">
                  <div className="episodes-left-actions">
                    <button className="btn btn-ghost" onClick={selectAll}>Select All</button>
                    <button className="btn btn-ghost" onClick={clearAll}>Clear</button>
                    <span className="selected-count">{selectedEpisodes.size} Selected</span>
                  </div>

                  <div className="episodes-right-actions">
                    <select className="settings-select" value={quality} onChange={e => setQuality(e.target.value)}>
                      <option value="best">Best Quality</option>
                      <option value="1080p">1080p</option>
                      <option value="720p">720p</option>
                      <option value="480p">480p</option>
                    </select>
                  </div>
                </div>

                {loadingEpisodes ? (
                  <div className="episodes-loading">
                    <span className="spinner" />
                    <p>Loading episode index...</p>
                  </div>
                ) : episodes.length === 0 ? (
                  <p className="no-episodes-msg">No episodes indexed for this matching link.</p>
                ) : (
                  <div className="episodes-grid-container">
                    <div className="ep-grid">
                      {episodes.map(ep => (
                        <div 
                          key={ep.number} 
                          className={`ep-row-card${selectedEpisodes.has(ep.number) ? ' selected' : ''}`}
                        >
                          <div className="ep-row-info" onClick={() => toggleEp(ep.number)}>
                            <span className="ep-num-circle">{ep.number}</span>
                            <span className="ep-row-title" title={ep.title}>{ep.title}</span>
                          </div>
                          
                          <button 
                            className="ep-row-play-btn"
                            disabled={watchingEp !== null}
                            onClick={() => handleWatch(ep.number)}
                          >
                            {watchingEp === ep.number ? (
                              <span className="spinner small" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bulk Download Action Bar */}
                {selectedEpisodes.size > 0 && (
                  <div className="bulk-action-bar">
                    <button 
                      className="btn btn-primary full-width"
                      onClick={startDownloads}
                      disabled={queuing}
                    >
                      {queuing ? <span className="spinner" /> : `📥 Download ${selectedEpisodes.size} Selected Episode${selectedEpisodes.size > 1 ? 's' : ''}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
