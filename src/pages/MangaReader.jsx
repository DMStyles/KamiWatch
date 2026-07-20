import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

const API = 'http://localhost:8642'

export default function MangaReader() {
  const { id, chapterId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { chapter, manga, chapters = [] } = location.state || {}

  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(() => localStorage.getItem('kamiwatch-manga-mode') || 'strip') // 'strip' | 'paged'
  const [currentPage, setCurrentPage] = useState(0)
  const stripRef = useRef(null)

  // Apply manga theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    return () => document.body.classList.remove('manga-mode')
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (mode === 'paged') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNextPage()
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrevPage()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, currentPage, pages.length])

  useEffect(() => {
    fetchPages()
    setCurrentPage(0)
  }, [chapterId])

  const fetchPages = async () => {
    setLoading(true)
    setPages([])
    try {
      const r = await fetch(`${API}/manga/pages?id=${encodeURIComponent(decodeURIComponent(chapterId))}`)
      const data = await r.json()
      setPages(data.pages || [])

      // Save to manga history
      if (manga && chapter) {
        try {
          const historyStr = localStorage.getItem('kamiwatch-manga-history') || '[]'
          let history = JSON.parse(historyStr)
          // Remove existing entry for same manga
          history = history.filter(h => h.mangaId !== id)
          // Add new entry at the top
          history.unshift({
            mangaId: id,
            mangaTitle: manga.title || 'Unknown',
            cover: manga.cover || '',
            source: manga.source || 'mangadex',
            chapterId: chapterId,
            chapterNumber: chapter.chapter || chapter.number || '?',
            chapterTitle: chapter.title || `Chapter ${chapter.chapter || '?'}`,
            readAt: new Date().toISOString()
          })
          // Keep only last 20
          history = history.slice(0, 20)
          localStorage.setItem('kamiwatch-manga-history', JSON.stringify(history))
        } catch {}
      }
    } catch {
      setPages([])
    }
    setLoading(false)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    localStorage.setItem('kamiwatch-manga-mode', newMode)
    setCurrentPage(0)
  }

  const goNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(p + 1, pages.length - 1))
  }, [pages.length])

  const goPrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(p - 1, 0))
  }, [])

  // Chapter navigation
  const currentChapterIdx = chapters.findIndex(ch => ch.id === decodeURIComponent(chapterId))
  const prevChapter = currentChapterIdx > 0 ? chapters[currentChapterIdx - 1] : null
  const nextChapter = currentChapterIdx >= 0 && currentChapterIdx < chapters.length - 1 ? chapters[currentChapterIdx + 1] : null

  const goChapter = (ch) => {
    navigate(`/manga/${id}/read/${encodeURIComponent(ch.id)}`, {
      state: { chapter: ch, manga, chapters },
      replace: true
    })
  }

  return (
    <div className="manga-reader-page">
      {/* Top bar */}
      <div className="manga-reader-topbar">
        <button className="manga-reader-back-btn" onClick={() => navigate(`/manga/${id}`, { state: { manga } })}>
          ← Back
        </button>

        <div className="manga-reader-title">
          {manga?.title} — Ch. {chapter?.number}
        </div>

        {/* Chapter prev/next */}
        <div className="manga-reader-controls">
          <button
            className="manga-reader-nav-btn"
            onClick={() => prevChapter && goChapter(prevChapter)}
            disabled={!prevChapter}
            title="Previous Chapter"
          >
            ‹‹
          </button>
          <span className="manga-reader-page-counter" style={{ minWidth: 80, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Ch. {chapter?.number}
          </span>
          <button
            className="manga-reader-nav-btn"
            onClick={() => nextChapter && goChapter(nextChapter)}
            disabled={!nextChapter}
            title="Next Chapter"
          >
            ››
          </button>
        </div>

        {/* Mode toggle */}
        <div className="manga-reader-controls">
          <button
            className={`manga-reader-mode-btn${mode === 'strip' ? ' active' : ''}`}
            onClick={() => switchMode('strip')}
            title="Long-strip (vertical scroll)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>
            Strip
          </button>
          <button
            className={`manga-reader-mode-btn${mode === 'paged' ? ' active' : ''}`}
            onClick={() => switchMode('paged')}
            title="Page-by-page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
            Paged
          </button>
        </div>

        {/* Page counter (paged mode only) */}
        {mode === 'paged' && pages.length > 0 && (
          <div className="manga-reader-page-counter">
            {currentPage + 1} / {pages.length}
          </div>
        )}
      </div>

      {/* Reader Content */}
      {loading ? (
        <div className="manga-reader-loading">
          <span className="spinner" style={{ width: 40, height: 40 }} />
          <span>Loading pages...</span>
        </div>
      ) : pages.length === 0 ? (
        <div className="manga-reader-loading">
          {chapter?.externalUrl ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 15 }}>🔗</div>
              <span style={{ fontSize: 16, marginBottom: 12 }}>This chapter is hosted on an external site.</span>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, maxWidth: 400, textAlign: 'center' }}>
                MangaDex redirects to official publishers (like MangaPlus) for this chapter.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="manga-read-btn"
                  onClick={() => {
                    if (window.electronAPI) {
                      window.electronAPI.openExternal(chapter.externalUrl)
                    } else {
                      window.open(chapter.externalUrl, '_blank')
                    }
                  }}
                  style={{ background: 'var(--manga-primary)', color: '#000' }}
                >
                  🌐 Open Official Source
                </button>
                <button
                  className="manga-reader-back-btn"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48 }}>😞</div>
              <span>No pages found for this chapter.</span>
              <button
                className="manga-reader-back-btn"
                onClick={() => navigate(-1)}
                style={{ marginTop: 12 }}
              >
                Go Back
              </button>
            </>
          )}
        </div>
      ) : mode === 'strip' ? (
        /* Long-strip mode */
        <div className="manga-reader-strip" ref={stripRef}>
          {pages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Page ${i + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{ width: '100%', maxWidth: 800, display: 'block' }}
            />
          ))}
          {/* Next chapter prompt at the bottom */}
          {nextChapter && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: 13 }}>End of Chapter {chapter?.number}</span>
              <button className="manga-read-btn" onClick={() => goChapter(nextChapter)}>
                Next: Chapter {nextChapter.number} →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Page-by-page mode */
        <div className="manga-reader-paged">
          <button
            className="manga-reader-paged-arrow left"
            onClick={goPrevPage}
            disabled={currentPage === 0}
          >
            ‹
          </button>

          <img
            className="manga-reader-paged-img"
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            referrerPolicy="no-referrer"
          />

          <button
            className="manga-reader-paged-arrow right"
            onClick={() => {
              if (currentPage === pages.length - 1) {
                if (nextChapter) goChapter(nextChapter)
              } else {
                goNextPage()
              }
            }}
            disabled={currentPage === pages.length - 1 && !nextChapter}
          >
            {currentPage === pages.length - 1 && nextChapter ? '›› Next Ch.' : '›'}
          </button>
        </div>
      )}
    </div>
  )
}
