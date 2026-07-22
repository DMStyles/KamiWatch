import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API = 'http://localhost:8642'

const MANGA_HERO_SLIDES = [
  {
    title: 'Solo Leveling',
    synopsis: 'In a world where hunters must battle deadly monsters to protect mankind, Sung Jinwoo, the weakest of them all, finds a system that levels him up...',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-fXqIOk6yP17P.jpg',
  },
  {
    title: 'Chainsaw Man',
    synopsis: 'Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life...',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105778-hQhXQ1qYcK11.jpg',
  },
  {
    title: 'Oshi no Ko',
    synopsis: 'Gorou is a gynecologist and idol fan who\'s in for a shock when his favorite star, Ai, announces an impromptu hiatus...',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/117423-B2eYt1c3U53p.jpg',
  },
  {
    title: 'Dandadan',
    synopsis: 'Momo Ayase strikes up an unusual friendship with her school\'s UFO fanatic, whom she nicknames "Okarun"...',
    image: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/132029-4yW39wR4uFqY.jpg',
  }
]

export default function Manga() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [query, setQuery] = useState(location.state?.query || '')
  const [source, setSource] = useState(location.state?.forceSource || 'auto')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeGenre, setActiveGenre] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [heroIdx, setHeroIdx] = useState(0)

  const GENRES = [
    { label: 'Action', tag: '391b0423-d847-456f-aff0-8b0cfc03066b' },
    { label: 'Adventure', tag: '87cc87cd-a395-47af-b27a-93258283bbc6' },
    { label: 'Comedy', tag: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
    { label: 'Drama', tag: 'b9af3a63-f058-46de-a9a0-e0c13906197a' },
    { label: 'Fantasy', tag: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
    { label: 'Martial Arts', tag: '799c202e-7daa-44eb-9cf7-8a3c0441531e' },
    { label: 'Shounen', demo: 'shounen' },
    
    { label: 'Horror', tag: 'cdad7e68-1419-41dd-bdce-27753074a640' },
    { label: 'Supernatural', tag: 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75' },
    { label: 'Harem', tag: 'aafb99c1-7f60-43fa-b75f-fc9502ce29c7' },
    { label: 'Psychological', tag: '3b60b75c-a2d7-4860-ab56-05f391bb889c' },
    { label: 'Romance', tag: '423e2eae-a7a2-4a8b-ac03-a8351462d71d' },
    { label: 'School Life', tag: 'caaa44eb-cd40-4177-b930-79d3ef2afe87' },
    { label: 'Shoujo', demo: 'shoujo' },
    
    { label: 'Mystery', tag: 'ee968100-4191-4968-93d3-f82d72be7e46' },
    { label: 'Sci-Fi', tag: '256c8bd9-4904-4360-bf4f-508a76d67183' },
    { label: 'Seinen', demo: 'seinen' },
    { label: 'Tragedy', tag: 'f8f62932-27da-4fe4-8ee1-6779a8c5edba' },
    { label: 'Sports', tag: '69964a64-2f90-4d33-beeb-f3ed2875eb4c' },
    { label: 'Slice of Life', tag: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
    
    { label: 'Girls\' Love (Yuri)', tag: 'a3c67850-4684-404e-9b7f-c69850ee5da6' },
    { label: 'Boys\' Love (Yaoi)', tag: '5920b825-4181-4a17-beeb-9918b0ff7a30' },
    { label: 'Webtoon', tag: 'e197df38-d0e7-43b5-9b09-2842d0c326dd' },
    { label: 'Doujinshi', tag: 'b13b2a48-c720-44a9-9c77-39c9979373fb' },
    { label: 'One Shot', tag: '0234a31e-a729-4e28-9d6a-3f87c4966b9e' },
    
    { label: 'Josei', demo: 'josei' },
    { label: 'Historical', tag: '33771934-028e-4cb3-8744-691e866a923e' },
    { label: 'Gender Bender', tag: '2bd2e8d0-f146-434a-9b51-fc9ff2c5fe6a' },
    { label: 'Mecha', tag: '50880a9d-5440-4732-9afb-8f457127e836' },
    { label: 'Isekai', tag: 'ace04997-f6bd-436e-b261-779182193d3d' },
  ]

  // Apply manga-mode class to body for amber theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    return () => document.body.classList.remove('manga-mode')
  }, [])

  // Load trending / popular manga on mount via MangaDex top titles
  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % MANGA_HERO_SLIDES.length), 6000)
    
    const loadTrending = async () => {
      try {
        const MDEX = 'https://api.mangadex.org'
        const MDEX_IMG = 'https://uploads.mangadex.org'
        const params = new URLSearchParams({
          limit: '60',
          'order[followedCount]': 'desc',
          'contentRating[]': 'safe',
          'includes[]': 'cover_art'
        })
        const r = await fetch(`${MDEX}/manga?${params}&contentRating[]=suggestive`)
        const raw = await r.json()
        const items = (raw.data || []).map(item => {
          const attrs = item.attributes || {}
          const title = (attrs.title || {}).en || Object.values(attrs.title || {})[0] || 'Unknown'
          const coverRel = (item.relationships || []).find(r => r.type === 'cover_art')
          const fileName = coverRel?.attributes?.fileName
          const cover = fileName ? `${MDEX_IMG}/covers/${item.id}/${fileName}.256.jpg` : ''
          return {
            id: `mdex:${item.id}`,
            title,
            cover,
            source: 'mangadex',
            status: attrs.status || 'unknown',
            year: attrs.year,
          }
        })
        setTrending(items)
      } catch {}
    }
    loadTrending()
    
    // Auto trigger search if navigated with state
    if (location.state?.query) {
      handleSearch(null, location.state.query, location.state.forceSource || 'auto')
    }

    return () => clearInterval(timer)
  }, [])

  const handleSearch = async (e, forceQuery, forceSource, page = 1) => {
    e?.preventDefault()
    const q = forceQuery || query
    const s = forceSource || source
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const r = await fetch(`${API}/manga/search?q=${encodeURIComponent(q.trim())}&source=${s}&page=${page}`)
      const data = await r.json()
      setResults(data.results || [])
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.currentPage || page)
      setActiveGenre(null)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleGenre = async (genre, page = 1) => {
    setLoading(true)
    setSearched(true)
    setActiveGenre(genre.label)
    try {
      const genreId = genre.tag || ''
      const demo = genre.demo || ''
      const r = await fetch(`${API}/manga/genre?genre_id=${genreId}&demographic=${demo}&page=${page}`)
      const data = await r.json()
      setResults(data.results || [])
      setTotalPages(data.totalPages || 1)
      setCurrentPage(data.currentPage || page)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const displayResults = searched ? results : trending
  const hero = MANGA_HERO_SLIDES[heroIdx]

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 50)
  }

  return (
    <div className="manga-page" onScroll={handleScroll}>
      {/* Hero Search Bar */}
      <div 
        className={`manga-hero-bar ${scrolled ? 'scrolled' : ''}`}
        style={!scrolled ? { backgroundImage: `url(${hero.image})`, backgroundSize: 'cover', backgroundPosition: 'center 20%' } : {}}
      >
        {!scrolled && <div className="manga-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,10,5,0.98) 0%, rgba(15,10,5,0.85) 40%, rgba(15,10,5,0.3) 100%), linear-gradient(to top, rgba(15,10,5,1) 0%, transparent 40%)', zIndex: 0 }} />}
        
        <div className="manga-hero-content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '600px' }}>
            <div className="manga-hero-eyebrow">
              <span className="manga-hero-icon">📚</span>
              <span className="manga-hero-label">Manga Reader</span>
            </div>
            <h1 className="manga-hero-title">{scrolled ? 'Read Manga Online' : hero.title}</h1>
            <p className="manga-hero-sub" style={{ height: scrolled ? 0 : '40px', overflow: 'hidden', transition: 'height 0.3s' }}>
              {hero.synopsis}
            </p>
          </div>

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
        </div>
        
        {!scrolled && (
          <div className="hero-dots" style={{ position: 'absolute', bottom: '24px', right: '32px', zIndex: 2, display: 'flex', gap: '6px' }}>
            {MANGA_HERO_SLIDES.map((_, i) => (
              <div 
                key={i}
                style={{
                  width: i === heroIdx ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === heroIdx ? 'var(--manga-primary)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 28px' }}>
        <div className="manga-source-tabs">
          {[
            { id: 'auto', label: '⚡ Auto (Best)' },
            { id: 'mangadex', label: '📖 MangaDex' },
            { id: 'mangakakalot', label: '🔄 MangaKakalot' },
            { id: 'mangaddict', label: '📙 MangaDict' },
            { id: 'webtoons', label: '💚 Webtoons' },
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

        <div className="manga-genre-tags hide-scroll" style={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px',
          marginTop: '16px', 
          width: '100%', 
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)'
        }}>
          {GENRES.map(g => (
            <button 
              key={g.label}
              className={`manga-tag-btn ${activeGenre === g.label ? 'active' : ''}`}
              onClick={() => handleGenre(g)}
              style={{
                flexShrink: 0,
                background: activeGenre === g.label ? 'var(--manga-primary)' : 'rgba(255,255,255,0.05)',
                color: activeGenre === g.label ? '#000' : 'var(--text-muted)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: activeGenre === g.label ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="manga-results-section" style={{ overflowY: 'visible', flex: 'none', paddingBottom: 60 }}>
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

        {/* Pagination Controls */}
        {!loading && searched && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                const nextP = currentPage - 1
                if (activeGenre) handleGenre(GENRES.find(g => g.label === activeGenre), nextP)
                else handleSearch(null, query, source, nextP)
              }}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontSize: '13px', fontWeight: '600'
              }}
            >
              ← Prev
            </button>

            {/* Render Page Numbers */}
            {Array.from({ length: Math.min(totalPages, 10) }, (_, idx) => {
              let pageNum = idx + 1
              if (totalPages > 10) {
                if (currentPage > 5) pageNum = currentPage - 5 + idx
                if (pageNum > totalPages) pageNum = totalPages - (9 - idx)
              }
              if (pageNum <= 0) return null
              const isActive = pageNum === currentPage
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    if (activeGenre) handleGenre(GENRES.find(g => g.label === activeGenre), pageNum)
                    else handleSearch(null, query, source, pageNum)
                  }}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                    background: isActive ? 'var(--manga-primary)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#000' : 'var(--text-primary)',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
                  }}
                >
                  {pageNum}
                </button>
              )
            })}

            <button 
              onClick={() => {
                const nextP = currentPage + 1
                if (activeGenre) handleGenre(GENRES.find(g => g.label === activeGenre), nextP)
                else handleSearch(null, query, source, nextP)
              }}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px', background: 'var(--manga-primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontSize: '13px'
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
