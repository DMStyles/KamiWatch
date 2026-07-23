import React, { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import AnimeCard from '../components/AnimeCard'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

const HERO_SLIDES = [
  {
    id: 21,
    title: 'One Piece',
    synopsis: 'Monkey D. Luffy sets off on an adventure with his pirate crew to find the greatest treasure known as the "One Piece" and become the Pirate King.',
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    genre: ['Action', 'Adventure', 'Fantasy'],
    score: '8.7',
    type: 'TV',
  },
  {
    id: 101922,
    title: 'Demon Slayer',
    synopsis: "Tanjiro Kamado's peaceful life is shattered when a demon slaughters his family. He trains to become a Demon Slayer to avenge them and cure his sister Nezuko.",
    backdrop: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKgD9GIWK.jpg',
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKgD9GIWK.jpg',
    genre: ['Action', 'Supernatural', 'Historical'],
    score: '8.6',
    type: 'TV',
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

function HeroSection({ slides }) {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)
  const timerRef = useRef(null)

  const goTo = (newIdx) => {
    if (newIdx === idx) return
    setFading(true)
    setTimeout(() => {
      setIdx(newIdx)
      setFading(false)
    }, 350)
  }

  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx(prev => (prev + 1) % slides.length)
        setFading(false)
      }, 350)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [slides.length])

  const slide = slides[idx]
  if (!slide) return null

  return (
    <div style={{ position: 'relative', height: '58vh', minHeight: 380, maxHeight: 560, overflow: 'hidden', marginBottom: 0 }}>
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${slide.backdrop || slide.image || slide.bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          transition: 'opacity 0.4s ease',
          opacity: fading ? 0 : 1,
          transform: 'scale(1.04)',
        }}
      />

      {/* Overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero-left)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero-bottom)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,15,0.2)' }} />

      {/* Content */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 48px 40px',
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          maxWidth: 640,
        }}
      >
        {/* Genre tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {(slide.genre || []).map(g => (
            <span key={g} style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
              letterSpacing: '0.03em',
            }}>
              {g}
            </span>
          ))}
          {slide.score && (
            <span style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'rgba(245,158,11,0.15)',
              backdropFilter: 'blur(8px)',
              fontSize: 11, fontWeight: 700, color: '#fbbf24',
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              ★ {slide.score}
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: '#fff',
          marginBottom: 12,
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
        }}>
          {slide.title}
        </div>

        {/* Synopsis */}
        <div style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.7)',
          marginBottom: 24,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {slide.synopsis}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 14, padding: '10px 28px', borderRadius: 10 }}
            onClick={() => {
              if (slide.id) navigate(`/anime/${slide.id}`)
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Watch Now
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 14, padding: '10px 24px', borderRadius: 10 }}
            onClick={() => { if (slide.id) navigate(`/anime/${slide.id}`) }}
          >
            More Info
          </button>
        </div>
      </div>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 32, right: 40,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === idx ? 22 : 7,
                height: 7,
                borderRadius: 99,
                background: i === idx ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ title, items = [], loading = false, onSeeAll, renderCard, skeletonCount = 8 }) {
  if (!loading && items.length === 0) return null
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="section-header">
        <span className="section-title">{title}</span>
        {onSeeAll && <span className="section-link" onClick={onSeeAll}>See All →</span>}
      </div>
      <div className="horizontal-scroll">
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
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES)
  const [heroLoading, setHeroLoading] = useState(true)
  const [activeGenre, setActiveGenre] = useState('All')
  const [follows, setFollows] = useState([])
  const [trendingAnime, setTrendingAnime] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [airingEpisodes, setAiringEpisodes] = useState([])
  const [airingLoading, setAiringLoading] = useState(true)
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [latestLoading, setLatestLoading] = useState(true)
  const [upcomingAnime, setUpcomingAnime] = useState([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [recommendations, setRecommendations] = useState([])
  const [mangaTrending, setMangaTrending] = useState([])
  const [mangaNew, setMangaNew] = useState([])
  const [mangaPopular, setMangaPopular] = useState([])
  const [history, setHistory] = useState([])
  const [mangaHistory, setMangaHistory] = useState([])

  useEffect(() => {
    // Helper to safely extract array from any API response object
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
      setHistory(h.slice(0, 12))
    } catch {}
    try {
      const mh = JSON.parse(localStorage.getItem('kamiwatch-manga-history') || '[]')
      setMangaHistory(mh.slice(0, 8))
    } catch {}

    // Fetch hero slides
    fetch(`${API}/jikan/hero-slides`).then(r => r.json()).then(data => {
      const slides = toArray(data, 'slides')
      if (slides.length >= 3) setHeroSlides(slides)
    }).catch(() => {}).finally(() => setHeroLoading(false))

    // Fetch follows
    fetch(`${API}/library/follows`).then(r => r.json()).then(d => setFollows(toArray(d))).catch(() => {})

    // Popular / Trending Anime
    fetch(`${API}/jikan/all?page=1`).then(r => r.json()).then(d => {
      setTrendingAnime(toArray(d).slice(0, 20))
      setTrendingLoading(false)
    }).catch(() => setTrendingLoading(false))

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
    fetch(`${API}/manga/trending`).then(r => r.json()).then(d => setMangaTrending(toArray(d).slice(0, 12))).catch(() => {})
    fetch(`${API}/manga/new-releases`).then(r => r.json()).then(d => setMangaNew(toArray(d).slice(0, 12))).catch(() => {})
    fetch(`${API}/manga/popular-new`).then(r => r.json()).then(d => setMangaPopular(toArray(d).slice(0, 12))).catch(() => {})

    // Recommendations
    try {
      const watchHistory = JSON.parse(localStorage.getItem('kamiwatch-history') || '[]')
      const malIds = watchHistory.slice(0, 5).map(h => h.malId).filter(Boolean)
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
    <div style={{ minHeight: '100%', paddingBottom: 48 }}>
      {/* === HERO === */}
      <HeroSection slides={heroSlides} />

      {/* === GENRE BAR === */}
      <div style={{ padding: '20px 0 8px', marginBottom: 4 }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 24px',
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
                padding: '6px 16px', borderRadius: 99, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: activeGenre === g ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                color: activeGenre === g ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeGenre === g ? '0 0 14px var(--accent-glow)' : 'none',
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
          items={history}
          renderCard={(item, i) => (
            <AnimeCard
              key={i}
              anime={item}
              progress={getProgress(item)}
              wide
            />
          )}
        />
      )}

      {/* === CONTINUE READING === */}
      {mangaHistory.length > 0 && (
        <Row
          title="Continue Reading"
          items={mangaHistory}
          renderCard={(item, i) => (
            <div
              key={i}
              onClick={() => navigate(`/manga/${item.id}`)}
              style={{ flexShrink: 0, width: 130, cursor: 'pointer' }}
            >
              <div style={{ width: 130, height: 186, borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <img src={item.cover} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.title}
              </div>
            </div>
          )}
        />
      )}

      {/* === MY LIST === */}
      {follows.length > 0 && (
        <Row
          title="My List"
          items={follows}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
        />
      )}

      {/* === LATEST EPISODES === */}
      <Row
        title="Latest Episodes"
        items={latestEpisodes}
        loading={latestLoading}
        skeletonCount={10}
        onSeeAll={() => navigate('/search')}
        renderCard={(item, i) => (
          <AnimeCard
            key={i}
            anime={item}
            badge={item.episode ? `EP ${item.episode}` : undefined}
            onClick={() => setEpisodeModal({ title: item.title, url: item.url, thumbnail: item.thumbnail || item.cover, source: item.source || 'anikoto' })}
          />
        )}
      />

      {/* === TRENDING & POPULAR ANIME === */}
      <Row
        title="Trending Anime"
        items={trendingAnime}
        loading={trendingLoading}
        skeletonCount={10}
        onSeeAll={() => navigate('/search')}
        renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
      />

      {/* === AIRING THIS SEASON === */}
      <Row
        title="Airing This Season"
        items={airingEpisodes.map(a => ({
          id: a.mal_id,
          malId: a.mal_id,
          title: a.title,
          cover: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
          score: a.score,
          type: a.type,
          episodes: a.episodes,
        }))}
        loading={airingLoading}
        skeletonCount={10}
        renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
      />

      {/* === UPCOMING ANIME === */}
      {upcomingAnime.length > 0 && (
        <Row
          title="Upcoming Anime"
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
          items={recommendations}
          renderCard={(item, i) => <AnimeCard key={i} anime={item} />}
        />
      )}

      {/* === TRENDING MANGA === */}
      {mangaTrending.length > 0 && (
        <Row
          title="Trending Manga"
          items={mangaTrending}
          renderCard={(item, i) => (
            <div
              key={i}
              onClick={() => navigate(`/manga/${item.id}`)}
              style={{ flexShrink: 0, width: 140, cursor: 'pointer' }}
            >
              <div style={{ width: 140, height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(217,119,6,0.15)' }}>
                <img src={item.cover} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.title}
              </div>
            </div>
          )}
        />
      )}

      {/* === NEW MANGA RELEASES === */}
      {mangaNew.length > 0 && (
        <Row
          title="New Manga Releases"
          items={mangaNew}
          renderCard={(item, i) => (
            <div
              key={i}
              onClick={() => navigate(`/manga/${item.id}`)}
              style={{ flexShrink: 0, width: 140, cursor: 'pointer' }}
            >
              <div style={{ width: 140, height: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(217,119,6,0.15)', position: 'relative' }}>
                <img src={item.cover} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'linear-gradient(135deg, #d97706, #f59e0b)', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>NEW</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.title}
              </div>
            </div>
          )}
        />
      )}

      {/* === BROWSE BY GENRE === */}
      <div style={{ marginBottom: 32 }}>
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
