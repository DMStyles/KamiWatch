import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

const API = 'http://localhost:8642'

export default function MangaDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const mangaFromState = location.state?.manga

  const [details, setDetails] = useState(mangaFromState || null)
  const [chapters, setChapters] = useState([])
  const [loadingChapters, setLoadingChapters] = useState(true)
  const [sortAsc, setSortAsc] = useState(true)
  const [mangaSources, setMangaSources] = useState([
    { id: 'auto', name: 'Auto (MangaDex / Kakalot)' }
  ])
  const [selectedSource, setSelectedSource] = useState('auto')

  // Apply manga theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    loadMangaExtensions()
    return () => document.body.classList.remove('manga-mode')
  }, [])

  const loadMangaExtensions = async () => {
    try {
      const list = await window.electronAPI?.extensions?.list() || []
      const mangaExts = list
        .filter(item => {
          const type = (item.manifest?.type || '').toLowerCase()
          return type.includes('manga') || type.includes('plugin')
        })
        .map(item => ({
          id: `ext_${item.manifest.id}`,
          name: `🧩 ${item.manifest.name} (Plugin)`,
          extId: item.manifest.id
        }))
      setMangaSources([{ id: 'auto', name: 'Auto (MangaDex / Kakalot)' }, ...mangaExts])
    } catch {}
  }

  // Fetch full details if not passed via state
  useEffect(() => {
    if (!mangaFromState || !mangaFromState.description) {
      fetchDetails()
    }
    fetchChapters(selectedSource)
  }, [id, selectedSource])

  const fetchDetails = async () => {
    try {
      const r = await fetch(`${API}/manga/details?id=${encodeURIComponent(decodeURIComponent(id))}`)
      const data = await r.json()
      if (!data.error) setDetails(data)
    } catch {}
  }

  const fetchChapters = async (sourceId = selectedSource) => {
    setLoadingChapters(true)
    setChapters([])
    try {
      if (sourceId.startsWith('ext_')) {
        const extId = sourceId.replace('ext_', '')
        const title = details?.title || mangaFromState?.title || id
        // 1. Search provider for manga ID
        const searchRes = await window.electronAPI?.extensions?.callProvider(extId, 'search', [{ query: title }])
        const firstMatch = searchRes?.result?.[0]
        const mId = firstMatch?.id || firstMatch?.url || title
        
        // 2. Fetch chapters
        const chRes = await window.electronAPI?.extensions?.callProvider(extId, 'findChapters', [mId])
        const chList = (chRes?.result || []).map(c => ({
          id: c.id || c.url,
          title: c.title || `Chapter ${c.chapter || 1}`,
          chapter: c.chapter || 1,
          extId
        }))
        setChapters(chList)
      } else {
        const r = await fetch(`${API}/manga/chapters?id=${encodeURIComponent(decodeURIComponent(id))}`)
        const data = await r.json()
        setChapters(data.chapters || [])
      }
    } catch {
      setChapters([])
    }
    setLoadingChapters(false)
  }

  const handleReadChapter = (chapter) => {
    navigate(`/manga/${id}/read/${encodeURIComponent(chapter.id)}`, {
      state: { chapter, manga: details, chapters, selectedSource }
    })
  }

  const displayedChapters = sortAsc ? [...chapters] : [...chapters].reverse()

  return (
    <div className="manga-details-page">
      {/* Hero Banner */}
      <div
        className="manga-details-hero"
        style={{ backgroundImage: details?.cover ? `url(${details.cover})` : 'none', backgroundColor: '#0d0a05' }}
      >
        <div className="manga-details-hero-overlay" />
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 5 }}>
          <button
            className="manga-reader-back-btn"
            onClick={() => navigate('/manga')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="manga-details-container">
        {/* Left: Cover */}
        <div>
          {details?.cover ? (
            <img className="manga-details-cover" src={details.cover} alt={details?.title} />
          ) : (
            <div className="manga-details-cover" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, borderRadius: 12 }}>
              📚
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="manga-details-right">
          <h1 className="manga-details-title">{details?.title || 'Loading...'}</h1>

          <div className="manga-details-meta">
            {details?.status && <span className="manga-badge">{details.status}</span>}
            {details?.year && <span className="manga-badge manga-badge-neutral">{details.year}</span>}
            {details?.author && <span className="manga-badge manga-badge-neutral">✍️ {details.author}</span>}
          </div>

          {/* Manga Provider Selector */}
          <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Manga Source:</span>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, outline: 'none'
              }}
            >
              {mangaSources.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0e0e16' }}>{s.name}</option>
              ))}
            </select>
          </div>

          {details?.description && (
            <p className="manga-description">{details.description}</p>
          )}

          {details?.genres && details.genres.length > 0 && (
            <div className="manga-genres">
              {details.genres.slice(0, 12).map(g => (
                <span key={g} className="manga-genre-tag">{g}</span>
              ))}
            </div>
          )}

          {/* Read First / Latest Chapter */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {chapters.length > 0 && (
              <>
                <button
                  className="manga-read-btn"
                  onClick={() => handleReadChapter(chapters[0])}
                >
                  📖 Read First Chapter
                </button>
                <button
                  className="manga-read-btn"
                  style={{ background: 'rgba(217,119,6,0.15)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.3)' }}
                  onClick={() => handleReadChapter(chapters[chapters.length - 1])}
                >
                  ⏩ Latest Chapter
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div style={{ maxWidth: 1000, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
            Chapters ({chapters.length})
          </h2>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            style={{
              padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            {sortAsc ? '⬆️ Oldest First' : '⬇️ Newest First'}
          </button>
        </div>

        {loadingChapters ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13 }}>Fetching chapter list...</p>
          </div>
        ) : displayedChapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No chapters found for this manga source.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {displayedChapters.map((ch, i) => (
              <div
                key={ch.id || i}
                onClick={() => handleReadChapter(ch)}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-manga)'
                  e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ch.title || `Chapter ${ch.chapter || i + 1}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent-manga)' }}>Read →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
