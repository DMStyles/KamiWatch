import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const HERO_SLIDES = [
  {
    title: 'One Piece',
    synopsis: 'Gold Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line...',
    image: 'https://image.tmdb.org/t/p/original/a6ptrTUH1c5OdWanjyYtAkOuYD0.jpg',
    type: 'TV', episodes: '1000+', rating: 'PG-13',
  },
  {
    title: 'Mushoku Tensei: Season 3',
    synopsis: 'The third season of the isekai reincarnation epic — Rudeus faces his greatest challenges yet.',
    image: 'https://cdn.anipixcdn.co/background/f75f370e170606d0_1783551063.webp',
    type: 'TV', episodes: '12', rating: 'R',
  },
  {
    title: 'That Time I Got Reincarnated as a Slime S4',
    synopsis: "Demon Lord Rimuru's dream of creating an alliance between humans and monsters takes a step closer...",
    image: 'https://cdn.anipixcdn.co/background/14c2f4ab3ad95f50_1778862809.jpg',
    type: 'TV', episodes: '24', rating: 'PG-13',
  },
]

const GENRE_TAGS = ['Action','Adventure','Comedy','Drama','Ecchi','Fantasy','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Supernatural','Thriller']

const TRENDING = [
  { title: 'Solo Leveling S2', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/33c62722584316e94dc5107447218121.jpg', ep: 12, type: 'TV' },
  { title: 'Demon Slayer', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/279f2530e2209f81b0d5f758e480385a.jpg', ep: 26, type: 'TV' },
  { title: 'Grand Blue S3', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/a1ea8c4b315b25f06e3c212423037951.jpg', ep: 2, type: 'TV' },
  { title: 'Black Torch', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/6aa020e879ccd33affde6c1b1af4bb2f.jpg', ep: 12, type: 'TV' },
  { title: 'Skeleton Knight S2', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/6c5d124eddd0219b81c8ac758464e25b.jpg', ep: 2, type: 'TV' },
  { title: 'Kill Blue', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/6aa020e879ccd33affde6c1b1af4bb2f.jpg', ep: 12, type: 'TV' },
  { title: 'Oh Boy Was I Wrong', thumbnail: 'https://cdn.anipixcdn.co/thumbnail/4419e6f092d05cce603eb9337e62b210.jpg', ep: 2, type: 'TV' },
]

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [activeGenre, setActiveGenre] = useState(null)
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  const hero = HERO_SLIDES[heroIdx]

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <div className="hero" style={{ backgroundImage: `url(${hero.image})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-meta">
            <span className="badge badge-type">{hero.type}</span>
            <span className="badge badge-source">{hero.episodes} Episodes</span>
            <span className="badge badge-source">{hero.rating}</span>
          </div>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-synopsis">{hero.synopsis}</p>
          <div className="hero-actions">
            <button
              className="btn btn-primary hero-btn"
              onClick={() => navigate('/search')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </button>
            <button
              className="btn btn-secondary hero-btn"
              onClick={() => navigate('/search')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Find Episodes
            </button>
          </div>
        </div>
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === heroIdx ? ' active' : ''}`}
              onClick={() => setHeroIdx(i)}
            />
          ))}
        </div>
      </div>

      {/* Genre Tags */}
      <div className="genre-bar">
        {GENRE_TAGS.map(g => (
          <button
            key={g}
            className={`genre-tag${activeGenre === g ? ' active' : ''}`}
            onClick={() => { setActiveGenre(g === activeGenre ? null : g); navigate('/search') }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Trending Row */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-title">🔥 Trending Now</span>
          <button className="btn btn-ghost" style={{fontSize:13}} onClick={() => navigate('/search')}>See all →</button>
        </div>
        <div className="horizontal-scroll">
          {TRENDING.map((item, i) => (
            <div
              key={i}
              className="anime-card"
              onClick={() => navigate('/search')}
            >
              <div className="anime-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" />
                <div className="anime-card-overlay">
                  <button className="card-play-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
                <span className="anime-card-badge">{item.type}</span>
              </div>
              <div className="anime-card-info">
                <p className="anime-card-title">{item.title}</p>
                <p className="anime-card-ep">Ep {item.ep}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Updated */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-title">🆕 Recently Updated</span>
          <button className="btn btn-ghost" style={{fontSize:13}} onClick={() => navigate('/search')}>See all →</button>
        </div>
        <div className="horizontal-scroll">
          {[...TRENDING].reverse().map((item, i) => (
            <div
              key={i}
              className="anime-card"
              onClick={() => navigate('/search')}
            >
              <div className="anime-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" />
                <div className="anime-card-overlay">
                  <button className="card-play-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              </div>
              <div className="anime-card-info">
                <p className="anime-card-title">{item.title}</p>
                <p className="anime-card-ep">Ep {item.ep} · {item.type}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{height: 40}} />
    </div>
  )
}
