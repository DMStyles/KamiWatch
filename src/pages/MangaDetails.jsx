import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

const API = 'http://localhost:8642'
const ANILIST = 'https://graphql.anilist.co'

export default function MangaDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const mangaFromState = location.state?.manga

  const [details, setDetails] = useState(mangaFromState || null)
  const [chapters, setChapters] = useState([])
  const [loadingChapters, setLoadingChapters] = useState(true)
  const [sortAsc, setSortAsc] = useState(true)
  const [mangaSources, setMangaSources] = useState([
    { id: 'auto', name: 'Auto (MangaDex / Kakalot)' }
  ])
  const [selectedSource, setSelectedSource] = useState('auto')

  // English title + anime adaptations from AniList
  const [englishTitle, setEnglishTitle] = useState('')
  const [animeAdaptations, setAnimeAdaptations] = useState([])
  const [loadingAnilist, setLoadingAnilist] = useState(false)

  // Apply manga theme
  useEffect(() => {
    document.body.classList.add('manga-mode')
    loadMangaExtensions()
    return () => document.body.classList.remove('manga-mode')
  }, [])

  const loadMangaExtensions = async () => {
    try {
      const list = await window.electronAPI?.extensions?.list() || []
      const mangaExts = list
        .filter(item => {
          const type = (item.manifest?.type || '').toLowerCase()
          return type.includes('manga') || type.includes('plugin')
        })
        .map(item => ({
          id: `ext_${item.manifest.id}`,
          name: `🧩 ${item.manifest.name} (Plugin)`,
          extId: item.manifest.id
        }))
      setMangaSources([{ id: 'auto', name: 'Auto (MangaDex / Kakalot)' }, ...mangaExts])
    } catch {}
  }

  // Fetch full details if not passed via state
  useEffect(() => {
    if (!mangaFromState || !mangaFromState.description) {
      fetchDetails()
    }
    fetchChapters(selectedSource)
  }, [id, selectedSource])

  // Fetch AniList English title + anime adaptations when we have a title
  useEffect(() => {
    const title = details?.title || mangaFromState?.title
    if (title) {
      fetchAnilistMangaData(title)
    }
  }, [details?.title, mangaFromState?.title])

  const fetchDetails = async () => {
    try {
      const r = await fetch(`${API}/manga/details?id=${encodeURIComponent(decodeURIComponent(id))}`)
      const data = await r.json()
      if (!data.error) setDetails(data)
    } catch {}
  }

  /** Query AniList for the manga to get English title + any anime adaptations */
  const fetchAnilistMangaData = async (title) => {
    setLoadingAnilist(true)
    try {
      const query = `
        query ($search: String) {
          Media(search: $search, type: MANGA) {
            title { english romaji native }
            relations {
              edges {
                relationType
                node {
                  id
                  type
                  title { english romaji }
                  coverImage { large }
                  status
                  seasonYear
                  format
                  averageScore
                }
              }
            }
          }
        }
      `
      const resp = await fetch(ANILIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables: { search: title } })
      })
      const data = await resp.json()
      const media = data?.data?.Media
      if (!media) return

      // Set English title if it's different from the displayed title
      const en = media.title?.english
      const romaji = media.title?.romaji
      if (en && en !== title && en !== romaji) {
        setEnglishTitle(en)
      }

      // Find anime adaptations from relations
      const edges = media.relations?.edges || []
      const adaptations = edges
        .filter(e => e.node?.type === 'ANIME' && ['ADAPTATION', 'ALTERNATIVE'].includes(e.relationType))
        .map(e => ({
          id: e.node.id,
          title: e.node.title?.english || e.node.title?.romaji || 'Unknown',
          cover: e.node.coverImage?.large || '',
          status: e.node.status,
          year: e.node.seasonYear,
          format: (e.node.format || 'TV').replace('_', ' '),
          score: e.node.averageScore ? (e.node.averageScore / 10).toFixed(1) : null,
          relationType: e.relationType
        }))
      setAnimeAdaptations(adaptations)
    } catch (err) {
      console.warn('AniList manga lookup failed:', err.message)
    } finally {
      setLoadingAnilist(false)
    }
  }

  const fetchChapters = async (sourceId = selectedSource) => {
    setLoadingChapters(true)
    setChapters([])
    try {
      if (sourceId.startsWith('ext_')) {
        const extId = sourceId.replace('ext_', '')
        const title = details?.title || mangaFromState?.title || id
        const searchRes = await window.electronAPI?.extensions?.callProvider(extId, 'search', [{ query: title }])
        const firstMatch = searchRes?.result?.[0]
        const mId = firstMatch?.id || firstMatch?.url || title
        const chRes = await window.electronAPI?.extensions?.callProvider(extId, 'findChapters', [mId])
        const chList = (chRes?.result || []).map(c => ({
          id: c.id || c.url,
          title: c.title || `Chapter ${c.chapter || 1}`,
          chapter: c.chapter || 1,
          extId
        }))
        setChapters(chList)
      } else {
        const r = await fetch(`${API}/manga/chapters?id=${encodeURIComponent(decodeURIComponent(id))}`)
        const data = await r.json()
        setChapters(data.chapters || [])
      }
    } catch {
      setChapters([])
    }
    setLoadingChapters(false)
  }

  const handleReadChapter = (chapter) => {
    navigate(`/manga/${id}/read/${encodeURIComponent(chapter.id)}`, {
      state: { chapter, manga: details, chapters, selectedSource }
    })
  }

  const displayedChapters = sortAsc ? [...chapters] : [...chapters].reverse()

  const statusColor = (s) => {
    const lower = (s || '').toLowerCase()
    if (lower === 'publishing' || lower === 'ongoing') return '#10b981'
    if (lower === 'finished' || lower === 'completed') return '#60a5fa'
    return '#fbbf24'
  }

  return (
    <div className="manga-details-page">
      {/* Hero Banner */}
      <div
        className="manga-details-hero"
        style={{ backgroundImage: details?.cover ? `url(${details.cover})` : 'none', backgroundColor: '#0d0a05' }}
      >
        <div className="manga-details-hero-overlay" />
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 5 }}>
          <button
            className="manga-reader-back-btn"
            onClick={() => navigate('/manga')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="manga-details-container">
        {/* Left: Cover */}
        <div>
          {details?.cover ? (
            <img className="manga-details-cover" src={details.cover} alt={details?.title} />
          ) : (
            <div className="manga-details-cover" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, borderRadius: 12 }}>
              📚
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="manga-details-right">
          {/* Title + English title */}
          <h1 className="manga-details-title">{details?.title || 'Loading...'}</h1>
          {englishTitle && (
            <div style={{
              fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginTop: -8, marginBottom: 6,
              fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontStyle: 'normal', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>EN</span>
              {englishTitle}
            </div>
          )}

          <div className="manga-details-meta">
            {details?.status && (
              <span className="manga-badge" style={{ color: statusColor(details.status), borderColor: statusColor(details.status) + '44' }}>
                {details.status}
              </span>
            )}
            {details?.year && <span className="manga-badge manga-badge-neutral">{details.year}</span>}
            {details?.author && <span className="manga-badge manga-badge-neutral">✍️ {details.author}</span>}
          </div>

          {/* Manga Provider Selector */}
          <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Manga Source:</span>
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, outline: 'none'
              }}
            >
              {mangaSources.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0e0e16' }}>{s.name}</option>
              ))}
            </select>
          </div>

          {details?.description && (
            <p className="manga-description">{details.description}</p>
          )}

          {details?.genres && details.genres.length > 0 && (
            <div className="manga-genres">
              {details.genres.slice(0, 12).map(g => (
                <span key={g} className="manga-genre-tag">{g}</span>
              ))}
            </div>
          )}

          {/* Read First / Latest Chapter */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {chapters.length > 0 && (
              <>
                <button
                  className="manga-read-btn"
                  onClick={() => handleReadChapter(chapters[0])}
                >
                  📖 Read First Chapter
                </button>
                <button
                  className="manga-read-btn"
                  style={{ background: 'rgba(217,119,6,0.15)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.3)' }}
                  onClick={() => handleReadChapter(chapters[chapters.length - 1])}
                >
                  ⏩ Latest Chapter
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Anime Adaptations Section ─── */}
      {(animeAdaptations.length > 0 || loadingAnilist) && (
        <div style={{ maxWidth: 1000, margin: '32px auto 0', padding: '0 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--accent)', fontSize: 20 }}>📺</span>
            Anime Adaptation{animeAdaptations.length > 1 ? 's' : ''}
          </h2>

          {loadingAnilist && animeAdaptations.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
              <span className="spinner" style={{ width: 14, height: 14, display: 'inline-block', marginRight: 8 }} />
              Looking up anime adaptation...
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {animeAdaptations.map(anime => (
                <div
                  key={anime.id}
                  onClick={() => navigate(`/anime/${anime.id}`)}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 14, padding: 14, cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 260, maxWidth: 420, flex: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {/* Anime cover */}
                  {anime.cover ? (
                    <img
                      src={anime.cover}
                      alt={anime.title}
                      style={{ width: 64, height: 92, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 64, height: 92, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎬</div>
                  )}

                  {/* Anime info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 6 }}>
                      {anime.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                        background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)'
                      }}>
                        {anime.format}
                      </span>
                      {anime.year && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                          {anime.year}
                        </span>
                      )}
                      {anime.score && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                          ★ {anime.score}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: statusColor(anime.status), textTransform: 'capitalize'
                    }}>
                      {(anime.status || '').replace('_', ' ').toLowerCase()}
                    </div>
                    <div style={{
                      marginTop: 10, fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      View Anime → 
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chapter List */}
      <div style={{ maxWidth: 1000, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
            Chapters ({chapters.length})
          </h2>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            style={{
              padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            {sortAsc ? '⬆️ Oldest First' : '⬇️ Newest First'}
          </button>
        </div>

        {loadingChapters ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <span className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13 }}>Fetching chapter list...</p>
          </div>
        ) : displayedChapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No chapters found for this manga source.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {displayedChapters.map((ch, i) => (
              <div
                key={ch.id || i}
                onClick={() => handleReadChapter(ch)}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-manga)'
                  e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ch.title || `Chapter ${ch.chapter || i + 1}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent-manga)' }}>Read →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
