import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

/**
 * Cinematic anime card component — streaming-app style.
 * Used across Home, Search, Browse, and Schedule pages.
 */
export default function AnimeCard({ anime, onClick, progress, badge, wide = false, style = {} }) {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)

  if (!anime) return null

  const title = anime.title || anime.animeTitle || anime.titleEnglish || anime.name || 'Unknown'
  const cover = anime.cover || anime.thumbnail || anime.image || anime.coverImage?.large || ''
  const score = anime.score || anime.averageScore
  const type = anime.type || anime.format || ''
  const epCount = anime.episodes || anime.subEpisodes
  const targetId = anime.id || anime.animeId || anime.malId

  const epNum = anime.episode || anime.sub_episodes || anime.episodeNumber || anime.ep
  const displayBadge = badge || (epNum && epNum !== '0' ? `EP ${epNum}` : null)

  const cardWidth = wide ? 185 : 148

  const goToDetails = () => {
    if (targetId && String(targetId).match(/^\d+$/)) navigate(`/anime/${targetId}`)
    else if (title && title !== 'Unknown') navigate('/anime/0', { state: { searchQuery: title } })
  }

  const handleClick = () => { if (onClick) { onClick(anime); return } goToDetails() }
  const handleGoToDetails = (e) => { e.stopPropagation(); goToDetails() }

  return (
    <div
      className="anime-card"
      onClick={handleClick}
      style={{ width: cardWidth, flexShrink: 0, cursor: 'pointer', ...style }}
    >
      {/* Poster Container — 2:3 aspect ratio */}
      <div style={{
        width: cardWidth,
        aspectRatio: '2/3',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #0e0f1e, #141528)',
        marginBottom: 9,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
        transition: 'box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Cover Image */}
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' }}
            className="card-poster"
            onError={e => { e.target.onerror = null; e.target.style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.4 }}>🎬</div>
        )}

        {/* Top-left: Score badge */}
        {score && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(10px)',
            padding: '3px 8px', borderRadius: 7, fontSize: 11, fontWeight: 800,
            color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3,
            border: '1px solid rgba(245,158,11,0.25)', letterSpacing: '0.01em',
          }}>
            ★ {typeof score === 'number' && score > 10 ? (score / 10).toFixed(1) : score}
          </div>
        )}

        {/* Top-right: Type badge */}
        {type && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(7,8,15,0.8)', backdropFilter: 'blur(10px)',
            padding: '3px 7px', borderRadius: 7, fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {type}
          </div>
        )}

        {/* Bottom EP badge */}
        {displayBadge && (
          <div style={{
            position: 'absolute', bottom: progress > 0 ? 8 : 8, left: 8,
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            padding: '3px 9px', borderRadius: 7, fontSize: 10, fontWeight: 800,
            color: '#fff', letterSpacing: '0.03em',
            boxShadow: '0 2px 10px rgba(79,70,229,0.4)',
          }}>
            {displayBadge}
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.5)' }}>
            <div style={{
              height: '100%', width: `${Math.min(progress, 100)}%`,
              background: progress >= 85 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #4f46e5, #3b82f6)',
              borderRadius: '0 2px 2px 0',
              boxShadow: progress >= 85 ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(79,70,229,0.5)',
            }} />
          </div>
        )}

        {/* Hover overlay — Netflix-style bottom reveal */}
        <div className="anime-card-overlay" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(0deg, rgba(7,8,15,0.96) 0%, rgba(7,8,15,0.6) 38%, rgba(7,8,15,0.1) 70%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '12px 10px 10px', gap: 8,
          opacity: 0, transition: 'opacity 0.28s ease',
        }}>
          {/* In-card title */}
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {title}
          </div>
          {/* Action row */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Play button */}
            <div className="card-play-btn" style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 0 20px rgba(79,70,229,0.6)', paddingLeft: 2,
              flexShrink: 0, transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            {/* Details button */}
            <button
              onClick={handleGoToDetails}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 7,
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Title below card */}
      <div style={{ padding: '0 2px' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: epCount ? 3 : 0,
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

