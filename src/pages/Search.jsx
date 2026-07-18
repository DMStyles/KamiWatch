import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../App'
import { useLocation, useNavigate } from 'react-router-dom'

const API = 'http://localhost:8642'
const LETTERS = ['#', 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

export default function Search() {
  const [tab, setTab] = useState('browse') // 'browse' or 'latest'
  
  // Scraper search states
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSource, setActiveSource] = useState('all')
  const [genreMode, setGenreMode] = useState(null) // null = search mode, string = genre name
  const [timetable, setTimetable] = useState(null)

  // Browse index states
  const [browseResults, setBrowseResults] = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [activeLetter, setActiveLetter] = useState(null)

  const { setEpisodeModal } = useContext(AppContext)
  const inputRef = useRef()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab === 'scrapers' ? 'latest' : location.state.tab)
      setGenreMode(null)
      setQuery('')
      if (location.state.tab === 'browse') {
        setBrowseResults([])
        fetchBrowse(1, null)
      }
    } else if (location.state?.showLatest) {
      setTab('latest')
      setGenreMode(null)
      setQuery('')
      fetchLatestScraperEpisodes()
    } else if (location.state?.showAiring) {
      setTab('browse')
      setGenreMode('Airing This Season')
      setQuery('')
      setBrowseResults([])
      browseAiring()
    } else if (location.state?.genre) {
      // Genre filter mode — use Jikan API
      setTab('browse')
      setGenreMode(location.state.genre)
      setQuery('')
      setBrowseResults([])
      browseGenre(location.state.genre)
    } else if (location.state?.searchQuery) {
      setTab('browse')
      setGenreMode(null)
      setQuery(location.state.searchQuery)
      fetchBrowse(1, null, location.state.searchQuery)
    }
  }, [location.state])

  useEffect(() => {
    if (tab === 'browse' && browseResults.length === 0 && !genreMode && !query) {
      fetchBrowse(1, null)
    }
  }, [tab])

  const browseAiring = async () => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      const res = await fetch(`${API}/jikan/airing?limit=100`)
      const data = await res.json()
      const items = data.results || []
      setBrowseResults(items)
      if (items.length === 0) setBrowseError("No currently airing anime found.")
    } catch {
      setBrowseError('Failed to load airing anime. Make sure the backend is running.')
    } finally {
      setBrowseLoading(false)
    }
  }

  const browseGenre = async (genre) => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      const res = await fetch(`${API}/jikan/by-genre?genre=${encodeURIComponent(genre)}`)
      const data = await res.json()
      const items = data.results || []
      setBrowseResults(items)
      if (items.length === 0) setBrowseError(`No anime found for genre "${genre}".`)
    } catch {
      setBrowseError('Failed to load genre. Make sure the backend is running.')
    } finally {
      setBrowseLoading(false)
    }
  }

  const fetchLatestScraperEpisodes = async () => {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const [resLatest, resSchedule] = await Promise.all([
        fetch(`${API}/anikoto/latest?limit=100`),
        fetch(`${API}/schedule/timetables?weeksAfter=0`).catch(() => null)
      ])
      
      const dataLatest = await resLatest.json()
      let dataSchedule = null
      if (resSchedule && resSchedule.ok) {
        dataSchedule = await resSchedule.json()
      }
      
      setResults(dataLatest.results || [])
      setTimetable(dataSchedule)
      
      if ((dataLatest.results || []).length === 0) {
        setError('No latest episodes found.')
      }
    } catch {
      setError('Failed to fetch latest episodes.')
    } finally {
      setLoading(false)
    }
  }

  const search = async (q) => {
    if (!q.trim()) return
    setGenreMode(null)
    setLoading(true)
    setError('')
    setResults([])
    try {
      const [r1, r2, r3, r4] = await Promise.allSettled([
        fetch(`${API}/anikoto/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`${API}/animetake/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`${API}/kissanime/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
        fetch(`${API}/museasia/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
      ])
      const merged = [
        ...(r1.status === 'fulfilled' ? r1.value.results || [] : []),
        ...(r2.status === 'fulfilled' ? r2.value.results || [] : []),
        ...(r3.status === 'fulfilled' ? r3.value.results || [] : []),
        ...(r4.status === 'fulfilled' ? r4.value.results || [] : []),
      ]
      setResults(merged)
      if (merged.length === 0) setError('No results found. Try a different search term.')
    } catch {
      setError('Search failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrowse = async (p, letter, searchQ = '') => {
    setBrowseLoading(true)
    setBrowseError('')
    setBrowseResults([])
    try {
      let url = ''
      if (searchQ) {
        url = `${API}/jikan/search?q=${encodeURIComponent(searchQ)}&page=${p}`
      } else {
        const letterParam = letter && letter !== '#' ? `&letter=${letter}` : ''
        url = `${API}/jikan/all?page=${p}${letterParam}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.error && (!data.results || data.results.length === 0)) {
        setBrowseError(data.error)
        setBrowseResults([])
      } else {
        setBrowseResults(data.results || [])
        setPage(p)
        setHasNext(data.has_next || false)
        setTotalPages(data.total_pages || 1)
      }
    } catch {
      setBrowseError('Failed to connect to backend. Make sure the app is fully loaded.')
      setBrowseResults([])
    } finally {
      setBrowseLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      if (tab === 'browse') {
        setGenreMode(null)
        setActiveLetter(null)
        fetchBrowse(1, null, query)
      } else {
        search(query)
      }
    }
  }

  const handleSearchClick = () => {
    if (tab === 'browse') {
      setGenreMode(null)
      setActiveLetter(null)
      fetchBrowse(1, null, query)
    } else {
      setGenreMode(null)
      search(query)
    }
  }

  const handleLetter = (letter) => {
    const nextLetter = letter === activeLetter ? null : letter
    setActiveLetter(nextLetter)
    setQuery('')
    setGenreMode(null)
    fetchBrowse(1, nextLetter)
  }

  const handlePage = (p) => {
    fetchBrowse(p, activeLetter, query)
    const mainEl = document.querySelector('.app-main')
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = activeSource === 'all' ? results : results.filter(r => r.source === activeSource)

  // Sources available based on mode (Recently Released does not filter by scraper source)
  const sourceKeys = (genreMode || tab === 'latest')
    ? []
    : ['all', 'anikoto', 'kissanime', 'animetake', 'museasia']

  return (
    <div className="search-page" style={{padding:'24px'}}>
      
      {/* Sub tabs to toggle between scraper search and alphabetical MAL browse */}
      <div style={{display:'flex', gap:10, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:12}}>
        <button 
          className={`btn ${tab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
          style={{fontSize:13, padding:'6px 14px', borderRadius:20}}
          onClick={() => { setTab('browse'); setGenreMode(null); setQuery(''); setBrowseResults([]); setBrowseError(''); }}
        >
          🗂️ Anime Index (A-Z)
        </button>
        <button 
          className={`btn ${tab === 'latest' ? 'btn-primary' : 'btn-secondary'}`}
          style={{fontSize:13, padding:'6px 14px', borderRadius:20}}
          onClick={() => { setTab('latest'); setGenreMode(null); setQuery(''); setResults([]); setError(''); fetchLatestScraperEpisodes(); }}
        >
          🕒 Recently Released
        </button>
      </div>

      <div className="search-header">
        {genreMode ? (
          <>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:4}}>
              <button
                className="btn btn-ghost"
                style={{padding:'4px 10px', fontSize:13}}
                onClick={() => { setGenreMode(null); setBrowseResults([]); setBrowseError(''); fetchBrowse(1, null); }}
              >
                ← Back to Index
              </button>
            </div>
            <h1 className="search-heading">
               <span style={{color:'var(--text-muted)', fontWeight:400, fontSize:'0.6em', letterSpacing:2, textTransform:'uppercase', display:'block', marginBottom:4}}>
                 {genreMode === 'Airing This Season' ? 'Current Season' : 'Browsing Genre'}
               </span>
               {genreMode}
             </h1>
             <p className="search-sub">
               {genreMode === 'Airing This Season' ? 'Popular anime currently airing this season · powered by MyAnimeList' : 'Top-rated anime in this genre · powered by MyAnimeList'}
             </p>
          </>
        ) : tab === 'browse' ? (
          <>
            <h1 className="search-heading">Anime Index</h1>
            <p className="search-sub">Browse anime database alphabetically or search directly across the index</p>
          </>
        ) : (
          <>
            <h1 className="search-heading">Recently Released</h1>
            <p className="search-sub">Latest updated episodes from streaming servers</p>
          </>
        )}

        {tab === 'browse' && (
          <div className="search-input-wrap">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="Search all anime index by title..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              autoFocus={!genreMode}
            />
            {query && (
              <button className="search-clear" onClick={() => {
                setQuery('');
                setGenreMode(null);
                setActiveLetter(null);
                fetchBrowse(1, null);
                inputRef.current?.focus();
              }}>✕</button>
            )}
            <button className="btn btn-primary search-btn" onClick={handleSearchClick} disabled={browseLoading}>
              {browseLoading ? <span className="spinner" /> : 'Search'}
            </button>
          </div>
        )}

        {tab === 'browse' && !genreMode && (
          <div className="alphabet-bar" style={{marginTop: 14, marginBottom: 14}}>
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
        )}

        {tab === 'latest' && !genreMode && results.length > 0 && (
          <div className="source-tabs">
            {sourceKeys.map(s => (
              <button
                key={s}
                className={`source-tab${activeSource === s ? ' active' : ''}`}
                onClick={() => setActiveSource(s)}
              >
                {s === 'all'
                  ? `All (${results.length})`
                  : s === 'anikoto'
                  ? `Anikoto (${results.filter(r=>r.source==='anikoto').length})`
                  : s === 'kissanime'
                  ? `Kissanime (${results.filter(r=>r.source==='kissanime').length})`
                  : s === 'animetake'
                  ? `AnimeTake (${results.filter(r=>r.source==='animetake').length})`
                  : `Muse Asia (${results.filter(r=>r.source==='museasia').length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-results">
        
        {/* Render Scraper Search Mode */}
        {tab === 'latest' && (
          <>
            {error && (
              <div className="search-empty">
                <span style={{fontSize:40}}>🔍</span>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && !genreMode && (
              <div className="search-empty">
                <span style={{fontSize:48}}>🎌</span>
                <p>Search for any anime series to get started</p>
                <p style={{fontSize:13, color:'var(--text-muted)', marginTop:4}}>Try "One Piece", "Naruto", or "Attack on Titan"</p>
              </div>
            )}

            {(() => {
              if (!timetable || results.length === 0) {
                return (
                  <div className="results-grid">
                    {filtered.map((item, i) => (
                      <div
                        key={i}
                        className="result-card"
                        onClick={() => {
                          if (item.source === 'jikan' || genreMode) {
                            navigate(item.mal_id ? `/anime/${item.mal_id}` : '/anime/0', { state: { searchQuery: item.title } })
                          } else {
                            navigate('/anime/0', { state: { searchQuery: item.title } })
                          }
                        }}
                      >
                        <div className="result-card-img">
                          <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
                          <div className="result-card-overlay">
                            <button className="card-play-btn large">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                          </div>
                          {item.sub_episodes && item.sub_episodes !== '0' && item.sub_episodes !== '?' ? (
                            <span 
                              className="anime-card-badge" 
                              style={{ 
                                background: 'linear-gradient(135deg, var(--cyan), var(--accent))', 
                                fontWeight: '800', 
                                border: '1px solid rgba(255,255,255,0.15)', 
                                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.4)',
                                letterSpacing: '0.5px'
                              }}
                            >
                              EP {item.sub_episodes}
                            </span>
                          ) : item.type ? (
                            <span className="anime-card-badge">{item.type}</span>
                          ) : null}
                          <div className="result-badges">
                            {item.score && <span className="badge badge-sub">⭐ {item.score}</span>}
                            {!item.score && (() => {
                              const subText = item.sub_episodes && item.sub_episodes !== '0' && item.sub_episodes !== '?' ? `Sub ${item.sub_episodes}` : '';
                              const dubText = item.dub_episodes && item.dub_episodes !== '0' && item.dub_episodes !== '?' ? `Dub ${item.dub_episodes}` : '';
                              const jointText = subText && dubText ? `${subText} | ${dubText}` : (subText || dubText);
                              
                              if (!jointText) return null;
                              return (
                                <span className="badge badge-sub">
                                  {jointText}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="result-card-info">
                          <p className="result-title">{item.title}</p>
                          <div className="result-meta">
                            <span className="badge badge-source" style={{textTransform:'capitalize'}}>{item.source === 'jikan' ? 'MAL' : item.source}</span>
                            <span style={{color:'var(--text-muted)',fontSize:12}}>{item.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              // Grouping matching logic
              const titleToDay = {};
              Object.entries(timetable).forEach(([day, shows]) => {
                if (Array.isArray(shows)) {
                  shows.forEach(show => {
                    if (show.title) titleToDay[show.title.toLowerCase()] = day;
                    if (show.titleEnglish) titleToDay[show.titleEnglish.toLowerCase()] = day;
                  });
                }
              });

              const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
              const relativeDays = [];
              for (let i = 0; i < 7; i++) {
                const idx = (todayIndex - i + 7) % 7;
                relativeDays.push(daysOrder[idx]);
              }

              const groups = {};
              relativeDays.forEach(day => {
                groups[day] = [];
              });
              groups['other'] = [];

              filtered.forEach(item => {
                const itemTitle = item.title.toLowerCase();
                let foundDay = null;

                // Match item title to any timetable title
                for (const [title, day] of Object.entries(titleToDay)) {
                  if (itemTitle === title || itemTitle.includes(title) || title.includes(itemTitle)) {
                    foundDay = day;
                    break;
                  }
                }

                if (foundDay && groups[foundDay]) {
                  groups[foundDay].push(item);
                } else {
                  groups['other'].push(item);
                }
              });

              const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

              const renderCard = (item, i) => (
                <div
                  key={i}
                  className="result-card"
                  onClick={() => {
                    if (item.source === 'jikan' || genreMode) {
                      navigate(item.mal_id ? `/anime/${item.mal_id}` : '/anime/0', { state: { searchQuery: item.title } })
                    } else {
                      navigate('/anime/0', { state: { searchQuery: item.title } })
                    }
                  }}
                >
                  <div className="result-card-img">
                    <img src={item.thumbnail} alt={item.title} loading="lazy" onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'} />
                    <div className="result-card-overlay">
                      <button className="card-play-btn large">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                    {item.sub_episodes && item.sub_episodes !== '0' && item.sub_episodes !== '?' ? (
                      <span 
                        className="anime-card-badge" 
                        style={{ 
                          background: 'linear-gradient(135deg, var(--cyan), var(--accent))', 
                          fontWeight: '800', 
                          border: '1px solid rgba(255,255,255,0.15)', 
                          boxShadow: '0 2px 8px rgba(6, 182, 212, 0.4)',
                          letterSpacing: '0.5px'
                        }}
                      >
                        EP {item.sub_episodes}
                      </span>
                    ) : item.type ? (
                      <span className="anime-card-badge">{item.type}</span>
                    ) : null}
                    <div className="result-badges">
                      {item.score && <span className="badge badge-sub">⭐ {item.score}</span>}
                      {!item.score && (() => {
                        const subText = item.sub_episodes && item.sub_episodes !== '0' && item.sub_episodes !== '?' ? `Sub ${item.sub_episodes}` : '';
                        const dubText = item.dub_episodes && item.dub_episodes !== '0' && item.dub_episodes !== '?' ? `Dub ${item.dub_episodes}` : '';
                        const jointText = subText && dubText ? `${subText} | ${dubText}` : (subText || dubText);
                        
                        if (!jointText) return null;
                        return (
                          <span className="badge badge-sub">
                            {jointText}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="result-card-info">
                    <p className="result-title">{item.title}</p>
                    <div className="result-meta">
                      <span className="badge badge-source" style={{textTransform:'capitalize'}}>{item.source === 'jikan' ? 'MAL' : item.source}</span>
                      <span style={{color:'var(--text-muted)',fontSize:12}}>{item.type}</span>
                    </div>
                  </div>
                </div>
              );

              return (
                <div className="grouped-results">
                  {relativeDays.map((day, idx) => {
                    const items = groups[day] || [];
                    if (items.length === 0) return null;

                    let headerText = capitalize(day);
                    if (idx === 0) headerText = `📅 Today (${capitalize(day)})`;
                    else if (idx === 1) headerText = `📅 Yesterday (${capitalize(day)})`;
                    else headerText = `📅 ${capitalize(day)}`;

                    return (
                      <div key={day} className="day-group" style={{ marginBottom: 32 }}>
                        <h3 className="day-group-title" style={{ 
                          fontSize: 16, 
                          fontWeight: 700, 
                          color: 'var(--accent-light)', 
                          borderBottom: '1px solid rgba(255,255,255,0.06)', 
                          paddingBottom: 8, 
                          marginBottom: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          {headerText}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({items.length} releases)</span>
                        </h3>
                        <div className="results-grid">
                          {items.map((item, i) => renderCard(item, i))}
                        </div>
                      </div>
                    );
                  })}

                  {groups['other'] && groups['other'].length > 0 && (
                    <div className="day-group" style={{ marginBottom: 32 }}>
                      <h3 className="day-group-title" style={{ 
                        fontSize: 16, 
                        fontWeight: 700, 
                        color: 'var(--text-secondary)', 
                        borderBottom: '1px solid rgba(255,255,255,0.06)', 
                        paddingBottom: 8, 
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        📦 Other / Completed Releases
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({groups['other'].length} releases)</span>
                      </h3>
                      <div className="results-grid">
                        {groups['other'].map((item, i) => renderCard(item, i))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {/* Render Alphabet / Jikan Browse Mode */}
        {tab === 'browse' && (
          <>
            {browseLoading && (
              <div className="browse-loading">
                <span className="spinner large" />
                <p style={{marginTop:16}}>Loading anime from index...</p>
              </div>
            )}

            {browseError && (
              <div className="search-empty">
                <span style={{fontSize:40}}>⏳</span>
                <p style={{color:'var(--text-muted)'}}>{browseError}</p>
                <button className="btn btn-primary" style={{marginTop:16}} onClick={() => fetchBrowse(page, activeLetter, query)}>
                  Try Again
                </button>
              </div>
            )}

            {!browseLoading && !browseError && browseResults.length === 0 && (
              <div className="search-empty">
                <span style={{fontSize:40}}>🎌</span>
                <p>No results found. Try a different letter or page.</p>
                <button className="btn btn-ghost" style={{marginTop:12}} onClick={() => handleLetter(null)}>
                  Show All Anime
                </button>
              </div>
            )}

            {!browseLoading && !browseError && browseResults.length > 0 && (
              <>
                <div className="results-grid">
                  {browseResults.map((item, i) => (
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
                        {item.type && (
                          <span className="anime-card-badge">{item.type}</span>
                        )}
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
                {totalPages > 1 && !query && !genreMode && (
                  <div className="pagination">
                    <button
                      className="btn btn-ghost page-btn"
                      disabled={page <= 1 || browseLoading}
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
                      disabled={!hasNext || browseLoading}
                      onClick={() => handlePage(page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
