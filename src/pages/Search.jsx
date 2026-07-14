import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../App'
import { useLocation, useNavigate } from 'react-router-dom'

const API = 'http://localhost:8642'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('all')
  const [genreMode, setGenreMode] = useState(null) // null = search mode, string = genre name
  const { setEpisodeModal } = useContext(AppContext)
  const inputRef = useRef()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.genre) {
      // Genre filter mode — use Jikan API
      setGenreMode(location.state.genre)
      setQuery('')
      setResults([])
      browseGenre(location.state.genre)
    } else if (location.state?.searchQuery) {
      setGenreMode(null)
      setQuery(location.state.searchQuery)
      search(location.state.searchQuery)
    }
  }, [location.state])

  const browseGenre = async (genre) => {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch(`${API}/jikan/by-genre?genre=${encodeURIComponent(genre)}`)
      const data = await res.json()
      const items = data.results || []
      setResults(items)
      if (items.length === 0) setError(`No anime found for genre "${genre}".`)
    } catch {
      setError('Failed to load genre. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const search = async (q) => {
    if (!q.trim()) return
    setGenreMode(null)
    setLoading(true)
    setError('')
    setResults([])
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        fetch(`${API}/anikoto/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`${API}/animetake/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`${API}/kissanime/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
      ])
      const merged = [
        ...(r1.status === 'fulfilled' ? r1.value.results || [] : []),
        ...(r2.status === 'fulfilled' ? r2.value.results || [] : []),
        ...(r3.status === 'fulfilled' ? r3.value.results || [] : []),
      ]
      setResults(merged)
      if (merged.length === 0) setError('No results found. Try a different search term.')
    } catch {
      setError('Search failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') search(query) }

  const handleSearchClick = () => {
    setGenreMode(null)
    search(query)
  }

  const filtered = activeSource === 'all' ? results : results.filter(r => r.source === activeSource)

  // Sources available based on mode
  const sourceKeys = genreMode
    ? [] // genre mode = Jikan only, no source filter needed
    : ['all', 'anikoto', 'kissanime', 'animetake']

  return (
    <div className="search-page">
      <div className="search-header">
        {genreMode ? (
          <>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:4}}>
              <button
                className="btn btn-ghost"
                style={{padding:'4px 10px', fontSize:13}}
                onClick={() => { setGenreMode(null); setResults([]); setError('') }}
              >
                ← Back to Search
              </button>
            </div>
            <h1 className="search-heading">
              <span style={{color:'var(--text-muted)', fontWeight:400, fontSize:'0.6em', letterSpacing:2, textTransform:'uppercase', display:'block', marginBottom:4}}>Browsing Genre</span>
              {genreMode}
            </h1>
            <p className="search-sub">Top-rated anime in this genre · powered by MyAnimeList</p>
          </>
        ) : (
          <>
            <h1 className="search-heading">Search Anime</h1>
            <p className="search-sub">Search across Anikoto, Kissanime &amp; AnimeTake simultaneously</p>
          </>
        )}

        <div className="search-input-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search for an anime series..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoFocus={!genreMode}
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); setResults([]); setGenreMode(null); inputRef.current?.focus() }}>✕</button>
          )}
          <button className="btn btn-primary search-btn" onClick={handleSearchClick} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {!genreMode && results.length > 0 && (
          <div className="source-tabs">
            {sourceKeys.map(s => (
              <button
                key={s}
                className={`source-tab${activeSource === s ? ' active' : ''}`}
                onClick={() => setActiveSource(s)}
              >
                {s === 'all'
                  ? `All (${results.length})`
                  : s === 'anikoto'
                  ? `Anikoto (${results.filter(r=>r.source==='anikoto').length})`
                  : s === 'kissanime'
                  ? `Kissanime (${results.filter(r=>r.source==='kissanime').length})`
                  : `AnimeTake (${results.filter(r=>r.source==='animetake').length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-results">
        {error && (
          <div className="search-empty">
            <span style={{fontSize:40}}>🔍</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && !genreMode && (
          <div className="search-empty">
            <span style={{fontSize:48}}>🎌</span>
            <p>Search for any anime series to get started</p>
            <p style={{fontSize:13, color:'var(--text-muted)', marginTop:4}}>Try "One Piece", "Naruto", or "Attack on Titan"</p>
          </div>
        )}

        <div className="results-grid">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="result-card"
              onClick={() => genreMode
                ? navigate('/search', { state: { searchQuery: item.title } })
                : setEpisodeModal(item)
              }
            >
              <div className="result-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
                <div className="result-card-overlay">
                  <button className="card-play-btn large">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
                <div className="result-badges">
                  {item.score && <span className="badge badge-sub">⭐ {item.score}</span>}
                  {!item.score && item.sub_episodes !== '0' && <span className="badge badge-sub">SUB</span>}
                  {item.dub_episodes !== '0' && <span className="badge badge-dub">DUB</span>}
                </div>
              </div>
              <div className="result-card-info">
                <p className="result-title">{item.title}</p>
                <div className="result-meta">
                  <span className="badge badge-source" style={{textTransform:'capitalize'}}>{item.source === 'jikan' ? 'MAL' : item.source}</span>
                  <span style={{color:'var(--text-muted)',fontSize:12}}>{item.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
