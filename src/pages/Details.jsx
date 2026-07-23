import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../App'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'
const SOURCES = [
  { id: 'anikoto', name: 'AniKoto (Fast, Multi-Server)' },
  { id: 'kissanime', name: 'KissAnime (Backup)' },
  { id: 'animetake', name: 'AnimeTake (Dub/Sub)' },
  { id: 'museasia', name: 'Muse Asia (Official YouTube)' }
]

export default function Details() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { settings, playerModal, setPlayerModal, setDownloads } = useContext(AppContext)

  // Force progress bar update on modal close
  const [progressTick, setProgressTick] = useState(0)
  useEffect(() => {
    setProgressTick(t => t + 1)
  }, [playerModal])

  // Anime Details States
  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [watchOrder, setWatchOrder] = useState(null)
  const [watchlistStatus, setWatchlistStatus] = useState('')
  const [mangaMatch, setMangaMatch] = useState(null)

  // Scraper Source States
  const [activeSource, setActiveSource] = useState(SOURCES[0].id)
  const activeSourceRef = React.useRef(SOURCES[0].id) // ref to avoid stale closure in async callbacks
  const [searchResults, setSearchResults] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [searchingSource, setSearchingSource] = useState(false)

  // Episode States
  const [episodes, setEpisodes] = useState([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [selectedEpisodes, setSelectedEpisodes] = useState(new Set())
  const [quality, setQuality] = useState(settings.quality || 'best')
  const [subDub, setSubDub] = useState(settings.subDub || 'sub')
  const [preferredServer, setPreferredServer] = useState('VidPlay-1')
  const [queuing, setQueuing] = useState(false)
  const [watchingEp, setWatchingEp] = useState(null) // Ep number being resolved for watch

  // Keep quality and subDub in sync with settings context (settings load async)
  useEffect(() => {
    if (settings.subDub) setSubDub(settings.subDub)
    if (settings.quality) setQuality(settings.quality)
  }, [settings.subDub, settings.quality])

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

  const fetchMangaMatch = async (title) => {
    try {
      // Strip season suffixes for a cleaner search
      const cleanTitle = title
        .replace(/\s+season\s+\d+/i, '')
        .replace(/\s+s\d+$/i, '')
        .replace(/\s+part\s+\d+/i, '')
        .trim()
      const res = await fetch(`${API}/manga/search?q=${encodeURIComponent(cleanTitle)}&source=mangadex`)
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        setMangaMatch(data.results[0])
      }
    } catch {}
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
    setWatchlistStatus('')

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
        // Load watchlist status
        try {
          const savedList = JSON.parse(localStorage.getItem('kamiwatch-watchlist') || '{}')
          setWatchlistStatus(savedList[data.title]?.status || '')
        } catch {}

        // Immediately start searching sources for matching title
        // Use activeSourceRef to avoid stale closure capturing initial value
        searchSourceScraper(data.title, activeSourceRef.current, data)
        if (data.id) {
          fetchWatchOrder(data.id)
        }
        // Search for manga adaptation
        fetchMangaMatch(data.title)
      }
    } catch {
      setError('Failed to fetch anime details')
    } finally {
      setLoading(false)
    }
  }

  const handleWatchlistChange = (status) => {
    setWatchlistStatus(status)
    try {
      const savedList = JSON.parse(localStorage.getItem('kamiwatch-watchlist') || '{}')
      if (!status) {
        delete savedList[anime.title]
      } else {
        savedList[anime.title] = {
          title: anime.title,
          id: anime.id,
          thumbnail: anime.cover,
          type: anime.type,
          year: anime.year,
          status: status,
          timestamp: Date.now()
        }
      }
      localStorage.setItem('kamiwatch-watchlist', JSON.stringify(savedList))
    } catch (e) {
      console.error(e)
    }
  }

  const [customSearchQuery, setCustomSearchQuery] = useState('')

  const handleRefreshAll = () => {
    fetchAnimeDetails()
  }

  // Trigger search on selected source when it changes or anime loads
  const searchSourceScraper = async (title, sourceId, currentAnime = anime) => {
    if (!title) return
    setSearchingSource(true)
    setEpisodes([])
    setSelectedMatch(null)
    try {
      let res = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(title)}`)
      let data = await res.json()
      let results = data.results || []

      // Fallback 1: Try romaji/japanese title if initial English search gave 0 results
      if (results.length === 0 && currentAnime?.title_japanese && currentAnime.title_japanese !== title) {
        try {
          const res2 = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(currentAnime.title_japanese)}`)
          const data2 = await res2.json()
          if (data2.results && data2.results.length > 0) results = data2.results
        } catch {}
      }

      // Fallback 2: Try base title before colon (e.g. "Mushoku Tensei: Jobless Reincarnation Season 3" -> "Mushoku Tensei")
      if (results.length === 0 && title.includes(':')) {
        try {
          const baseTitle = title.split(':')[0].trim()
          const res3 = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(baseTitle)}`)
          const data3 = await res3.json()
          if (data3.results && data3.results.length > 0) results = data3.results
        } catch {}
      }

      // Fallback 3: Strip Season/Part/Suffixes (e.g. "Oh Boy, Was I Wrong About Her Season 2" -> "Oh Boy, Was I Wrong About Her")
      if (results.length === 0) {
        try {
          const cleaned = title.replace(/\s*(Season\s*\d+.*|Part\s*\d+.*|S\d+.*|\d+(st|nd|rd|th)\s*Season.*|Movie|Special|OVA|ONA|Dub|Sub)$/i, '').trim()
          if (cleaned && cleaned !== title) {
            const res4 = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(cleaned)}`)
            const data4 = await res4.json()
            if (data4.results && data4.results.length > 0) results = data4.results
          }
        } catch {}
      }

      // Fallback 4: First 2-3 words of title (e.g. "Oh Boy, Was I Wrong About Her" -> "Oh Boy, Was")
      if (results.length === 0) {
        try {
          const words = title.split(' ')
          if (words.length >= 2) {
            const shortQuery = words.slice(0, 3).join(' ').replace(/[:,.-]$/, '').trim()
            const res5 = await fetch(`${API}/${sourceId}/search?q=${encodeURIComponent(shortQuery)}`)
            const data5 = await res5.json()
            if (data5.results && data5.results.length > 0) results = data5.results
          }
        } catch {}
      }

      setSearchResults(results)

      if (results.length > 0) {
        // Find best match (exact match, romaji match, or first result)
        const best = results.find(r => r.title.toLowerCase() === title.toLowerCase()) ||
                     results.find(r => currentAnime?.title_japanese && r.title.toLowerCase() === currentAnime.title_japanese.toLowerCase()) ||
                     results[0]
        setSelectedMatch(best)
        fetchSourceEpisodes(best.url, sourceId)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearchingSource(false)
    }
  }

  const handleCustomSourceSearch = async (queryText = customSearchQuery) => {
    const q = queryText || anime?.title || ''
    if (!q.trim()) return
    setSearchingSource(true)
    setEpisodes([])
    setSelectedMatch(null)
    try {
      const res = await fetch(`${API}/${activeSource}/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      const results = data.results || []
      setSearchResults(results)
      if (results.length > 0) {
        setSelectedMatch(results[0])
        fetchSourceEpisodes(results[0].url, activeSource)
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
    activeSourceRef.current = sourceId
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
            sub_dub: subDub,
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
      let alternatives = null
      if (finalUrl.startsWith('anikoto:')) {
        const dataIds = finalUrl.split('anikoto:')[1]
        const res = await fetch(`${API}/anikoto/resolve?data_ids=${encodeURIComponent(dataIds)}&sub_dub=${subDub}&server=${preferredServer}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
        if (data.alternatives) alternatives = data.alternatives
      } else if (finalUrl.startsWith('kissanime:') || finalUrl.includes('kissanime.com.vc')) {
        const res = await fetch(`${API}/kissanime/resolve?url=${encodeURIComponent(finalUrl)}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
      } else if (activeSource === 'museasia' || finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
        const res = await fetch(`${API}/museasia/resolve?url=${encodeURIComponent(finalUrl)}`)
        const data = await res.json()
        if (data.url) finalUrl = data.url
      }
      setPlayerModal({
        title: `${anime.title} - Episode ${ep.number}`,
        url: finalUrl,
        alternatives,
        id: anime.id,
        malId: anime.id,
        epNumber: ep.number
      })
      try {
        const historyStr = localStorage.getItem('kamiwatch-history') || '[]'
        let history = JSON.parse(historyStr)
        history = history.filter(item => (item.animeTitle || item.title) !== anime.title)
        history.unshift({
          title: anime.title,
          animeTitle: anime.title,
          id: anime.id,
          animeId: anime.id,
          malId: anime.id,
          episodeNumber: ep.number,
          episodeTitle: ep.title,
          cover: anime.cover,
          thumbnail: anime.cover,
          url: ep.url,
          source: activeSource,
          timestamp: Date.now()
        })
        if (history.length > 15) history = history.slice(0, 15)
        localStorage.setItem('kamiwatch-history', JSON.stringify(history))
      } catch (e) {
        console.error('Failed to save to continue watching:', e)
      }
    } catch {}
    setWatchingEp(null)
  }

  const [characters, setCharacters] = useState([])
  const [charsLoading, setCharsLoading] = useState(false)

  useEffect(() => {
    if (!anime?.id) return
    setCharsLoading(true)
    fetch(`${API}/jikan/characters?id=${anime.id}`)
      .then(r => r.json())
      .then(d => setCharacters((d || []).slice(0, 16)))
      .catch(() => {})
      .finally(() => setCharsLoading(false))
  }, [anime?.id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <div className="skeleton" style={{ height: '45vh', borderRadius: 0 }} />
        <div style={{ padding: '24px 32px', display: 'flex', gap: 28, marginTop: -60 }}>
          <div className="skeleton" style={{ width: 220, height: 310, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingTop: 70 }}>
            <div className="skeleton" style={{ width: '60%', height: 28, borderRadius: 8, marginBottom: 14 }} />
            <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 8, marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ width: 80, height: 24, borderRadius: 99 }} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 32 }}>
        <span style={{fontSize:64}}>😞</span>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Failed to load details</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'Anime not found.'}</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    )
  }

  const backdropUrl = anime.banner || anime.cover

  return (
    <div className="details-page" style={{ minHeight: '100%', paddingBottom: 48 }}>

      {/* =========================================================
          CINEMATIC HERO BACKDROP
      ========================================================= */}
      <div style={{ position: 'relative', height: '45vh', minHeight: 300, maxHeight: 440, overflow: 'hidden' }}>
        {/* Blurred backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${backdropUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center 20%',
          filter: 'blur(6px) brightness(0.45)',
          transform: 'scale(1.08)',
        }} />

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,7,15,0.3) 0%, rgba(7,7,15,0.7) 70%, var(--bg-primary) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,7,15,0.6) 0%, transparent 60%)' }} />

        {/* Top Action Buttons (Back + Refresh) */}
        <div style={{ position: 'absolute', top: 16, left: 24, display: 'flex', gap: 10, zIndex: 20 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(7,7,15,0.6)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: 8, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(7,7,15,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <button
            onClick={handleRefreshAll}
            title="Reload details and search episodes again"
            style={{
              background: 'rgba(7,7,15,0.6)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', borderRadius: 8, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(7,7,15,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>

      {/* =========================================================
          MAIN CONTENT — floating cover card + info
      ========================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, padding: '0 28px', marginTop: -80, position: 'relative', zIndex: 10, maxWidth: 1400, margin: '-80px auto 0' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Floating cover art */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            aspectRatio: '2/3', background: '#111120',
          }}>
            <img src={anime.cover} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>

          {/* Quick stats card */}
          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Status', val: anime.status },
              { label: 'Type', val: anime.type },
              { label: 'Episodes', val: anime.episodes || '?' },
              { label: 'Studio', val: anime.studio },
              { label: 'Season', val: anime.season && anime.year ? `${anime.season} ${anime.year}` : anime.year },
              { label: 'Score', val: anime.score ? `⭐ ${anime.score}` : null },
            ].filter(r => r.val).map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Watchlist */}
          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>Watchlist</span>
            <select
              className="settings-select"
              style={{ flex: 1, minWidth: 0, background: 'var(--bg-secondary)', borderColor: 'var(--border-hover)', fontSize: 12 }}
              value={watchlistStatus}
              onChange={(e) => handleWatchlistChange(e.target.value)}
            >
              <option value="">➕ Add to List...</option>
              <option value="watching">👀 Watching</option>
              <option value="plan">📅 Plan to Watch</option>
              <option value="completed">✅ Completed</option>
              <option value="favorite">💖 Favorite</option>
            </select>
          </div>

          {/* Synopsis + Genres */}
          <div style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 14, background: 'var(--gradient-accent)', borderRadius: 2, display: 'block' }} /> Synopsis
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{anime.description || 'No description available.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(anime.genres || []).map(g => (
                <span key={g} style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', color: 'var(--accent-light)', border: '1px solid rgba(124,58,237,0.25)', fontSize: 11, fontWeight: 600 }}>{g}</span>
              ))}
            </div>
          </div>

          {/* Manga Adaptation Shortcut */}
          {mangaMatch && (
            <div
              className="details-metadata-card"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => navigate(`/manga/${encodeURIComponent(mangaMatch.id)}`, { state: { manga: mangaMatch } })}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--manga-primary, #d97706)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
              <h3 style={{ marginBottom: 10 }}>📚 Read the Manga</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {mangaMatch.cover && (
                  <img
                    src={mangaMatch.cover}
                    alt={mangaMatch.title}
                    style={{ width: 52, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    onError={e => e.target.style.display = 'none'}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mangaMatch.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'capitalize' }}>
                    {mangaMatch.status} · {mangaMatch.year || 'Manga'} · MangaDex
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 11, padding: '5px 14px', background: 'var(--manga-primary, #d97706)', color: '#000', fontWeight: 'bold', borderRadius: 8 }}
                    onClick={e => { e.stopPropagation(); navigate(`/manga/${encodeURIComponent(mangaMatch.id)}`, { state: { manga: mangaMatch } }) }}
                  >
                    📖 Start Reading
                  </button>
                </div>
              </div>
            </div>
          )}

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

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title + Badges */}
          <div style={{ paddingTop: 88 }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 8, color: '#fff' }}>{anime.title}</h1>
            {anime.title_romaji && anime.title_romaji !== anime.title && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontStyle: 'italic' }}>🇯🇵 {anime.title_romaji}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {anime.score && <span className="badge badge-score">⭐ {anime.score}</span>}
              {anime.type && <span className="badge badge-type">{anime.type}</span>}
              {anime.year && <span className="badge badge-source">{anime.season ? `${anime.season} ` : ''}{anime.year}</span>}
              {anime.status && <span className="badge badge-source">{anime.status}</span>}
              {anime.studio && <span className="badge badge-source">{anime.studio}</span>}
            </div>
          </div>

          {/* Watch & Download Card */}
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
              <div className="source-no-results" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p style={{ color: '#f87171', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                  ❌ No matching title found on {SOURCES.find(s => s.id === activeSource)?.name}.
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  This anime may be named differently on this server. Try searching custom keywords or click Try Again.
                </p>

                {/* Custom Keyword Search */}
                <div style={{ display: 'flex', gap: 8, maxWidth: 460, margin: '0 auto 16px' }}>
                  <input
                    value={customSearchQuery}
                    onChange={e => setCustomSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomSourceSearch()}
                    placeholder="Type title (e.g. Oh Boy or Tenkousaki)..."
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none'
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCustomSourceSearch()}
                    style={{ fontSize: 12, padding: '8px 16px', whiteSpace: 'nowrap' }}
                  >
                    🔍 Search Source
                  </button>
                </div>

                {/* Retry / Refresh Action Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => searchSourceScraper(anime.title, activeSource)}>
                    🔄 Try Again
                  </button>
                  <button className="btn btn-ghost" onClick={handleRefreshAll}>
                    ⚡ Full Refresh Page
                  </button>
                </div>
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
                    {activeSource === 'anikoto' && (
                      <>
                        <select 
                          className="settings-select" 
                          value={preferredServer} 
                          onChange={e => setPreferredServer(e.target.value)}
                          title="Select Preferred AniKoto Stream Server"
                          style={{ borderColor: preferredServer !== 'auto' ? 'var(--accent)' : undefined }}
                        >
                          <option value="auto">⚡ Server: Auto</option>
                          <option value="HD-1">Server: HD-1</option>
                          <option value="Vidstream-2">Server: Vidstream-2</option>
                          <option value="VidCloud-1">Server: VidCloud-1</option>
                          <option value="VidPlay">Server: VidPlay</option>
                        </select>
                        <div className="subdub-toggle" title="Switch between Subtitled and Dubbed audio">
                          {['sub', 'dub'].map(v => (
                            <button
                              key={v}
                              className={`subdub-btn${subDub === v ? ' active' : ''}`}
                              onClick={() => setSubDub(v)}
                            >
                              {v === 'sub' ? '🔤 SUB' : '🎙️ DUB'}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
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
                      {episodes.map(ep => {
                        const progressMap = JSON.parse(localStorage.getItem('kamiwatch_episode_progress') || '{}')
                        const key1 = `${anime?.id}:${ep.number}`
                        const key2 = `${id}:${ep.number}`
                        const key3 = Object.keys(progressMap).find(k => k.endsWith(`:${ep.number}`) && (k.includes(`${anime?.id}`) || k.includes(`${id}`)))
                        const prog = progressMap[key1] || progressMap[key2] || (key3 ? progressMap[key3] : null)
                        const percent = prog?.progressPercent || 0

                        return (
                          <div 
                            key={ep.number} 
                            className={`ep-row-card${selectedEpisodes.has(ep.number) ? ' selected' : ''}`}
                            style={{ position: 'relative', overflow: 'hidden' }}
                          >
                            <div className="ep-row-info" onClick={() => toggleEp(ep.number)}>
                              <span className="ep-num-circle">{ep.number}</span>
                              <span className="ep-row-title" title={ep.title}>{ep.title}</span>
                              {percent > 85 ? (
                                <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginLeft: 6 }}>✓ Watched</span>
                              ) : percent > 0 ? (
                                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginLeft: 6 }}>{Math.round(percent)}%</span>
                              ) : null}
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

                            {percent > 0 && (
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: `${Math.min(100, Math.max(0, percent))}%`,
                                height: 3,
                                background: percent > 85 ? '#10b981' : 'var(--accent, #6366f1)',
                                transition: 'width 0.3s ease'
                              }} />
                            )}
                          </div>
                        )
                      })}
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

            {/* Trailer & Characters Section below Watch & Download */}
            {anime.trailer && (
              <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎬 Official Trailer
                </h3>
                <div 
                  onClick={() => window.electronAPI?.openExternal ? window.electronAPI.openExternal(`https://www.youtube.com/watch?v=${anime.trailer.id}`) : window.open(`https://www.youtube.com/watch?v=${anime.trailer.id}`, '_blank')}
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    borderRadius: 'var(--radius)', 
                    overflow: 'hidden', 
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: '#000'
                  }}
                >
                  <img 
                    src={anime.trailer.thumbnail || `https://img.youtube.com/vi/${anime.trailer.id}/maxresdefault.jpg`} 
                    alt="Watch Trailer" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    gap: 12
                  }}>
                    <div style={{
                      width: 64,
                      height: 44,
                      background: '#FF0000',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(255,0,0,0.3)'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFF"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#FFF', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                      Click to Watch Trailer on YouTube
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Characters from Jikan API */}
            {(charsLoading || characters.length > 0) && (
              <div style={{ marginTop: 20, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 16, background: 'var(--gradient-accent)', borderRadius: 2, display: 'block' }} />
                  Characters
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {charsLoading
                    ? <SkeletonCard variant="character" count={8} />
                    : characters.map(char => (
                      <div key={char.id} style={{ flexShrink: 0, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                        <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(124,58,237,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                          <img src={char.image} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{char.name}</span>
                        {char.role && <span style={{ fontSize: 10, color: 'var(--accent-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{char.role}</span>}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* From existing anime.characters fallback */}
            {!charsLoading && characters.length === 0 && anime.characters && anime.characters.length > 0 && (
              <div style={{ marginTop: 20, background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 16, background: 'var(--gradient-accent)', borderRadius: 2, display: 'block' }} /> Characters
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {anime.characters.map(char => (
                    <div key={char.id} style={{ flexShrink: 0, width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                      <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(124,58,237,0.3)' }}>
                        <img src={char.image} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{char.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
