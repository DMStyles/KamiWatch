import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import AnimeCard from '../components/AnimeCard'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

const DEFAULT_SPOTLIGHT = [
  {
    id: 113415,
    title: 'JUJUTSU KAISEN',
    synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to locate the demon other body parts.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    genre: ['Action', 'Fantasy', 'Supernatural'],
    score: '8.7',
    type: 'TV',
    year: '2020',
  },
  {
    id: 151807,
    title: 'Solo Leveling',
    synopsis: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo finds himself in a struggle for survival and discovers a quest log only he can see.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '8.5',
    type: 'TV',
    year: '2024',
  },
  {
    id: 101922,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    synopsis: "Tanjiro Kamado's peaceful life is shattered when a demon slaughters his family. He trains to become a Demon Slayer to avenge them and cure his sister Nezuko.",
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    genre: ['Action', 'Supernatural', 'Historical'],
    score: '8.6',
    type: 'TV',
    year: '2019',
  }
]

const FALLBACK_GEMS = [
  { id: 46102, title: 'Odd Taxi', score: 8.7, type: 'TV', episodes: 13, cover: 'https://cdn.myanimelist.net/images/anime/1185/115868.jpg' },
  { id: 46095, title: "Vivy: Fluorite Eye's Song", score: 8.4, type: 'TV', episodes: 13, cover: 'https://cdn.myanimelist.net/images/anime/1208/115802.jpg' },
  { id: 37520, title: 'Dororo', score: 8.2, type: 'TV', episodes: 24, cover: 'https://cdn.myanimelist.net/images/anime/1879/100467.jpg' },
  { id: 44074, title: 'Link Click', score: 8.7, type: 'ONA', episodes: 11, cover: 'https://cdn.myanimelist.net/images/anime/1109/118055.jpg' },
  { id: 22135, title: 'Ping Pong the Animation', score: 8.6, type: 'TV', episodes: 11, cover: 'https://cdn.myanimelist.net/images/anime/10/58041.jpg' },
  { id: 13125, title: 'From the New World', score: 8.3, type: 'TV', episodes: 25, cover: 'https://cdn.myanimelist.net/images/anime/12/41199.jpg' },
  { id: 35557, title: 'Land of the Lustrous', score: 8.4, type: 'TV', episodes: 12, cover: 'https://cdn.myanimelist.net/images/anime/12/88204.jpg' },
  { id: 35828, title: 'Pluto', score: 8.4, type: 'ONA', episodes: 8, cover: 'https://cdn.myanimelist.net/images/anime/1841/138767.jpg' },
]

export default function Discover() {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('For You')
  const [spotlightItems, setSpotlightItems] = useState(DEFAULT_SPOTLIGHT)
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
      const [r1, r2, r3, r4] = await Promise.allSettled([
        fetch(`${API}/jikan/hero-slides`).then(r => r.json()),
        fetch(`${API}/jikan/airing?limit=16`).then(r => r.json()),
        fetch(`${API}/jikan/hidden-gems`).then(r => r.json()),
        fetch(`${API}/jikan/all?page=1`).then(r => r.json()),
      ])

      const toList = (res) => {
        if (!res || res.status !== 'fulfilled' || !res.value) return []
        const val = res.value
        if (Array.isArray(val)) return val
        if (Array.isArray(val.results)) return val.results
        if (Array.isArray(val.data)) return val.data
        if (Array.isArray(val.slides)) return val.slides
        return []
      }

      const slides = toList(r1)
      setSpotlightItems(slides.length > 0 ? slides.slice(0, 6) : DEFAULT_SPOTLIGHT)

      const airing = toList(r2)
      const all = toList(r4)
      const popular = airing.length > 0 ? airing : all
      setPopularSeason(popular.length > 0 ? popular.slice(0, 14) : FALLBACK_GEMS)
      setAllAnime(all.length > 0 ? all : popular)

      const gems = toList(r3)
      setHiddenGems(gems.length > 0 ? gems.slice(0, 14) : FALLBACK_GEMS)
    } catch {
      setSpotlightItems(DEFAULT_SPOTLIGHT)
      setPopularSeason(FALLBACK_GEMS)
      setHiddenGems(FALLBACK_GEMS)
    } finally {
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
