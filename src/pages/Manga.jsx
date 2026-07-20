import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API = 'http://localhost:8642'

export default function Manga() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [query, setQuery] = useState(location.state?.query || '')
  const [source, setSource] = useState(location.state?.forceSource || 'auto')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [trending, setTrending] = useState([])
  const [activeGenre, setActiveGenre] = useState(null)

  const GENRES = [
    { label: 'Action', tag: '391b0423-d847-456f-aff0-8b0cfc03066b' },
    { label: 'Adventure', tag: '87cc87cd-a395-47af-b27a-93258283bbc6' },
    { label: 'Comedy', tag: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
    { label: 'Drama', tag: 'b9af3a63-f058-46de-a9a0-e0c13906197a' },
    { label: 'Fantasy', tag: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
    { label: 'Horror', tag: 'cdad7e68-1419-41dd-bdce-27753074a640' },
    { label: 'Romance', tag: '423e2eae-a7a2-4a8b-ac03-a8351462d71d' },
    { label: 'Sci-Fi', tag: '256c8bd9-4904-4360-bf4f-508a76d67183' },
    { label: 'Slice of Life', tag: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
    { label: 'Mystery', tag: 'ee968100-4191-4968-93d3-f82d72be7e46' },
    { label: 'Supernatural', tag: 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75' },
    { label: 'Sports', tag: '69964a64-2f90-4d33-beeb-f3ed2875eb4c' },
    { label: 'Mecha', tag: '50880a9d-5440-4732-9afb-8f457127e836' },
    { label: 'School Life', tag: 'caaa44eb-cd40-4177-b930-79d3ef2afe87' },
    { label: 'Psychological', tag: '3b60b75c-a2d7-4860-ab56-05f391bb889c' },
    { label: 'Martial Arts', tag: '799c202e-7daa-44eb-9cf7-8a3c0441531e' },
    { label: 'Isekai', tag: 'ace04997-f6bd-436e-b261-779182193d3d' },
    { label: 'Shounen', demo: 'shounen' },
    { label: 'Seinen', demo: 'seinen' },
    { label: 'Shoujo', demo: 'shoujo' },
    { label: 'Josei', demo: 'josei' },
  ]

  // Apply manga-mode class to body for amber theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    return () => document.body.classList.remove('manga-mode')
  }, [])

  // Load trending / popular manga on mount via MangaDex top titles
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const r = await fetch(`${API}/manga/search?q=one+piece&source=mangadex`)
        const data = await r.json()
        // Just use a variety of popular searches to fill the grid
        const r2 = await fetch(`${API}/manga/search?q=naruto&source=mangadex`)
        const data2 = await r2.json()
        const combined = [...(data.results || []).slice(0, 6), ...(data2.results || []).slice(0, 6)]
        setTrending(combined)
      } catch {}
    }
    loadTrending()
    
    // Auto trigger search if navigated with state
    if (location.state?.query) {
      handleSearch(null, location.state.query, location.state.forceSource || 'auto')
    }
  }, [])

  const handleSearch = async (e, forceQuery, forceSource) => {
    e?.preventDefault()
    const q = forceQuery || query
    const s = forceSource || source
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const r = await fetch(`${API}/manga/search?q=${encodeURIComponent(q.trim())}&source=${s}`)
      const data = await r.json()
      setResults(data.results || [])
      setActiveGenre(null)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenre = async (genre) => {
    setLoading(true)
    setSearched(true)
    setActiveGenre(genre.label)
    try {
      let url = `${API}/manga/genre?`
      if (genre.tag) url += `genre_id=${genre.tag}`
      if (genre.demo) url += `demographic=${genre.demo}`
      const r = await fetch(url)
      const data = await r.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const displayResults = searched ? results : trending

  return (
    <div className="manga-page">
      {/* Hero Search Bar */}
      <div className="manga-hero-bar">
        <div className="manga-hero-eyebrow">
          <span className="manga-hero-icon">📚</span>
          <span className="manga-hero-label">Manga Reader</span>
        </div>
        <h1 className="manga-hero-title">Read Manga Online</h1>
        <p className="manga-hero-sub">Search millions of titles across MangaDex and more</p>

        <form className="manga-search-bar" onSubmit={handleSearch}>
          <input
            className="manga-search-input"
            type="text"
            placeholder="Search manga titles, e.g. Naruto, Attack on Titan..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="manga-search-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search
              </>
            )}
          </button>
        </form>

        <div className="manga-source-tabs">
          {[
            { id: 'auto', label: '⚡ Auto (Best)' },
            { id: 'mangadex', label: '📖 MangaDex' },
            { id: 'mangakakalot', label: '🔄 MangaKakalot' },
          ].map(s => (
            <button
              key={s.id}
              className={`manga-source-tab${source === s.id ? ' active' : ''}`}
              onClick={() => setSource(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="manga-genre-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '24px', maxWidth: '800px', margin: '24px auto 0' }}>
          {GENRES.map(g => (
            <button 
              key={g.label}
              className={`manga-tag-btn ${activeGenre === g.label ? 'active' : ''}`}
              onClick={() => handleGenre(g)}
              style={{
                background: activeGenre === g.label ? 'var(--manga-primary)' : 'rgba(255,255,255,0.05)',
                color: activeGenre === g.label ? '#000' : 'var(--text-muted)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: activeGenre === g.label ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="manga-results-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : (
          <>
            <div className="manga-results-label">
              {searched
                ? (activeGenre ? `🔥 Popular in ${activeGenre}` : `${displayResults.length} results for "${query}"`)
                : '📈 Popular Titles'}
            </div>
            {displayResults.length === 0 && searched ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p>No manga found for "{activeGenre || query}".</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>Try a different source or spelling.</p>
              </div>
            ) : (
              <div className="manga-grid">
                {displayResults.map((manga, i) => (
                  <div
                    key={manga.id || i}
                    className="manga-card"
                    onClick={() => navigate(`/manga/${encodeURIComponent(manga.id)}`, { state: { manga } })}
                  >
                    {manga.cover ? (
                      <img
                        className="manga-card-cover"
                        src={manga.cover}
                        alt={manga.title}
                        loading="lazy"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                    ) : null}
                    <div className="manga-card-cover-placeholder" style={{ display: manga.cover ? 'none' : 'flex' }}>
                      📚
                    </div>
                    <div className="manga-card-info">
                      <div className="manga-card-title">{manga.title}</div>
                      {manga.status && <div className="manga-card-badge">{manga.status}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
