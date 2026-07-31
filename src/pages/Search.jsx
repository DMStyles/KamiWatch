import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../App'
import { useLocation, useNavigate } from 'react-router-dom'

const API = 'http://localhost:8642'
const LETTERS = ['#', 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

export default function Search() {
  const [tab, setTab] = useState('browse') // 'browse' or 'latest'
  
  // Search and filter drawer states
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState('Anime')
  const [sortOption, setSortOption] = useState('Highest score')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [selectedFormat, setSelectedFormat] = useState('All')
  const [selectedSeason, setSelectedSeason] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [isAdult, setIsAdult] = useState(false)

  // Scraper search states
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('all')
  const [genreMode, setGenreMode] = useState(null) // null = search mode, string = genre name
  const [timetable, setTimetable] = useState(null)

  // Browse index states
  const [browseResults, setBrowseResults] = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [activeLetter, setActiveLetter] = useState(null)

  const { setEpisodeModal } = useContext(AppContext)
  const inputRef = useRef()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab === 'scrapers' ? 'latest' : location.state.tab)
      setGenreMode(null)
      setQuery('')
      if (location.state.tab === 'browse') {
        setBrowseResults([])
        fetchBrowse(1, null)
      }
    } else if (location.state?.showLatest) {
      setTab('latest')
      setGenreMode(null)
      setQuery('')
      fetchLatestScraperEpisodes()
    } else if (location.state?.showAiring) {
      setTab('browse')
      setGenreMode('Airing This Season')
      setQuery('')
      setBrowseResults([])
      browseAiring()
    } else if (location.state?.genre) {
      setTab('browse')
      setGenreMode(location.state.genre)
      setSelectedGenre(location.state.genre)
      setQuery('')
      setBrowseResults([])
      browseGenre(location.state.genre)
    } else if (location.state?.searchQuery) {
      setTab('browse')
      setGenreMode(null)
      setQuery(location.state.searchQuery)
      fetchBrowse(1, null, location.state.searchQuery)
    }
  }, [location.state])

  useEffect(() => {
    if (tab === 'browse' && browseResults.length === 0 && !genreMode && !query) {
      fetchBrowse(1, null)
    }
  }, [tab])

  const browseAiring = async () => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      const res = await fetch(`${API}/jikan/airing?limit=100`)
      const data = await res.json()
      const items = data.results || []
      setBrowseResults(items)
      if (items.length === 0) setBrowseError("No currently airing anime found.")
    } catch {
      setBrowseError('Failed to load airing anime. Make sure the backend is running.')
    } finally {
      setBrowseLoading(false)
    }
  }

  const browseGenre = async (genre) => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      const res = await fetch(`${API}/jikan/by-genre?genre=${encodeURIComponent(genre)}`)
      const data = await res.json()
      const items = data.results || []
      setBrowseResults(items)
      if (items.length === 0) setBrowseError(`No anime found for genre "${genre}".`)
    } catch {
      setBrowseError('Failed to load genre. Make sure the backend is running.')
    } finally {
      setBrowseLoading(false)
    }
  }

  const fetchLatestScraperEpisodes = async () => {
    setLoading(true)
    setError('')
    setResults([])
    try {
      let items = []
      try {
        const resLatest = await fetch(`${API}/anikoto/latest?limit=100`)
        const dataLatest = await resLatest.json()
        if (dataLatest.results && dataLatest.results.length > 0) {
          items = dataLatest.results
        }
      } catch (e) {}

      if (items.length === 0) {
        // Fallback to currently airing anime sorted by release date
        const resAiring = await fetch(`${API}/jikan/airing?limit=100`)
        const dataAiring = await resAiring.json()
        items = dataAiring.results || []
      }

      setResults(items)
      if (items.length === 0) {
        setError('No recently released episodes found.')
      }
    } catch {
      setError('Failed to fetch recently released episodes.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrowse = async (p, letter, searchQ = '') => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      let url = ''
      if (mediaType === 'Manga') {
        url = `${API}/manga/trending`
      } else if (selectedGenre !== 'All') {
        url = `${API}/jikan/by-genre?genre=${encodeURIComponent(selectedGenre)}`
      } else if (searchQ) {
        url = `${API}/jikan/search?q=${encodeURIComponent(searchQ)}&page=${p}`
      } else {
        const letterParam = letter && letter !== '#' ? `&letter=${letter}` : ''
        url = `${API}/jikan/all?page=${p}${letterParam}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.error && (!data.results || data.results.length === 0)) {
        setBrowseError(data.error)
        setBrowseResults([])
      } else {
        setBrowseResults(data.results || [])
        setPage(p)
        setHasNext(data.has_next || false)
        setTotalPages(data.total_pages || 1)
      }
    } catch {
      setBrowseError('Failed to connect to backend. Make sure the app is fully loaded.')
      setBrowseResults([])
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleLetter = (letter) => {
    const nextLetter = letter === activeLetter ? null : letter
    setActiveLetter(nextLetter)
    setQuery('')
    setGenreMode(null)
    fetchBrowse(1, nextLetter)
  }

  const handlePage = (p) => {
    fetchBrowse(p, activeLetter, query)
    const mainEl = document.querySelector('.app-main')
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = results.filter(r => {
    if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false
    if (activeSource !== 'all' && r.source && r.source !== activeSource) return false
    return true
  })

  const displayBrowseResults = browseResults.filter(item => {
    if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      
      {/* ── Seanime Left Side Multi-Attribute Filter Drawer ── */}
      <aside style={{
        width: 240, background: 'rgba(10, 10, 18, 0.95)', borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0, overflowY: 'auto'
      }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Search Title</label>
          <input
            type="text"
            placeholder="🔍 Title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (tab === 'latest' ? null : fetchBrowse(1, activeLetter, query))}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Media Type</label>
          <select
            value={mediaType}
            onChange={(e) => { setMediaType(e.target.value); fetchBrowse(1, null, query) }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="Anime" style={{ background: '#0e0e16' }}>Anime</option>
            <option value="Manga" style={{ background: '#0e0e16' }}>Manga</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Sort By</label>
          <select
            value={sortOption}
            onChange={(e) => {
              const val = e.target.value
              setSortOption(val)
              if (val === 'Latest added') {
                setTab('latest')
                fetchLatestScraperEpisodes()
              }
            }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="Highest score" style={{ background: '#0e0e16' }}>Highest score</option>
            <option value="Most popular" style={{ background: '#0e0e16' }}>Most popular</option>
            <option value="Latest added" style={{ background: '#0e0e16' }}>Latest added</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Genres</label>
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); browseGenre(e.target.value) }}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            {['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports'].map(g => (
              <option key={g} value={g} style={{ background: '#0e0e16' }}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0e0e16' }}>All formats</option>
            <option value="TV" style={{ background: '#0e0e16' }}>TV</option>
            <option value="Movie" style={{ background: '#0e0e16' }}>Movie</option>
            <option value="OVA" style={{ background: '#0e0e16' }}>OVA</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Season</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0e0e16' }}>All seasons</option>
            <option value="WINTER" style={{ background: '#0e0e16' }}>Winter</option>
            <option value="SPRING" style={{ background: '#0e0e16' }}>Spring</option>
            <option value="SUMMER" style={{ background: '#0e0e16' }}>Summer</option>
            <option value="FALL" style={{ background: '#0e0e16' }}>Fall</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0e0e16' }}>All statuses</option>
            <option value="RELEASING" style={{ background: '#0e0e16' }}>Releasing</option>
            <option value="FINISHED" style={{ background: '#0e0e16' }}>Finished</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Adult (18+)</span>
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
        </div>
      </aside>

      {/* Main Search & Grid Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {/* Top Header Mode Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <button 
            className={`btn ${tab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}
            onClick={() => { setTab('browse'); setGenreMode(null); setQuery(''); setBrowseResults([]); setBrowseError(''); fetchBrowse(1, null); }}
          >
            🗂️ Anime Index (A-Z)
          </button>
          <button 
            className={`btn ${tab === 'latest' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20 }}
            onClick={() => { setTab('latest'); setGenreMode(null); setQuery(''); setResults([]); setError(''); fetchLatestScraperEpisodes(); }}
          >
            ⏱️ Recently Released
          </button>
        </div>

        {tab === 'browse' && !genreMode && (
          <div className="alphabet-bar" style={{ marginBottom: 20 }}>
            {LETTERS.map(l => (
              <button
                key={l}
                className={`alpha-btn${activeLetter === l ? ' active' : ''}`}
                onClick={() => handleLetter(l)}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {tab === 'latest' ? (
          loading ? (
            <div className="browse-loading">
              <span className="spinner large" />
              <p style={{ marginTop: 16 }}>Loading recently released anime & episodes...</p>
            </div>
          ) : error ? (
            <div className="search-empty">
              <span style={{ fontSize: 40 }}>⚠️</span>
              <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="search-empty">
              <span style={{ fontSize: 40 }}>⏱️</span>
              <p>No recently released episodes found for current filters.</p>
            </div>
          ) : (
            <div className="results-grid">
              {filtered.map((item, i) => (
                <div
                  key={i}
                  className="result-card"
                  onClick={() => {
                    if (item.episode) {
                      setEpisodeModal({
                        animeTitle: item.title,
                        episodeNumber: item.episode,
                        source: item.source || 'anikoto',
                        episodeUrl: item.url
                      })
                    } else {
                      navigate(`/anime/${item.id || item.mal_id || 0}`, { state: { searchQuery: item.title } })
                    }
                  }}
                >
                  <div className="result-card-img">
                    <img
                      src={item.thumbnail || item.cover || item.image}
                      alt={item.title}
                      loading="lazy"
                      onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'}
                    />
                    <div className="result-card-overlay">
                      <button className="card-play-btn large">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                    {item.episode && (
                      <span className="anime-card-badge" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>EP {item.episode}</span>
                    )}
                    {item.source && (
                      <div className="result-badges">
                        <span className="badge badge-sub" style={{ textTransform: 'uppercase', fontSize: 10 }}>{item.source}</span>
                      </div>
                    )}
                  </div>
                  <div className="result-card-info">
                    <p className="result-title">{item.title}</p>
                    <div className="result-meta">
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {item.episode ? `Episode ${item.episode}` : 'Recently Airing'}
                      </span>
                      {item.year && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.year}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : browseLoading ? (
          <div className="browse-loading">
            <span className="spinner large" />
            <p style={{ marginTop: 16 }}>Loading index...</p>
          </div>
        ) : browseError ? (
          <div className="search-empty">
            <span style={{ fontSize: 40 }}>⏳</span>
            <p style={{ color: 'var(--text-muted)' }}>{browseError}</p>
          </div>
        ) : displayBrowseResults.length === 0 ? (
          <div className="search-empty">
            <span style={{ fontSize: 40 }}>🎌</span>
            <p>No results found for current filter settings.</p>
          </div>
        ) : (
          <div>
            <div className="results-grid">
              {displayBrowseResults.map((item, i) => (
                <div
                  key={i}
                  className="result-card"
                  onClick={() => navigate(mediaType === 'Manga' ? `/manga/${item.id}` : (item.mal_id ? `/anime/${item.mal_id}` : '/anime/0'), { state: { searchQuery: item.title, manga: item } })}
                >
                  <div className="result-card-img">
                    <img
                      src={item.thumbnail || item.cover}
                      alt={item.title}
                      loading="lazy"
                      onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'}
                    />
                    <div className="result-card-overlay">
                      <button className="card-play-btn large">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                    {item.type && (
                      <span className="anime-card-badge">{item.type}</span>
                    )}
                    <div className="result-badges">
                      {item.score && <span className="badge badge-sub">⭐ {item.score}</span>}
                    </div>
                  </div>
                  <div className="result-card-info">
                    <p className="result-title">{item.title}</p>
                    <div className="result-meta">
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.type || mediaType}</span>
                      {item.year && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.year}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !query && (
              <div className="pagination" style={{ marginTop: 24 }}>
                <button
                  className="btn btn-ghost page-btn"
                  disabled={page <= 1 || browseLoading}
                  onClick={() => handlePage(page - 1)}
                >
                  ← Prev
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p
                    if (totalPages <= 7) p = i + 1
                    else if (page <= 4) p = i + 1
                    else if (page >= totalPages - 3) p = totalPages - 6 + i
                    else p = page - 3 + i
                    return (
                      <button
                        key={p}
                        className={`page-num-btn${p === page ? ' active' : ''}`}
                        onClick={() => handlePage(p)}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
                <button
                  className="btn btn-ghost page-btn"
                  disabled={!hasNext || browseLoading}
                  onClick={() => handlePage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
