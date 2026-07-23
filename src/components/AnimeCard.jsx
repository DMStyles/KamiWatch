import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

/**
 * Unified glassmorphism anime card component.
 * Used across Home, Search, Browse, and Schedule pages.
 *
 * Props:
 *   anime    — { id, animeId, malId, title, animeTitle, cover, thumbnail, image, score, type, episodes, subEpisodes, dubEpisodes, episodeNumber }
 *   onClick  — override default navigation (optional)
 *   progress — 0–100 watched progress (optional)
 *   badge    — string badge text (optional)
 *   wide     — if true, uses wider card (for episode rows)
 *   style    — additional styles
 */
export default function AnimeCard({ anime, onClick, progress, badge, wide = false, style = {} }) {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)

  if (!anime) return null

  // Fallbacks to support both standard API objects and history items
  const title = anime.title || anime.animeTitle || anime.titleEnglish || anime.name || 'Unknown'
  const cover = anime.cover || anime.thumbnail || anime.image || anime.coverImage?.large || ''
  const score = anime.score || anime.averageScore
  const type = anime.type || anime.format || ''
  const epCount = anime.episodes || anime.subEpisodes
  const targetId = anime.id || anime.animeId || anime.malId
  const displayBadge = badge || (anime.episodeNumber ? `EP ${anime.episodeNumber}` : null)

  const handleClick = (e) => {
    if (onClick) { onClick(anime); return }
    if (targetId && String(targetId).match(/^\d+$/)) {
      navigate(`/anime/${targetId}`)
    } else if (anime.url && !anime.url.startsWith('anikoto:')) {
      setEpisodeModal({ title, url: anime.url, thumbnail: cover, source: anime.source || 'anikoto', id: targetId })
    } else if (title && title !== 'Unknown') {
      navigate('/search', { state: { searchQuery: title } })
    }
  }

  const handleGoToDetails = (e) => {
    e.stopPropagation()
    if (targetId && String(targetId).match(/^\d+$/)) {
      navigate(`/anime/${targetId}`)
    } else {
      navigate('/search', { state: { searchQuery: title } })
    }
  }

  const cardWidth = wide ? 190 : 150
  const cardHeight = wide ? 272 : 215

  return (
    <div
      className="anime-card"
      onClick={handleClick}
      style={{ width: cardWidth, flexShrink: 0, cursor: 'pointer', ...style }}
    >
      {/* Poster */}
      <div
        className="anime-card-img"
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          background: '#111120',
          marginBottom: 8,
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            className="card-poster"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111120, #1a1a30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            🎬
          </div>
        )}

        {/* Hover overlay */}
        <div className="anime-card-overlay">
          <div className="card-play-btn" title="View Details / Watch">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>

          {/* Quick Details Button */}
          <button
            onClick={handleGoToDetails}
            title="Anime Details Page"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(7,7,15,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(7,7,15,0.85)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >
            ℹ️ Details
          </button>
        </div>

        {/* Score badge */}
        {score && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            background: 'rgba(7,7,15,0.82)',
            backdropFilter: 'blur(8px)',
            padding: '3px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            ★ {typeof score === 'number' && score > 10 ? (score / 10).toFixed(1) : score}
          </div>
        )}

        {/* Type badge */}
        {type && (
          <div style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(7,7,15,0.82)',
            backdropFilter: 'blur(8px)',
            padding: '3px 7px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {type}
          </div>
        )}

        {/* Custom badge (e.g. NEW, EP 5) */}
        {displayBadge && (
          <div style={{
            position: 'absolute', bottom: 7, left: 7,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
          }}>
            {displayBadge}
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.1)',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              background: progress >= 85
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              borderRadius: '0 2px 2px 0',
            }} />
          </div>
        )}
      </div>

      {/* Info below poster */}
      <div style={{ padding: '0 2px' }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          marginBottom: 4,
        }}>
          {title}
        </div>
        {epCount && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {epCount} eps
          </div>
        )}
      </div>
    </div>
  )
}
