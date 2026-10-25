import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import AnimeCard from '../components/AnimeCard'
import MangaCard from '../components/MangaCard'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

const DEFAULT_HERO_SLIDES = [
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
    episodes: '26',
    year: '2019',
  },
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
    episodes: '24',
    year: '2020',
  },
  {
    id: 151807,
    title: 'Solo Leveling',
    synopsis: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a struggle for survival.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '8.5',
    type: 'TV',
    episodes: '12',
    year: '2024',
  },
  {
    id: 16498,
    title: 'Attack on Titan',
    synopsis: 'In a world where humanity lives behind walls to protect themselves from man-eating giants called Titans, young Eren Yeager vows to destroy them all.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    genre: ['Action', 'Drama', 'Dark Fantasy'],
    score: '9.0',
    type: 'TV',
    episodes: '25',
    year: '2013',
  },
  {
    id: 21,
    title: 'One Piece',
    synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure known as the "One Piece" and become the Pirate King.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '8.8',
    type: 'TV',
    episodes: '1100+',
    year: '1999',
  },
]

const GENRE_CARDS = [
  { name: 'Action', bg: 'linear-gradient(135deg, #7c3aed 0%, #ef4444 100%)', emoji: '⚔️' },
  { name: 'Fantasy', bg: 'linear-gradient(135deg, #5b21b6 0%, #06b6d4 100%)', emoji: '🔮' },
  { name: 'Adventure', bg: 'linear-gradient(135deg, #047857 0%, #06b6d4 100%)', emoji: '🗺️' },
  { name: 'Comedy', bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', emoji: '😄' },
  { name: 'Sci-Fi', bg: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)', emoji: '🚀' },
  { name: 'Romance', bg: 'linear-gradient(135deg, #be185d 0%, #f472b6 100%)', emoji: '💕' },
  { name: 'Mystery', bg: 'linear-gradient(135deg, #1e3a5f 0%, #5b21b6 100%)', emoji: '🔍' },
  { name: 'Horror', bg: 'linear-gradient(135deg, #450a0a 0%, #7c3aed 100%)', emoji: '👻' },
]

const GENRE_TAGS = ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural']

/** Miruro Hero Banner with clearlogo, metadata pills, Watch/Details/+ buttons */
function MiruroHero({ slides }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const navigate = useNavigate()
  const timerRef = useRef(null)

  const goTo = (newIdx) => {
    if (newIdx === idx) return
    setFading(true)
    setTimeout(() => {
      setIdx(newIdx)
      setFading(false)
    }, 250)
  }

  const goNext = () => goTo((idx + 1) % slides.length)
  const goPrev = () => goTo((idx - 1 + slides.length) % slides.length)

  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx(prev => (prev + 1) % slides.length)
        setFading(false)
      }, 250)
    }, 7000)
    return () => clearInterval(timerRef.current)
  }, [slides.length])

  const slide = slides[idx]
  if (!slide) return null

  const targetId = slide.id || slide.malId || slide.mal_id
  const handleWatch = () => {
    if (targetId) navigate(`/anime/${targetId}`)
    else if (slide.title) navigate('/anime/0', { state: { searchQuery: slide.title } })
  }

  const genres = Array.isArray(slide.genre)
    ? slide.genre
    : (Array.isArray(slide.genres) ? slide.genres.map(g => (typeof g === 'object' ? g.name : g)) : ['Adventure', 'Action'])

  return (
    <div className="miruro-hero">
      {/* Background Banner */}
      <img
        src={slide.backdrop || slide.image || slide.bannerImage || slide.cover}
        alt={slide.title}
        referrerPolicy="no-referrer"
        className="miruro-hero-backdrop"
        style={{ opacity: fading ? 0 : 1 }}
        onError={(e) => {
          if (slide.cover && e.target.src !== slide.cover) {
            e.target.src = slide.cover
          } else if (slide.thumbnail && e.target.src !== slide.thumbnail) {
            e.target.src = slide.thumbnail
          }
        }}
      />

      {/* Multi-Directional Gradient Overlays */}
      <div className="miruro-hero-overlay-left" />
      <div className="miruro-hero-overlay-bottom" />
      <div className="miruro-hero-overlay-top" />

      {/* Hero Content */}
      <div
        className="miruro-hero-content"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(8px)' : 'translateY(0)',
        }}
      >
        {/* Title Logo (if available) or Bold Typography */}
        {slide.logo ? (
          <img src={slide.logo} alt={slide.title} className="miruro-hero-logo" />
        ) : (
          <h1 className="miruro-hero-title">
            {slide.title}
          </h1>
        )}

        {/* Metadata Pills: 3 Episodes, 2026, Adventure, Comedy, Fantasy */}
        <div className="miruro-hero-meta-row">
          {slide.episodes && (
            <span className="miruro-hero-pill-badge">{slide.episodes} Episodes</span>
          )}
          {slide.year && (
            <span className="miruro-hero-pill-badge">{slide.year}</span>
          )}
          {genres.slice(0, 3).map((g, i) => (
            <span key={i} className="miruro-hero-pill-badge">{g}</span>
          ))}
        </div>

        {/* Synopsis */}
        <p className="miruro-hero-synopsis">
          {slide.synopsis}
        </p>

        {/* Action Buttons: ▶ Watch Now | ⓘ Details | + */}
        <div className="miruro-hero-actions">
          <button className="miruro-watch-btn-solid" onClick={handleWatch}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Watch Now</span>
          </button>
          <button className="miruro-detail-btn-glass" onClick={handleWatch}>
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
              const key = String(slide.id || slide.title)
              currentList[key] = {
                id: slide.id,
                title: slide.title,
                cover: slide.backdrop || slide.image,
                status: 'watching',
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

      {/* Slide Navigation Controls */}
      <div className="miruro-hero-nav">
        <button className="miruro-hero-nav-btn" onClick={goPrev} title="Previous slide">
          ‹
        </button>
        <div className="miruro-hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`miruro-hero-dot${i === idx ? ' active' : ''}`}
              onClick={() => goTo(i)}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button className="miruro-hero-nav-btn" onClick={goNext} title="Next slide">
          ›
        </button>
      </div>
    </div>
  )
}

