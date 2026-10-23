import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../App'
import { useLocation, useNavigate } from 'react-router-dom'
import SkeletonCard from '../components/SkeletonCard'

const API = 'http://localhost:8642'

const MEDIA_TABS = ['Anime', 'Studios', 'Staff', 'Characters']
const GENRES = ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
const FORMATS = ['All', 'TV', 'TV Short', 'Movie', 'Special', 'OVA', 'ONA', 'Music']
const STATUSES = ['All', 'Finished Airing', 'Currently Airing', 'Not Yet Aired']
const YEARS = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2010s', '2000s']
const SORTS = ['Most Popular', 'Highest Rated', 'Trending', 'Newest', 'Title A-Z']

export default function Search() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setEpisodeModal } = useContext(AppContext)

  // Top header states
  const [activeMediaTab, setActiveMediaTab] = useState('Anime')
  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [selectedFormat, setSelectedFormat] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedYear, setSelectedYear] = useState('All')
  const [selectedSort, setSelectedSort] = useState('Most Popular')

  // Search results & pagination
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (location.state?.genre) {
      setSelectedGenre(location.state.genre)
    }
    if (location.state?.searchQuery) {
      setQuery(location.state.searchQuery)
    }
  }, [location.state])

  useEffect(() => {
    fetchResults()
  }, [query, selectedGenre, selectedFormat, selectedStatus, selectedYear, selectedSort, page])

  const fetchResults = async () => {
    setLoading(true)
    try {
      if (query.trim()) {
        const res = await fetch(`${API}/jikan/search?q=${encodeURIComponent(query)}&page=${page}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || data.data || [])
        setItems(list)
        setTotalPages(data.last_visible_page || (list.length >= 20 ? page + 1 : page))
      } else if (selectedGenre !== 'All') {
        const res = await fetch(`${API}/jikan/genre/${encodeURIComponent(selectedGenre)}?page=${page}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || data.data || [])
        setItems(list)
        setTotalPages(data.last_visible_page || (list.length >= 20 ? page + 1 : page))
      } else {
        const res = await fetch(`${API}/jikan/all?page=${page}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.results || data.data || [])
        setItems(list)
        setTotalPages(data.last_visible_page || 10)
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSelectedGenre('All')
    setSelectedFormat('All')
    setSelectedStatus('All')
    setSelectedYear('All')
    setSelectedSort('Most Popular')
    setQuery('')
    setPage(1)
  }

  return (
    <div className="miruro-page-container">
      {/* 1. Header: "Search" & Media Switcher Tabs (Screenshot 4 Match) */}
      <div className="miruro-search-top-header">
        <h1 className="miruro-page-heading">Search</h1>

        <div className="miruro-media-tabs">
          {MEDIA_TABS.map((tab) => (
            <button
              key={tab}
              className={`miruro-media-tab${activeMediaTab === tab ? ' active' : ''}`}
              onClick={() => setActiveMediaTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Miruro Filter Dropdowns Bar (Screenshot 4 Match) */}
      <div className="miruro-filter-bar">
        {/* Genre Dropdown */}
        <div className="miruro-filter-dropdown-wrap">
          <select
            className="miruro-filter-select"
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1) }}
          >
            <option value="All">Genres ⌵</option>
            {GENRES.filter(g => g !== 'All').map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Format Dropdown */}
        <div className="miruro-filter-dropdown-wrap">
          <select
            className="miruro-filter-select"
            value={selectedFormat}
            onChange={(e) => { setSelectedFormat(e.target.value); setPage(1) }}
          >
            <option value="All">Formats ⌵</option>
            {FORMATS.filter(f => f !== 'All').map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="miruro-filter-dropdown-wrap">
          <select
            className="miruro-filter-select"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1) }}
          >
            <option value="All">Status ⌵</option>
            {STATUSES.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Year Dropdown */}
        <div className="miruro-filter-dropdown-wrap">
          <select
            className="miruro-filter-select"
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1) }}
          >
            <option value="All">Year 📅 ⌵</option>
            {YEARS.filter(y => y !== 'All').map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="miruro-filter-dropdown-wrap">
          <select
            className="miruro-filter-select"
            value={selectedSort}
            onChange={(e) => { setSelectedSort(e.target.value); setPage(1) }}
          >
            {SORTS.map(s => (
              <option key={s} value={s}>{s} ⌵</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <button
          className="miruro-filter-reset-btn"
          onClick={resetFilters}
          title="Reset Filters"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </div>

      {/* 3. 7-Column Miruro Anime Grid (Screenshot 4 Match) */}
      {loading ? (
        <div className="miruro-7col-grid">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="miruro-7col-card">
              <div className="miruro-7col-poster-box skeleton-pulse" />
              <div className="skeleton-pulse" style={{ height: 16, marginTop: 8, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="search-empty">
          <span style={{ fontSize: 44 }}>🔍</span>
          <p>No results found matching your criteria</p>
          <button className="miruro-watch-btn-solid" style={{ marginTop: 16 }} onClick={resetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="miruro-7col-grid">
            {items.map((item, i) => {
              const targetId = item.id || item.mal_id || item.malId
              const title = item.title || item.titleEnglish || item.name || 'Untitled'
              const cover = item.cover || item.thumbnail || item.image || item.images?.jpg?.large_image_url || 'https://via.placeholder.com/200x280?text=No+Cover'
              const ep = item.episodes || item.sub_episodes || '?'
              const format = item.type || 'TV'
              const year = item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : '')

              return (
                <div
                  key={targetId || i}
                  className="miruro-7col-card"
                  onClick={() => {
                    if (targetId) navigate(`/anime/${targetId}`)
                    else navigate('/anime/0', { state: { searchQuery: title } })
                  }}
                >
                  <div className="miruro-7col-poster-box">
                    <img
                      src={cover}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="miruro-7col-poster"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x280?text=No+Cover'
                      }}
                    />

                    {/* Bottom Metadata Pill on Poster: 💾 25 TV 2013 */}
                    <div className="miruro-poster-pill">
                      <span>💾</span>
                      <span>{ep}</span>
                      <span>{format}</span>
                      {year && <span>{year}</span>}
                    </div>
                  </div>

                  <h4 className="miruro-7col-title" title={title}>
                    {title}
                  </h4>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          <div className="miruro-pagination-bar">
            <button
              className="miruro-page-btn"
              disabled={page <= 1}
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              ← Previous
            </button>
            <span className="miruro-page-info">Page {page} of {totalPages}</span>
            <button
              className="miruro-page-btn"
              disabled={page >= totalPages}
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
