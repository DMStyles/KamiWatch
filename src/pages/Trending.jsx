import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'
const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020]

export default function Trending() {
  const navigate = useNavigate()
  const [activeSeason, setActiveSeason] = useState('FALL')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrending(activeSeason, selectedYear)
  }, [activeSeason, selectedYear])

  const fetchTrending = async (season, year) => {
    setLoading(true)
    try {
      // Fetch trending / seasonal anime from backend based on chosen season & year
      const res = await fetch(`${API}/jikan/season?season=${encodeURIComponent(season)}&year=${encodeURIComponent(year)}`)
      const data = await res.json()
      let list = Array.isArray(data) ? data : (data.results || data.data || [])
      if (!list || list.length === 0) {
        // Fallback to all trending if empty
        const fallbackRes = await fetch(`${API}/jikan/all?page=1`)
        const fallbackData = await fallbackRes.json()
        list = Array.isArray(fallbackData) ? fallbackData : (fallbackData.results || fallbackData.data || [])
      }
      setItems(list.slice(0, 36))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="miruro-page-container">
      {/* Subheader: Seasons Pills & Year Dropdown (Screenshot 2 Match) */}
      <div className="miruro-trending-header">
        <div className="miruro-season-pills">
          {SEASONS.map((s) => (
            <button
              key={s}
              className={`miruro-season-pill${activeSeason === s ? ' active' : ''}`}
              onClick={() => setActiveSeason(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="miruro-year-dropdown-wrap">
          <span className="miruro-year-icon">📅</span>
          <select
            className="miruro-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Column Wide Cards Grid */}
      {loading ? (
        <div className="miruro-trending-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="miruro-wide-card skeleton-pulse" style={{ height: 140 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="search-empty">
          <span style={{ fontSize: 44 }}>🍂</span>
          <p>No seasonal entries found for this selection</p>
        </div>
      ) : (
        <div className="miruro-trending-grid">
          {items.map((item, idx) => {
            const targetId = item.id || item.mal_id || item.malId
            const cover = item.cover || item.thumbnail || item.image || item.images?.jpg?.large_image_url || 'https://via.placeholder.com/200x280?text=No+Cover'
            const title = item.title || item.titleEnglish || item.name || 'Untitled'
            const epCount = item.episodes || item.sub_episodes || '12'
            const format = item.type || 'TV'
            const year = item.year || selectedYear
            const synopsis = item.synopsis || item.description || 'No synopsis available for this title.'
            const genres = Array.isArray(item.genres)
              ? item.genres.map(g => (typeof g === 'object' ? g.name : g)).slice(0, 3)
              : (Array.isArray(item.genre) ? item.genre.slice(0, 3) : ['Action', 'Fantasy'])

            return (
              <div
                key={targetId || idx}
                className="miruro-wide-card"
                onClick={() => {
                  if (targetId) navigate(`/anime/${targetId}`)
                  else navigate('/anime/0', { state: { searchQuery: title } })
                }}
              >
                {/* Left: Poster */}
                <div className="miruro-wide-poster-wrap">
                  <img
                    src={cover}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="miruro-wide-poster"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x280?text=No+Cover'
                    }}
                  />
                </div>

                {/* Right: Details */}
                <div className="miruro-wide-details">
                  <h3 className="miruro-wide-title" title={title}>
                    {title}
                  </h3>

                  {/* Status bullet: 🟢 10 ONA 2026 */}
                  <div className="miruro-wide-status">
                    <span className="miruro-green-dot" />
                    <span>{epCount}</span>
                    <span>{format}</span>
                    <span>{year}</span>
                  </div>

                  {/* Synopsis text (3-lines clamped) */}
                  <p className="miruro-wide-synopsis">
                    {synopsis}
                  </p>

                  {/* Genre tags */}
                  <div className="miruro-wide-genres">
                    {genres.map((g, i) => (
                      <span key={i} className="miruro-mini-pill">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
