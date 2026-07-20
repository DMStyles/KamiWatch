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

  // Apply manga theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    return () => document.body.classList.remove('manga-mode')
  }, [])

  // Fetch full details if not passed via state
  useEffect(() => {
    if (!mangaFromState || !mangaFromState.description) {
      fetchDetails()
    }
    fetchChapters()
  }, [id])

  const fetchDetails = async () => {
    try {
      const r = await fetch(`${API}/manga/details?id=${encodeURIComponent(decodeURIComponent(id))}`)
      const data = await r.json()
      if (!data.error) setDetails(data)
    } catch {}
  }

  const fetchChapters = async () => {
    setLoadingChapters(true)
    try {
      const r = await fetch(`${API}/manga/chapters?id=${encodeURIComponent(decodeURIComponent(id))}`)
      const data = await r.json()
      setChapters(data.chapters || [])
    } catch {
      setChapters([])
    }
    setLoadingChapters(false)
  }

  const handleReadChapter = (chapter) => {
    navigate(`/manga/${id}/read/${encodeURIComponent(chapter.id)}`, {
      state: { chapter, manga: details, chapters }
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
            {details?.source && (
              <span className="manga-badge manga-badge-neutral">
                {details.source === 'mangadex' ? '📖 MangaDex' : '🔄 MangaKakalot'}
              </span>
            )}
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
      <div className="manga-chapters-section">
        <div className="manga-chapters-header">
          <span className="manga-chapters-title">
            📋 Chapters {!loadingChapters && `(${chapters.length})`}
          </span>
          <button
            className="manga-chapters-sort-btn"
            onClick={() => setSortAsc(a => !a)}
          >
            {sortAsc ? '↑ Oldest First' : '↓ Newest First'}
          </button>
        </div>

        {loadingChapters ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <span className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 12 }}>No chapters found in English on this source.</p>
            {details?.source === 'mangadex' && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', background: 'var(--manga-primary)', color: '#000', fontWeight: 'bold' }}
                onClick={() => navigate('/manga', { state: { query: details.title, forceSource: 'mangakakalot' } })}
              >
                Search on MangaKakalot instead
              </button>
            )}
          </div>
        ) : (
          <div className="manga-chapters-list">
            {displayedChapters.map((ch, i) => (
              <div
                key={ch.id || i}
                className="manga-chapter-row"
                onClick={() => handleReadChapter(ch)}
              >
                <div className="manga-chapter-left">
                  <span className="manga-chapter-num">Chapter {ch.number}</span>
                  {ch.title && ch.title !== `Chapter ${ch.number}` && (
                    <span className="manga-chapter-title">{ch.title}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {ch.pages > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.pages}p</span>
                  )}
                  <button className="manga-chapter-read-btn" onClick={e => { e.stopPropagation(); handleReadChapter(ch) }}>
                    Read →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
