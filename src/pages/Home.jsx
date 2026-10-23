import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import AnimeCard from '../components/AnimeCard'
import MangaCard from '../components/MangaCard'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

const DEFAULT_HERO_SLIDES = [
  {
    id: 21,
    title: 'One Piece',
    synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure known as the "One Piece" and become the Pirate King.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '8.7',
    type: 'TV',
    episodes: '1100+',
    duration: '24m',
  },
  {
    id: 101922,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    synopsis: "Tanjiro Kamado's peaceful life is shattered when a demon slaughters his family. He trains to become a Demon Slayer to avenge them and cure his sister Nezuko.",
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKgD9GIWK.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKgD9GIWK.jpg',
    genre: ['Action', 'Supernatural', 'Historical'],
    score: '8.6',
    type: 'TV',
    episodes: '26',
    duration: '24m',
  },
  {
    id: 16498,
    title: 'Attack on Titan',
    synopsis: 'In a world where humanity lives behind walls to protect themselves from man-eating giants called Titans, young Eren Yeager vows to destroy them all.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-85f1cT89d4lC.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-85f1cT89d4lC.jpg',
    genre: ['Action', 'Drama', 'Dark Fantasy'],
    score: '9.0',
    type: 'TV',
    episodes: '25',
    duration: '24m',
  },
  {
    id: 1535,
    title: 'Death Note',
    synopsis: 'A high school student discovers a supernatural notebook that allows him to kill anyone by writing their name, embarking on a moral crusade as a self-styled god.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/1535.jpg',
    genre: ['Mystery', 'Psychological', 'Thriller'],
    score: '8.6',
    type: 'TV',
    episodes: '37',
    duration: '23m',
  },
  {
    id: 11061,
    title: 'Hunter x Hunter (2011)',
    synopsis: 'Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness, with the help of his friends and his potential to find his father.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061.jpg',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '9.0',
    type: 'TV',
    episodes: '148',
    duration: '24m',
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
    }, 300)
  }

  const goNext = () => goTo((idx + 1) % slides.length)
  const goPrev = () => goTo((idx - 1 + slides.length) % slides.length)

  useEffect(() => {
    if (slides.length < 2) return
    let mounted = true
    timerRef.current = setInterval(() => {
      if (!mounted) return
      setFading(true)
      setTimeout(() => {
        if (!mounted) return
        setIdx(prev => (prev + 1) % slides.length)
        setFading(false)
      }, 300)
    }, 6500)
    return () => {
      mounted = false
      clearInterval(timerRef.current)
    }
  }, [slides.length])

  const slide = slides[idx]
  if (!slide) return null

  const targetId = slide.id || slide.malId
  const handleWatch = () => {
    if (targetId) navigate(`/anime/${targetId}`)
    else if (slide.title) navigate('/anime/0', { state: { searchQuery: slide.title } })
  }

  const scoreFormatted = slide.rating || (slide.score ? (typeof slide.score === 'number' && slide.score > 10 ? (slide.score / 10).toFixed(1) : slide.score) : '8.8')

  return (
    <div className="miruro-hero">
      {/* Cinematic Backdrop Image */}
      <img
        src={slide.backdrop || slide.image || slide.bannerImage}
        alt={slide.title}
        referrerPolicy="no-referrer"
        className="miruro-hero-backdrop"
        style={{
          opacity: fading ? 0 : 1,
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
          transform: fading ? 'translateY(10px)' : 'translateY(0)',
        }}
      >
        {/* Miruro Spotlight Pills Row */}
        <div className="miruro-hero-pills">
          <span className="spotlight-rank-badge">
            #{idx + 1} Spotlight
          </span>
          <span className="hero-chip">
            {slide.type || 'TV'}
          </span>
          {scoreFormatted && (
            <span className="hero-chip score">
              ★ {scoreFormatted}
            </span>
          )}
          {slide.episodes && (
            <span className="hero-chip">
              {slide.episodes} Ep
            </span>
          )}
          <span className="hero-chip sub">
            CC
          </span>
          <span className="hero-chip dub">
            MIC
          </span>
        </div>

        {/* Title */}
        <h1 className="miruro-hero-title">
          {slide.title}
        </h1>

        {/* Synopsis */}
        <p className="miruro-hero-synopsis">
          {slide.synopsis}
        </p>

        {/* Action Buttons */}
        <div className="miruro-hero-actions">
          <button className="miruro-hero-watch-btn" onClick={handleWatch}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Watch Now</span>
          </button>
          <button className="miruro-hero-detail-btn" onClick={handleWatch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Details</span>
          </button>
          <button
            className="miruro-hero-bookmark-btn"
            onClick={() => {
              const currentList = JSON.parse(localStorage.getItem('kamiwatch-watchlist') || '{}')
              const key = String(slide.id || slide.title)
              if (currentList[key]) {
                delete currentList[key]
              } else {
                currentList[key] = {
                  id: slide.id,
                  title: slide.title,
                  cover: slide.backdrop || slide.image,
                  status: 'watching',
                  updatedAt: Date.now()
                }
              }
              localStorage.setItem('kamiwatch-watchlist', JSON.stringify(currentList))
            }}
            title="Add to Watchlist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
    <div style={{ marginBottom: 36, position: 'relative' }}>
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
          <span className="section-title">{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => scroll('left')}
              title="Scroll Left"
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: 16, lineHeight: 1
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              ‹
            </button>
            <button
              onClick={() => scroll('right')}
              title="Scroll Right"
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', fontSize: 16, lineHeight: 1
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              ›
            </button>
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
  const [follows, setFollows] = useState([])
  const [trendingAnime, setTrendingAnime] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [hiddenGems, setHiddenGems] = useState([])
  const [gemsLoading, setGemsLoading] = useState(true)
  const [airingEpisodes, setAiringEpisodes] = useState([])
  const [airingLoading, setAiringLoading] = useState(true)
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestLoading, setLatestLoading] = useState(true)
  const [upcomingAnime, setUpcomingAnime] = useState([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [recommendations, setRecommendations] = useState([])
  const [mangaTrending, setMangaTrending] = useState([])
  const [mangaNew, setMangaNew] = useState([])
  const [history, setHistory] = useState([])
  const [mangaHistory, setMangaHistory] = useState([])

  useEffect(() => {
    const toArray = (d, key = 'results') => {
      if (!d) return []
      if (Array.isArray(d)) return d
      if (Array.isArray(d[key])) return d[key]
      if (Array.isArray(d.data)) return d.data
      if (Array.isArray(d.slides)) return d.slides
      return []
    }

    // Load watch history & normalize
    try {
      const h = JSON.parse(localStorage.getItem('kamiwatch-history') || '[]')
      const normalized = h.map(item => ({
        ...item,
        title: item.title || item.animeTitle || 'Unknown',
        id: item.id || item.animeId || item.malId,
        cover: item.cover || item.thumbnail || '',
      }))
      setHistory(normalized.slice(0, 16))
    } catch {}

    try {
      const mh = JSON.parse(localStorage.getItem('kamiwatch-manga-history') || '[]')
      setMangaHistory(mh.slice(0, 10))
    } catch {}

    // Fetch hero slides
    fetch(`${API}/jikan/hero-slides`).then(r => r.json()).then(data => {
      const slides = toArray(data, 'slides')
      if (slides.length >= 3) setHeroSlides(slides)
    }).catch(() => {})

    // Fetch follows
    fetch(`${API}/library/follows`).then(r => r.json()).then(d => setFollows(toArray(d))).catch(() => {})

    // Popular / Trending Anime
    fetch(`${API}/jikan/all?page=1`).then(r => r.json()).then(d => {
      setTrendingAnime(toArray(d).slice(0, 20))
      setTrendingLoading(false)
    }).catch(() => setTrendingLoading(false))

    // Hidden Gems (Underrated Animes)
    fetch(`${API}/jikan/hidden-gems`).then(r => r.json()).then(d => {
      const items = toArray(d)
      if (items.length > 0) setHiddenGems(items.slice(0, 16))
      setGemsLoading(false)
    }).catch(() => {
      setGemsLoading(false)
    })

    // Airing
    fetch(`${API}/jikan/airing?limit=20`).then(r => r.json()).then(d => {
      setAiringEpisodes(toArray(d).slice(0, 20))
      setAiringLoading(false)
    }).catch(() => setAiringLoading(false))

    // Latest episodes
    fetch(`${API}/anikoto/latest`).then(r => r.json()).then(d => {
      setLatestEpisodes(toArray(d).slice(0, 20))
      setLatestLoading(false)
    }).catch(() => setLatestLoading(false))

    // Upcoming
    fetch(`${API}/anikoto/upcoming`).then(r => r.json()).then(d => {
      setUpcomingAnime(toArray(d).slice(0, 20))
      setUpcomingLoading(false)
    }).catch(() => setUpcomingLoading(false))

    // Manga
    fetch(`${API}/manga/trending`).then(r => r.json()).then(d => setMangaTrending(toArray(d).slice(0, 14))).catch(() => {})
    fetch(`${API}/manga/new-releases`).then(r => r.json()).then(d => setMangaNew(toArray(d).slice(0, 14))).catch(() => {})

    // Recommendations
    try {
      const watchHistory = JSON.parse(localStorage.getItem('kamiwatch-history') || '[]')
      const malIds = watchHistory.slice(0, 5).map(h => h.malId || h.id).filter(Boolean)
      if (malIds.length > 0) {
        fetch(`${API}/jikan/recommendations?ids=${malIds.join(',')}`)
          .then(r => r.json())
          .then(d => setRecommendations(toArray(d).slice(0, 16)))
          .catch(() => {})
      }
    } catch {}
  }, [])

  // Progress map
  const progressMap = (() => {
    try {
      return JSON.parse(localStorage.getItem('kamiwatch_episode_progress') || '{}')
    } catch { return {} }
  })()

  const getProgress = (anime) => {
    const id = anime.malId || anime.id
    const pKey = Object.keys(progressMap).find(k =>
      k === String(id) || k.startsWith(`${id}_`) || progressMap[k]?.animeId === id
    )
    if (!pKey) return 0
    const p = progressMap[pKey]
    if (typeof p === 'number') return p
    if (p?.percent) return p.percent
    return 0
  }

  return (
    <div style={{ minHeight: '100%', paddingBottom: 60 }}>
      {/* === MIRURO CINEMATIC HERO SPOTLIGHT === */}
      <MiruroHero slides={heroSlides} />

      {/* === QUICK GENRE BAR === */}
      <div style={{ padding: '24px 0 12px', marginBottom: 8 }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 28px',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {GENRE_TAGS.map(g => (
            <button
              key={g}
              onClick={() => {
                setActiveGenre(g)
                if (g !== 'All') navigate('/search', { state: { genre: g } })
              }}
              style={{
                padding: '6px 18px', borderRadius: 99, border: 'none',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: activeGenre === g ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.06)',
                color: activeGenre === g ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeGenre === g ? '0 0 16px var(--accent-glow)' : 'none',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* === CONTINUE WATCHING === */}
      {history.length > 0 && (
        <Row
          title="Continue Watching"
          icon="🍿"
          items={history}
          renderCard={(item, i) => (
            <AnimeCard
              key={i}
              anime={item}
              badge={item.epNumber ? `EP ${item.epNumber}` : (item.episode ? `EP ${item.episode}` : undefined)}
              progress={getProgress(item)}
              wide
            />
          )}
        />
      )}

      {/* === CONTINUE READING (MANGA) === */}
      {mangaHistory.length > 0 && (
        <Row
          title="Continue Reading"
          icon="📖"
          items={mangaHistory}
          renderCard={(item, i) => {
            const mId = item.mangaId || item.id
            const mTitle = item.title || item.mangaTitle || 'Manga'
            const mCover = item.cover || item.image || 'https://via.placeholder.com/200x280?text=No+Cover'
            const chapterTag = item.chapterNumber ? `Ch. ${item.chapterNumber}` : (item.chapterTitle || '')

            return (
              <MangaCard 
                key={i} 
                manga={{ id: mId, title: mTitle, cover: mCover, description: item.description || '' }} 
                badge={chapterTag}
                style={{ flexShrink: 0, width: 148 }} 
              />
            )
          }}
        />
      )}

      {/* === MY LIST (FOLLOWS) === */}
      {follows.length > 0 && (
        <Row
          title="My List"
          icon="📌"
          items={follows}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
        />
      )}

      {/* === HIDDEN GEMS (UNDERRATED ANIME) === */}
      {(hiddenGems.length > 0 || gemsLoading) && (
        <Row
          title="Hidden Gems (Underrated Masterpieces)"
          icon="💎"
          items={hiddenGems}
          loading={gemsLoading}
          skeletonCount={8}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
        />
      )}

      {/* === TRENDING ANIME (WITH #1 - #10 RANK BADGES) === */}
      <Row
        title="Trending Anime"
        icon="🔥"
        items={trendingAnime}
        loading={trendingLoading}
        skeletonCount={10}
        onSeeAll={() => navigate('/search')}
        renderCard={(item, i) => (
          <AnimeCard
            key={i}
            anime={item}
            rank={i < 10 ? i + 1 : undefined}
          />
        )}
      />

      {/* === AIRING THIS SEASON === */}
      <Row
        title="Airing This Season"
        icon="⚡"
        items={airingEpisodes.map(a => ({
          ...a,
          id: a.id || a.mal_id,
          malId: a.mal_id || a.id,
          title: a.title,
          cover: a.cover || a.thumbnail || a.image || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
          score: a.score,
          type: a.type,
          episodes: a.episodes || a.sub_episodes,
        }))}
        loading={airingLoading}
        skeletonCount={10}
        renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
      />

      {/* === LATEST EPISODES === */}
      <Row
        title="Latest Episodes"
        icon="🆕"
        items={latestEpisodes}
        loading={latestLoading}
        skeletonCount={10}
        onSeeAll={() => navigate('/search')}
        renderCard={(item, i) => {
          const epNum = item.episode || (item.sub_episodes && item.sub_episodes !== '0' ? item.sub_episodes : (item.dub_episodes !== '0' ? item.dub_episodes : null))
          return (
            <AnimeCard
              key={i}
              anime={item}
              badge={epNum ? `EP ${epNum}` : undefined}
              onClick={() => setEpisodeModal({ title: item.title, url: item.url, thumbnail: item.thumbnail || item.cover, source: item.source || 'anikoto' })}
            />
          )
        }}
      />

      {/* === UPCOMING ANIME === */}
      {upcomingAnime.length > 0 && (
        <Row
          title="Upcoming Anime"
          icon="⏳"
          items={upcomingAnime}
          loading={upcomingLoading}
          skeletonCount={8}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} badge="SOON" />}
        />
      )}

      {/* === RECOMMENDED FOR YOU === */}
      {recommendations.length > 0 && (
        <Row
          title="Recommended for You"
          icon="✨"
          items={recommendations}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
        />
      )}

      {/* === TRENDING MANGA === */}
      {mangaTrending.length > 0 && (
        <Row
          title="Trending Manga"
          icon="📚"
          items={mangaTrending}
          renderCard={(item, i) => (
            <MangaCard key={i} manga={item} style={{ flexShrink: 0, width: 148 }} />
          )}
        />
      )}

      {/* === BROWSE BY GENRE GRID === */}
      <div style={{ marginBottom: 32, padding: '0 4px' }}>
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
