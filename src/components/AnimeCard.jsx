import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

/**
 * Miruro-inspired anime card component.
 * Features 2:3 aspect ratio, obsidian background, vivid violet hover effects,
 * rating badge, CC/MIC (Sub/Dub) metadata chips, and centered play button.
 */
export default function AnimeCard({
  anime,
  onClick,
  progress,
  badge,
  rank,
  wide = false,
  style = {},
}) {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)

  if (!anime) return null

  const title =
    anime.title ||
    anime.animeTitle ||
    anime.titleEnglish ||
    anime.name ||
    'Unknown'
  const cover =
    anime.cover ||
    anime.thumbnail ||
    anime.image ||
    anime.coverImage?.large ||
    ''
  const score = anime.score || anime.averageScore
  const type = anime.type || anime.format || 'TV'
  const epCount = anime.episodes || anime.subEpisodes
  const targetId = anime.id || anime.animeId || anime.malId

  const subEps = anime.sub_episodes || anime.sub || (typeof anime.subEpisodes === 'number' ? anime.subEpisodes : null)
  const dubEps = anime.dub_episodes || anime.dub || (typeof anime.dubEpisodes === 'number' ? anime.dubEpisodes : null)
  const epNum = anime.episode || anime.sub_episodes || anime.episodeNumber || anime.ep
  const displayBadge = badge || (epNum && epNum !== '0' ? `EP ${epNum}` : null)

  const cardWidth = wide ? 180 : 152

  const goToDetails = () => {
    if (targetId && String(targetId).match(/^\d+$/)) {
      navigate(`/anime/${targetId}`)
    } else if (title && title !== 'Unknown') {
      navigate('/anime/0', { state: { searchQuery: title } })
    }
  }

  const handleClick = (e) => {
    if (onClick) {
      onClick(anime)
      return
    }
    goToDetails()
  }

  const handleQuickDetails = (e) => {
    e.stopPropagation()
    goToDetails()
  }

  return (
    <div
      className="miruro-card"
      onClick={handleClick}
      style={{ width: cardWidth, flexShrink: 0, cursor: 'pointer', ...style }}
    >
      {/* Poster Container */}
      <div className="miruro-card-poster-wrap">
        {/* Cover Image */}
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="miruro-card-poster"
            onError={(e) => {
              e.target.onerror = null
              e.target.style.display = 'none'
            }}
          />
        ) : (
          <div className="miruro-card-fallback">🎬</div>
        )}

        {/* Top-Left: Rating Badge */}
        {score && (
          <div className="miruro-card-badge-score">
            ★ {typeof score === 'number' && score > 10 ? (score / 10).toFixed(1) : score}
          </div>
        )}

        {/* Top-Right: Format / Type Badge */}
        {type && (
          <div className="miruro-card-badge-type">
            {type}
          </div>
        )}

        {/* Rank Number (for Trending / Top 10) */}
        {rank && (
          <div className="miruro-card-rank-badge">
            <span className="rank-hash">#</span>{rank}
          </div>
        )}

        {/* Bottom Sub/Dub/Ep Chips */}
        <div className="miruro-card-bottom-chips">
          {displayBadge ? (
            <span className="chip-ep">{displayBadge}</span>
          ) : (
            <>
              {subEps && subEps !== '0' && (
                <span className="chip-sub" title={`${subEps} Subbed Episodes`}>
                  CC {subEps}
                </span>
              )}
              {dubEps && dubEps !== '0' && (
                <span className="chip-dub" title={`${dubEps} Dubbed Episodes`}>
                  MIC {dubEps}
                </span>
              )}
            </>
          )}
        </div>

        {/* Watch Progress Bar */}
        {progress > 0 && (
          <div className="miruro-card-progress-bar">
            <div
              className={`miruro-card-progress-fill${progress >= 85 ? ' complete' : ''}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Miruro Hover Overlay with Glowing Center Play Button */}
        <div className="miruro-card-hover-overlay">
          <div className="miruro-card-play-circle">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          </div>
          <button
            className="miruro-card-info-btn"
            onClick={handleQuickDetails}
            title="View Details"
          >
            Details
          </button>
        </div>
      </div>

      {/* Info Below Card */}
      <div className="miruro-card-info">
        <h4 className="miruro-card-title" title={title}>
          {title}
        </h4>
        <div className="miruro-card-meta">
          <span>{type}</span>
          {epCount && <span>• {epCount} eps</span>}
        </div>
      </div>
    </div>
  )
}
