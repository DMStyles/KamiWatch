import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import AnimeCard from '../components/AnimeCard'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

export default function Discover() {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('For You')
  const [spotlightItems, setSpotlightItems] = useState([])
  const [spotlightIdx, setSpotlightIdx] = useState(0)
  const [allAnime, setAllAnime] = useState([])
  const [hiddenGems, setHiddenGems] = useState([])
  const [popularSeason, setPopularSeason] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        fetch(`${API}/jikan/hero-slides`).then(r => r.json()),
        fetch(`${API}/jikan/all?page=1`).then(r => r.json()),
        fetch(`${API}/jikan/hidden-gems`).then(r => r.json()),
      ])

      if (r1.status === 'fulfilled' && (r1.value.slides || r1.value.results)) {
        const slides = r1.value.slides || r1.value.results || []
        setSpotlightItems(slides.slice(0, 6))
      }

      if (r2.status === 'fulfilled') {
        const list = Array.isArray(r2.value) ? r2.value : (r2.value.results || r2.value.data || [])
        setAllAnime(list.slice(0, 24))
        setPopularSeason(list.slice(0, 14))
      }

      if (r3.status === 'fulfilled') {
        const gems = Array.isArray(r3.value) ? r3.value : (r3.value.results || r3.value.data || [])
        setHiddenGems(gems.slice(0, 14))
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  // Surprise me randomizer
  const handleSurpriseMe = () => {
    if (allAnime.length === 0) return
    const randomItem = allAnime[Math.floor(Math.random() * allAnime.length)]
    const targetId = randomItem.id || randomItem.mal_id || randomItem.malId
    if (targetId) navigate(`/anime/${targetId}`)
  }

  const activeSpotlight = spotlightItems[spotlightIdx] || spotlightItems[0]

  return (
    <div className="miruro-page-container">
      {/* Header: Discover + Subtitle + Right Controls (Screenshot 3 Match) */}
      <div className="miruro-discover-header">
        <div>
          <h1 className="miruro-page-heading">Discover</h1>
          <p className="miruro-page-subheading">Discover new anime across categories</p>
        </div>

        <div className="miruro-discover-actions">
          <button
            className={`miruro-discover-tab${activeTab === 'For You' ? ' active' : ''}`}
            onClick={() => setActiveTab('For You')}
          >
            For You
          </button>
          <button
            className="miruro-surprise-btn"
            onClick={handleSurpriseMe}
            title="Random anime recommendation"
          >
            <span>🎲</span>
            <span>Surprise me</span>
          </button>
        </div>
      </div>

      {/* Large Spotlight Showcase Banner */}
      {activeSpotlight && (
        <div className="miruro-discover-showcase">
          <img
            src={activeSpotlight.backdrop || activeSpotlight.image || activeSpotlight.cover}
            alt={activeSpotlight.title}
            referrerPolicy="no-referrer"
            className="miruro-discover-backdrop"
          />
          <div className="miruro-discover-overlay-grad" />

          <div className="miruro-discover-content">
            <h2 className="miruro-discover-title">
              {activeSpotlight.title}
            </h2>

            {/* Badges line: TV · 2014 · Action · Adventure · Supernatural */}
            <div className="miruro-discover-meta">
              <span className="miruro-meta-badge">{activeSpotlight.type || 'TV'}</span>
              <span>·</span>
              <span>{activeSpotlight.year || '2024'}</span>
              <span>·</span>
              <span>{Array.isArray(activeSpotlight.genre) ? activeSpotlight.genre.slice(0, 3).join(' · ') : 'Action · Fantasy'}</span>
            </div>

            <p className="miruro-discover-synopsis">
              {activeSpotlight.synopsis || activeSpotlight.description}
            </p>

            <div className="miruro-discover-btn-row">
              <button
                className="miruro-watch-btn-solid"
                onClick={() => {
                  const id = activeSpotlight.id || activeSpotlight.mal_id || activeSpotlight.malId
                  if (id) navigate(`/anime/${id}`)
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Watch</span>
              </button>
              <button
                className="miruro-detail-btn-glass"
                onClick={() => {
                  const id = activeSpotlight.id || activeSpotlight.mal_id || activeSpotlight.malId
                  if (id) navigate(`/anime/${id}`)
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Details</span>
              </button>
              <button
                className="miruro-bookmark-btn-glass"
                onClick={() => {
                  const currentList = JSON.parse(localStorage.getItem('kamiwatch-watchlist') || '{}')
                  const key = String(activeSpotlight.id || activeSpotlight.title)
                  currentList[key] = {
                    id: activeSpotlight.id,
                    title: activeSpotlight.title,
                    cover: activeSpotlight.backdrop || activeSpotlight.image,
                    status: 'plan',
                    updatedAt: Date.now()
                  }
                  localStorage.setItem('kamiwatch-watchlist', JSON.stringify(currentList))
                }}
                title="Add to Watchlist"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mini carousel slide buttons */}
          <div className="miruro-discover-dots">
            {spotlightItems.map((_, i) => (
              <button
                key={i}
                className={`miruro-discover-dot${i === spotlightIdx ? ' active' : ''}`}
                onClick={() => setSpotlightIdx(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Curated Sections */}
      <div style={{ marginTop: 36 }}>
        <div className="section-header">
          <span className="section-title">Popular This Season</span>
          <span className="section-link" onClick={() => navigate('/search')}>See All →</span>
        </div>
        <div className="horizontal-scroll">
          {loading ? (
            <SkeletonCard count={7} />
          ) : (
            popularSeason.map((anime, i) => (
              <AnimeCard key={i} anime={anime} />
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 32, marginBottom: 40 }}>
        <div className="section-header">
          <span className="section-title">💎 Hidden Gems & Masterpieces</span>
          <span className="section-link" onClick={() => navigate('/search')}>See All →</span>
        </div>
        <div className="horizontal-scroll">
          {loading ? (
            <SkeletonCard count={7} />
          ) : (
            hiddenGems.map((anime, i) => (
              <AnimeCard key={i} anime={anime} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
