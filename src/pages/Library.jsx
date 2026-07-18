import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'

export default function Library() {
  const [activeTab, setActiveTab] = useState('watchlist') // 'watchlist' or 'downloads'
  const [watchlistFilter, setWatchlistFilter] = useState('all') // 'all', 'watching', 'plan', 'completed', 'favorite'
  const [watchlist, setWatchlist] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const { setPlayerModal } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLibrary()
    loadWatchlist()
  }, [])

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`${API}/library`)
      const data = await res.json()
      setLibrary(data)
    } catch {
      setLibrary([])
    } finally {
      setLoading(false)
    }
  }

  const loadWatchlist = () => {
    try {
      const savedList = JSON.parse(localStorage.getItem('anivault-watchlist') || '{}')
      setWatchlist(Object.values(savedList))
    } catch {
      setWatchlist([])
    }
  }

  const handleRemoveFromWatchlist = (title, e) => {
    e.stopPropagation()
    try {
      const savedList = JSON.parse(localStorage.getItem('anivault-watchlist') || '{}')
      delete savedList[title]
      localStorage.setItem('anivault-watchlist', JSON.stringify(savedList))
      setWatchlist(Object.values(savedList))
    } catch {}
  }

  // Filter watchlist items based on active sub-filter
  const filteredWatchlist = watchlist.filter(item => {
    if (watchlistFilter === 'all') return true
    return item.status === watchlistFilter
  })

  return (
    <div className="library-page" style={{ padding: '24px 28px' }}>
      
      {/* Tab Switcher Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('watchlist')}
          style={{
            background: 'transparent',
            color: activeTab === 'watchlist' ? 'var(--accent-light)' : 'var(--text-secondary)',
            fontSize: 20,
            fontWeight: 800,
            cursor: 'pointer',
            paddingBottom: 6,
            borderBottom: activeTab === 'watchlist' ? '3px solid var(--accent-light)' : '3px solid transparent',
            transition: 'all var(--transition)'
          }}
        >
          🗂️ My Watchlists
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          style={{
            background: 'transparent',
            color: activeTab === 'downloads' ? 'var(--accent-light)' : 'var(--text-secondary)',
            fontSize: 20,
            fontWeight: 800,
            cursor: 'pointer',
            paddingBottom: 6,
            borderBottom: activeTab === 'downloads' ? '3px solid var(--accent-light)' : '3px solid transparent',
            transition: 'all var(--transition)'
          }}
        >
          📥 Local Downloads
        </button>
      </div>

      {/* Render Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <div>
          {/* Sub-Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'All Shows' },
              { id: 'watching', label: '👀 Watching' },
              { id: 'plan', label: '📅 Plan to Watch' },
              { id: 'completed', label: '✅ Completed' },
              { id: 'favorite', label: '💖 Favorites' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setWatchlistFilter(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: watchlistFilter === f.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.04)',
                  color: watchlistFilter === f.id ? 'var(--accent-light)' : 'var(--text-secondary)',
                  borderColor: watchlistFilter === f.id ? 'var(--accent)' : 'var(--border)',
                  transition: 'all var(--transition)'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredWatchlist.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>📋</span>
              <h3 style={{ marginTop: 12, color: 'var(--text-secondary)' }}>This list is empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Add anime from their details page to keep track here.</p>
            </div>
          ) : (
            <div className="library-grid">
              {filteredWatchlist.map((item, i) => (
                <div
                  key={i}
                  className="library-card"
                  onClick={() => navigate(item.id && item.id !== 0 && item.id !== '0' ? `/anime/${item.id}` : '/anime/0', { state: { searchQuery: item.title } })}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="library-card-img"
                    onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'}
                  />
                  <div className="library-card-info" style={{ position: 'relative' }}>
                    <p className="library-title" style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: 8 }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: 10,
                          background:
                            item.status === 'watching' ? 'rgba(6,182,212,0.15)' :
                            item.status === 'plan' ? 'rgba(245,158,11,0.15)' :
                            item.status === 'completed' ? 'rgba(16,185,129,0.15)' :
                            'rgba(239,68,68,0.15)',
                          color:
                            item.status === 'watching' ? 'var(--cyan)' :
                            item.status === 'plan' ? 'var(--warning)' :
                            item.status === 'completed' ? 'var(--success)' :
                            '#f43f5e'
                        }}
                      >
                        {item.status.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => handleRemoveFromWatchlist(item.title, e)}
                        style={{
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                          border: 'none'
                        }}
                        onMouseEnter={e => e.target.style.color = 'var(--error)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Downloads Tab */}
      {activeTab === 'downloads' && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
          ) : library.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 56 }}>📥</span>
              <h3 style={{ marginTop: 12, color: 'var(--text-secondary)' }}>No downloads found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Downloaded episodes will show up here.</p>
            </div>
          ) : (
            <div className="library-grid">
              {library.map((item) => (
                <div key={item.id} className="library-card">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="library-card-img"
                    onError={e => e.target.src = 'https://via.placeholder.com/200x280?text=No+Image'}
                  />
                  <div className="library-card-info">
                    <p className="library-title" style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</p>
                    <p className="library-ep" style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 }}>{item.episode}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>{item.download_date?.slice(0, 10)}</p>
                    <div className="library-actions" style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 11, padding: '4px 10px', flex: 1 }}
                        onClick={() => setPlayerModal({ url: `${API}/library/stream?path=${encodeURIComponent(item.file_path)}`, title: `${item.title} - ${item.episode}` })}
                      >
                        ▶ Play
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => window.electronAPI?.openFolder(item.file_path)}
                      >
                        📂
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
