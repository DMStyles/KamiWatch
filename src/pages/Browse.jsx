import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'
const LETTERS = ['#', 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

export default function Browse() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [activeLetter, setActiveLetter] = useState(null)
  const { setEpisodeModal } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchAnime(1, activeLetter)
  }, [])

  const fetchAnime = async (p, letter) => {
    setLoading(true)
    setError('')
    try {
      const letterParam = letter && letter !== '#' ? `&letter=${letter}` : ''
      const res = await fetch(`${API}/jikan/all?page=${p}${letterParam}`)
      const data = await res.json()
      if (data.error && (!data.results || data.results.length === 0)) {
        setError(data.error)
        setResults([])
      } else {
        setResults(data.results || [])
        setPage(p)
        setHasNext(data.has_next || false)
        setTotalPages(data.total_pages || 1)
      }
    } catch {
      setError('Failed to connect to backend. Make sure the app is fully loaded.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLetter = (letter) => {
    setActiveLetter(letter === activeLetter ? null : letter)
    fetchAnime(1, letter === activeLetter ? null : letter)
  }

  const handlePage = (p) => {
    fetchAnime(p, activeLetter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="browse-page">
      {/* Header */}
      <div className="browse-header">
        <h1 className="browse-title">
          <span style={{color:'var(--primary)'}}>All</span> Anime
        </h1>
        <p className="browse-sub">Browse all anime · sorted alphabetically · powered by MyAnimeList</p>
      </div>

      {/* Alphabet Filter */}
      <div className="alphabet-bar">
        {LETTERS.map(l => (
          <button
            key={l}
            className={`alpha-btn${activeLetter === l ? ' active' : ''}`}
            onClick={() => handleLetter(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="browse-loading">
          <span className="spinner large" />
          <p>Loading anime from MyAnimeList...</p>
          <p style={{fontSize:12, color:'var(--text-muted)'}}>This may take a moment due to API rate limits</p>
        </div>
      ) : error ? (
        <div className="search-empty">
          <span style={{fontSize:40}}>⏳</span>
          <p style={{color:'var(--text-muted)'}}>{error}</p>
          <button className="btn btn-primary" style={{marginTop:16}} onClick={() => fetchAnime(page, activeLetter)}>
            Try Again
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="search-empty">
          <span style={{fontSize:40}}>🎌</span>
          <p>No results found. Try a different letter or page.</p>
          <button className="btn btn-ghost" style={{marginTop:12}} onClick={() => fetchAnime(1, null)}>
            Show All Anime
          </button>
        </div>
      ) : (
        <>
          <div className="results-grid browse-grid">
            {results.map((item, i) => (
              <div
                key={i}
                className="result-card"
                onClick={() => navigate(item.mal_id ? `/anime/${item.mal_id}` : '/anime/0', { state: { searchQuery: item.title } })}
              >
                <div className="result-card-img">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'}
                  />
                  <div className="result-card-overlay">
                    <button className="card-play-btn large">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                  <div className="result-badges">
                    {item.score && <span className="badge badge-sub">⭐ {item.score}</span>}
                  </div>
                  {item.status === 'Currently Airing' && (
                    <span className="badge-airing">AIRING</span>
                  )}
                </div>
                <div className="result-card-info">
                  <p className="result-title">{item.title}</p>
                  <div className="result-meta">
                    <span style={{color:'var(--text-muted)',fontSize:12}}>{item.type}</span>
                    {item.year && <span style={{color:'var(--text-muted)',fontSize:12}}>{item.year}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost page-btn"
                disabled={page <= 1 || loading}
                onClick={() => handlePage(page - 1)}
              >
                ← Prev
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let p
                  if (totalPages <= 7) {
                    p = i + 1
                  } else if (page <= 4) {
                    p = i + 1
                  } else if (page >= totalPages - 3) {
                    p = totalPages - 6 + i
                  } else {
                    p = page - 3 + i
                  }
                  return (
                    <button
                      key={p}
                      className={`page-num-btn${p === page ? ' active' : ''}`}
                      onClick={() => handlePage(p)}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
              <button
                className="btn btn-ghost page-btn"
                disabled={!hasNext || loading}
                onClick={() => handlePage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
