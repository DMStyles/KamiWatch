import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MangaCard({ manga, badge, onClick, style = {} }) {
  const navigate = useNavigate()
  
  if (!manga) return null

  // Support both MangaDex items and AniList items
  const title = manga.title || manga.titleEnglish || 'Unknown'
  const cover = manga.cover || manga.image || ''
  const status = manga.status
  const year = manga.year
  const englishTitle = manga.titleEnglish && manga.titleEnglish !== manga.title ? manga.titleEnglish : null
  
  const handleClick = (e) => {
    if (onClick) {
      onClick(manga)
      return
    }
    if (manga.id) {
      navigate(`/manga/${encodeURIComponent(manga.id)}`, { state: { manga } })
    }
  }

  const getStatusColor = (s) => {
    const lower = (s || '').toLowerCase()
    if (lower === 'ongoing' || lower === 'publishing') return '#10b981'
    if (lower === 'completed' || lower === 'finished') return '#60a5fa'
    if (lower === 'new') return '#f59e0b'
    return '#fbbf24'
  }

  return (
    <div
      className="manga-card"
      onClick={handleClick}
      style={style}
    >
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
        {cover ? (
          <img
            className="manga-card-cover manga-card-cover-img"
            src={cover}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className="manga-card-cover-placeholder" style={{ display: cover ? 'none' : 'flex' }}>
          📚
        </div>

        <div className="manga-card-overlay">
          <div className="manga-card-play-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div style={{
            position: 'absolute', bottom: 8, left: 8, right: 8,
            fontSize: 11, fontWeight: 700, color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}>
            Read Now
          </div>
        </div>

        {badge && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(16, 185, 129, 0.9)', color: '#fff',
            fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
            zIndex: 2, pointerEvents: 'none'
          }}>
            {badge}
          </div>
        )}

        {status && !badge && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            background: 'rgba(7,7,15,0.82)', backdropFilter: 'blur(6px)',
            padding: '3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            color: getStatusColor(status),
            border: `1px solid ${getStatusColor(status)}44`,
            textTransform: 'capitalize'
          }}>
            {status.replace('_', ' ').toLowerCase()}
          </div>
        )}

        {year && (
          <div style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(7,7,15,0.82)', backdropFilter: 'blur(6px)',
            padding: '3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.6)'
          }}>
            {year}
          </div>
        )}
      </div>

      <div className="manga-card-info">
        <div className="manga-card-title">{title}</div>
        {englishTitle && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {englishTitle}
          </div>
        )}
      </div>
    </div>
  )
}
