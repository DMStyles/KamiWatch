import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'

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
  { title: 'Solo Leveling', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx151807-it355ZgzquUd.png', ep: 12, type: 'TV' },
  { title: 'Demon Slayer', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21612-d5zrx9CWkxNl.png', ep: 26, type: 'TV' },
  { title: 'Grand Blue', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx100922-uxEhaCsqMMp3.png', ep: 12, type: 'TV' },
  { title: 'One Piece', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-ELSYx3yMPcKM.jpg', ep: 1000, type: 'TV' },
  { title: 'Jujutsu Kaisen', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-LHBAeoZDIsnF.jpg', ep: 24, type: 'TV' },
  { title: 'Attack on Titan', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg', ep: 25, type: 'TV' },
  { title: 'Chainsaw Man', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx127230-DdP4vAdssLoz.png', ep: 12, type: 'TV' },
  { title: 'Frieren: Beyond Journey\'s End', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx170068-ijY3tCP8KoWP.jpg', ep: 28, type: 'TV' },
  { title: 'Spy x Family', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx140960-Kb6R5nYQfjmP.jpg', ep: 25, type: 'TV' },
  { title: 'Oshi no Ko', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx150672-WqmmwZ4nMzAy.png', ep: 11, type: 'TV' },
  { title: 'Bocchi the Rock!', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx130003-HTDmeL4RGeJ4.png', ep: 12, type: 'TV' },
  { title: 'My Hero Academia', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21459-nYh85uj2Fuwr.jpg', ep: 13, type: 'TV' },
  { title: 'Bleach: Thousand-Year Blood War', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx116674-p3zK4PUX2Aag.jpg', ep: 13, type: 'TV' },
  { title: 'Naruto Shippuden', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1735-kGfVm0YqCPcu.png', ep: 500, type: 'TV' },
  { title: 'Hunter x Hunter', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx136-gj0bbCpDNrKG.jpg', ep: 148, type: 'TV' },
  { title: 'Death Note', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx1535-kUgkcrfOrkUM.jpg', ep: 37, type: 'TV' },
]

const RECENT_EPISODES = [
  { title: 'Kaiju No. 8', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx153288-z2GkS1vLg1bB.jpg', ep: 10, type: 'TV' },
  { title: 'Wind Breaker', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx163132-uG71E62YIfvL.jpg', ep: 12, type: 'TV' },
  { title: 'Mushoku Tensei S2 P2', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx166873-1pX13L8E0Jk2.png', ep: 11, type: 'TV' },
  { title: 'Demon Slayer: Hashira Training', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx166240-yZlO0qjQWj5X.jpg', ep: 6, type: 'TV' },
  { title: 'My Hero Academia S7', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx163146-H04sO2kO0A0S.jpg', ep: 8, type: 'TV' },
  { title: 'Slime S3', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx156822-0l2Gz4Z2H3xG.png', ep: 11, type: 'TV' },
  { title: 'Spice and Wolf', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx145680-W8B9gKxTGyZf.png', ep: 12, type: 'TV' },
  { title: 'KonoSuba S3', thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx133031-G21d0kZ1R6i1.jpg', ep: 11, type: 'TV' },
]

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [activeGenre, setActiveGenre] = useState(null)
  const [follows, setFollows] = useState([])
  const navigate = useNavigate()
  const { setEpisodeModal } = useContext(AppContext)

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 5000)
    fetchFollows()
    return () => clearInterval(timer)
  }, [])

  const fetchFollows = async () => {
    try {
      const res = await fetch(`${API}/library/follows`)
      const data = await res.json()
      setFollows(data)
    } catch {}
  }

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
              onClick={() => navigate('/search', { state: { searchQuery: hero.title } })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </button>
            <button
              className="btn btn-secondary hero-btn"
              onClick={() => navigate('/search', { state: { searchQuery: hero.title } })}
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
            onClick={() => { setActiveGenre(g === activeGenre ? null : g); navigate('/search', { state: { searchQuery: g } }) }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* My Follow List */}
      {follows.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <span className="section-title">💖 My Follow List</span>
          </div>
          <div className="horizontal-scroll">
            {follows.map((item, i) => (
              <div
                key={i}
                className="anime-card"
                onClick={() => setEpisodeModal(item)}
              >
                <div className="anime-card-img">
                  <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
                  <div className="anime-card-overlay">
                    <button className="card-play-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                  <span className="anime-card-badge" style={{textTransform:'capitalize'}}>{item.source}</span>
                </div>
                <div className="anime-card-info">
                  <p className="anime-card-title">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
              onClick={() => navigate('/search', { state: { searchQuery: item.title } })}
            >
              <div className="anime-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
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

      {/* Recently Released Episodes */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-title">🕒 Recently Released Episodes</span>
          <button className="btn btn-ghost" style={{fontSize:13}} onClick={() => navigate('/search')}>See all →</button>
        </div>
        <div className="horizontal-scroll">
          {RECENT_EPISODES.map((item, i) => (
            <div
              key={i}
              className="anime-card"
              onClick={() => navigate('/search', { state: { searchQuery: item.title } })}
            >
              <div className="anime-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
                <div className="anime-card-overlay">
                  <button className="card-play-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
                <span className="anime-card-badge" style={{background: 'var(--primary)'}}>New Ep {item.ep}</span>
              </div>
              <div className="anime-card-info">
                <p className="anime-card-title">{item.title}</p>
                <p className="anime-card-ep">{item.type} Series</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Updated Series */}
      <section className="home-section">
        <div className="section-header">
          <span className="section-title">🔄 Recently Updated Series</span>
          <button className="btn btn-ghost" style={{fontSize:13}} onClick={() => navigate('/search')}>See all →</button>
        </div>
        <div className="horizontal-scroll">
          {[...TRENDING].reverse().map((item, i) => (
            <div
              key={i}
              className="anime-card"
              onClick={() => navigate('/search', { state: { searchQuery: item.title } })}
            >
              <div className="anime-card-img">
                <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
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

      {/* Popular Genres */}
      <section className="home-section" style={{padding: '0 24px'}}>
        <div className="section-header" style={{padding: 0}}>
          <span className="section-title">🎭 Browse Genres</span>
        </div>
        <div className="genre-grid">
          {[
            { name: 'Action', gradient: 'linear-gradient(135deg, #ef4444, #ec4899)', icon: '⚔️' },
            { name: 'Fantasy', gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', icon: '🔮' },
            { name: 'Adventure', gradient: 'linear-gradient(135deg, #06b6d4, #10b981)', icon: '🗺️' },
            { name: 'Comedy', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', icon: '😂' },
            { name: 'Sci-Fi', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', icon: '🚀' },
            { name: 'Romance', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)', icon: '💖' },
            { name: 'Mystery', gradient: 'linear-gradient(135deg, #1f2937, #4b5563)', icon: '🕵️' },
            { name: 'Supernatural', gradient: 'linear-gradient(135deg, #4f46e5, #06b6d4)', icon: '👻' }
          ].map((genre, i) => (
            <div
              key={i}
              className="genre-card"
              style={{ background: genre.gradient }}
              onClick={() => navigate('/search', { state: { searchQuery: genre.name } })}
            >
              <span className="genre-card-icon">{genre.icon}</span>
              <span className="genre-card-name">{genre.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{height: 60}} />
    </div>
  )
}