function Row({ title, icon, items = [], loading = false, onSeeAll, renderCard, skeletonCount = 8 }) {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const scrollAmount = direction === 'left' ? -560 : 560
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (!loading && items.length === 0) return null

  return (
    <div style={{ marginBottom: 32, position: 'relative' }}>
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
          <span className="section-title">{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => scroll('left')} className="miruro-scroll-nav-btn" title="Scroll Left">‹</button>
            <button onClick={() => scroll('right')} className="miruro-scroll-nav-btn" title="Scroll Right">›</button>
          </div>
          {onSeeAll && <span className="section-link" onClick={onSeeAll}>See All →</span>}
        </div>
      </div>
      <div className="horizontal-scroll" ref={scrollRef}>
        {loading
          ? <SkeletonCard count={skeletonCount} />
          : items.map((item, i) => renderCard(item, i))
        }
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES)
  const [activeGenre, setActiveGenre] = useState('All')
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestLoading, setLatestLoading] = useState(true)
  const [latestSubDub, setLatestSubDub] = useState('sub')
  const [latestPage, setLatestPage] = useState(1)
  const [topAiring, setTopAiring] = useState([])
  const [topAiringFilter, setTopAiringFilter] = useState('Week')
  const [trendingAnime, setTrendingAnime] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [airingEpisodes, setAiringEpisodes] = useState([])
  const [airingLoading, setAiringLoading] = useState(true)
  const [upcomingAnime, setUpcomingAnime] = useState([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [mangaTrending, setMangaTrending] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const toArray = (d, key = 'results') => {
      if (!d) return []
      if (Array.isArray(d)) return d
      if (Array.isArray(d[key])) return d[key]
      if (Array.isArray(d.data)) return d.data
      if (Array.isArray(d.slides)) return d.slides
      return []
    }

    // Load watch history
    try {
      const h = JSON.parse(localStorage.getItem('kamiwatch-history') || '[]')
      const normalized = h.map(item => ({
        ...item,
        title: item.title || item.animeTitle || 'Unknown',
        id: item.id || item.animeId || item.malId,
        cover: item.cover || item.thumbnail || '',
      }))
      setHistory(normalized.slice(0, 14))
    } catch {}

    // Fetch hero slides
    fetch(`${API}/jikan/hero-slides`).then(r => r.json()).then(data => {
      const slides = toArray(data, 'slides')
      if (slides.length >= 3) setHeroSlides(slides)
    }).catch(() => {})

    // Latest episodes (Screenshot 1: "Latest Episodes")
    fetch(`${API}/anikoto/latest`).then(r => r.json()).then(d => {
      const list = toArray(d)
      setLatestEpisodes(list)
      setLatestLoading(false)
    }).catch(() => setLatestLoading(false))

    // Top Airing (Right Sidebar list)
    fetch(`${API}/jikan/airing?limit=10`).then(r => r.json()).then(d => {
      const list = toArray(d)
      setTopAiring(list.slice(0, 10))
    }).catch(() => {})

    // Popular / Trending Anime
    fetch(`${API}/jikan/all?page=1`).then(r => r.json()).then(d => {
      setTrendingAnime(toArray(d).slice(0, 20))
      setTrendingLoading(false)
    }).catch(() => setTrendingLoading(false))

    // Airing This Season
    fetch(`${API}/jikan/airing?limit=20`).then(r => r.json()).then(d => {
      setAiringEpisodes(toArray(d).slice(0, 20))
      setAiringLoading(false)
    }).catch(() => setAiringLoading(false))

    // Upcoming
    fetch(`${API}/anikoto/upcoming`).then(r => r.json()).then(d => {
      setUpcomingAnime(toArray(d).slice(0, 20))
      setUpcomingLoading(false)
    }).catch(() => setUpcomingLoading(false))

    // Manga
    fetch(`${API}/manga/trending`).then(r => r.json()).then(d => setMangaTrending(toArray(d).slice(0, 14))).catch(() => {})
  }, [])

  // Filter latest episodes by page and sub/dub
  const paginatedLatest = latestEpisodes.slice((latestPage - 1) * 7, latestPage * 7)

  return (
    <div style={{ minHeight: '100%', paddingBottom: 60 }}>
      {/* 1. Miruro Cinematic Hero Spotlight */}
      <MiruroHero slides={heroSlides} />

      {/* 2. Genre Tags Strip */}
      <div className="miruro-genre-strip-wrapper">
        <div className="miruro-genre-strip-scroll hide-scroll">
          {GENRE_TAGS.map(g => (
            <button
              key={g}
              onClick={() => {
                setActiveGenre(g)
                if (g !== 'All') navigate('/search', { state: { genre: g } })
              }}
              className={`genre-tag-pill${activeGenre === g ? ' active' : ''}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Split Content: Left Rail (Latest Episodes + Rows) & Right Column (TOP AIRING Sidebar) */}
      <div className="miruro-home-split-layout">
        {/* Left Column (Approx 75% width) */}
        <div className="miruro-home-main-col">
          {/* Latest Episodes Section with Sub/Dub toggle & Pagination (Screenshot 1 Match) */}
          <div className="miruro-section-header-row">
            <div className="miruro-section-title-wrap">
              <span className="miruro-section-heading">Latest Episodes</span>
              <div className="miruro-subdub-pill-group">
                <button
                  className={`miruro-subdub-toggle${latestSubDub === 'sub' ? ' active' : ''}`}
                  onClick={() => setLatestSubDub('sub')}
                >
                  SUB
                </button>
                <button
                  className={`miruro-subdub-toggle${latestSubDub === 'dub' ? ' active' : ''}`}
                  onClick={() => setLatestSubDub('dub')}
                >
                  DUB
                </button>
              </div>
            </div>

            <div className="miruro-pagination-pill">
              <button
                className="miruro-page-nav-arrow"
                disabled={latestPage <= 1}
                onClick={() => setLatestPage(p => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span className="miruro-page-count">{latestPage} / 3</span>
              <button
                className="miruro-page-nav-arrow"
                disabled={latestPage >= 3}
                onClick={() => setLatestPage(p => Math.min(3, p + 1))}
              >
                ›
              </button>
            </div>
          </div>

          {/* 7-Card Horizontal Grid for Latest Episodes */}
          <div className="miruro-latest-card-row">
            {latestLoading ? (
              <SkeletonCard count={7} />
            ) : paginatedLatest.map((item, i) => {
              const epNum = item.episode || (item.sub_episodes && item.sub_episodes !== '0' ? item.sub_episodes : '1')
              return (
                <AnimeCard
                  key={i}
                  anime={item}
                  badge={`EP ${epNum}`}
                  onClick={() => setEpisodeModal({
                    title: item.title,
                    url: item.url,
                    thumbnail: item.thumbnail || item.cover,
                    source: item.source || 'anikoto'
                  })}
                />
              )
            })}
          </div>

          {/* Continue Watching (if exists) */}
          {history.length > 0 && (
            <Row
              title="Continue Watching"
              icon="🍿"
              items={history}
              renderCard={(item, i) => (
                <AnimeCard
                  key={i}
                  anime={item}
                  badge={item.epNumber ? `EP ${item.epNumber}` : undefined}
                />
              )}
            />
          )}

          {/* Airing This Season */}
          <Row
            title="Airing This Season"
            icon="⚡"
            items={airingEpisodes.map(a => ({
              ...a,
              id: a.id || a.mal_id,
              malId: a.mal_id || a.id,
              title: a.title,
              cover: a.cover || a.thumbnail || a.image || a.images?.jpg?.large_image_url,
              score: a.score,
              type: a.type,
            }))}
            loading={airingLoading}
            skeletonCount={7}
            renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
          />

          {/* Trending Anime */}
          <Row
            title="Trending Anime"
            icon="🔥"
            items={trendingAnime}
            loading={trendingLoading}
            skeletonCount={7}
            onSeeAll={() => navigate('/trending')}
            renderCard={(item, i) => (
              <AnimeCard
                key={i}
                anime={item}
                rank={i < 10 ? i + 1 : undefined}
              />
            )}
          />

          {/* Upcoming */}
          {upcomingAnime.length > 0 && (
            <Row
              title="Upcoming Anime"
              icon="⏳"
              items={upcomingAnime}
              loading={upcomingLoading}
              skeletonCount={7}
              renderCard={(item, i) => <AnimeCard key={i} anime={item} badge="SOON" />}
            />
          )}

          {/* Trending Manga */}
          {mangaTrending.length > 0 && (
            <Row
              title="Trending Manga"
              icon="📚"
              items={mangaTrending}
              renderCard={(item, i) => (
                <MangaCard key={i} manga={item} style={{ flexShrink: 0, width: 140 }} />
              )}
            />
          )}
        </div>

        {/* Right Sidebar: TOP AIRING (Screenshot 1 Match) */}
        <aside className="miruro-top-airing-sidebar">
          <div className="miruro-top-airing-box">
            <div className="miruro-top-airing-header">
              <span className="miruro-top-airing-title">TOP AIRING</span>
              <div className="miruro-top-airing-tabs">
                {['Day', 'Week', 'Month'].map(t => (
                  <button
                    key={t}
                    className={`miruro-top-airing-tab${topAiringFilter === t ? ' active' : ''}`}
                    onClick={() => setTopAiringFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="miruro-top-airing-list">
              {topAiring.map((show, idx) => {
                const targetId = show.id || show.mal_id || show.malId
                const title = show.title || show.titleEnglish || 'Unknown Anime'
                const cover = show.cover || show.thumbnail || show.image || show.images?.jpg?.large_image_url || 'https://via.placeholder.com/120x160?text=No+Cover'
                const score = show.score ? (typeof show.score === 'number' && show.score > 10 ? (show.score / 10).toFixed(1) : show.score) : '8.8'
                const format = show.type || 'TV'

                return (
                  <div
                    key={targetId || idx}
                    className="miruro-top-airing-item"
                    onClick={() => {
                      if (targetId) navigate(`/anime/${targetId}`)
                      else navigate('/anime/0', { state: { searchQuery: title } })
                    }}
                  >
                    <span className={`miruro-rank-badge rank-${idx + 1}`}>
                      #{idx + 1}
                    </span>

                    <img
                      src={cover}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="miruro-top-airing-thumb"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/120x160?text=No+Cover'
                      }}
                    />

                    <div className="miruro-top-airing-info">
                      <h4 className="miruro-top-airing-item-title" title={title}>
                        {title}
                      </h4>
                      <div className="miruro-top-airing-item-meta">
                        <span className="score-star">★ {score}</span>
                        <span>·</span>
                        <span>{format}</span>
                        {show.episodes && (
                          <>
                            <span>·</span>
                            <span>{show.episodes} Ep</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Browse by Genre Grid */}
      <div style={{ marginTop: 20, padding: '0 24px' }}>
        <div className="section-header">
          <span className="section-title">Browse by Genre</span>
        </div>
        <div className="genre-grid">
          {GENRE_CARDS.map(g => (
            <div
              key={g.name}
              className="genre-card"
              style={{ background: g.bg }}
              onClick={() => navigate('/search', { state: { genre: g.name } })}
            >
              <span>{g.emoji} {g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
