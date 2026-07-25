import React, { useState, useEffect } from 'react'

export default function Extensions() {
  const [activeTab, setActiveTab] = useState('Marketplace') // 'Installed' | 'Marketplace'
  const [selectedCategory, setSelectedCategory] = useState('All Types')
  const [selectedLang, setSelectedLang] = useState('All Languages')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedExtensions, setLoadedExtensions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoSuccess, setRepoSuccess] = useState('')

  useEffect(() => {
    fetchLoadedExtensions()
  }, [])

  const fetchLoadedExtensions = async () => {
    setLoading(true)
    try {
      const list = await window.electronAPI?.extensions?.list() || []
      setLoadedExtensions(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallUrl = async (urlStr) => {
    const targetUrl = urlStr || repoUrl
    if (!targetUrl.trim()) return
    try {
      const res = await window.electronAPI?.extensions?.install({ url: targetUrl.trim() })
      if (res?.success) {
        setRepoSuccess(`✅ Extension "${res.manifest?.name || 'Plugin'}" loaded & active!`)
        fetchLoadedExtensions()
        setTimeout(() => { setRepoSuccess(''); setShowRepoModal(false) }, 2000)
      } else {
        setRepoSuccess(`❌ ${res?.error || 'Failed to load extension'}`)
      }
    } catch (e) {
      setRepoSuccess(`❌ ${e.message}`)
    }
  }

  const handleRemove = async (id) => {
    try {
      await window.electronAPI?.extensions?.remove(id)
      fetchLoadedExtensions()
    } catch {}
  }

  const categories = ['All Types', 'Plugins', 'Anime Torrents', 'Manga', 'Online Streaming', 'Custom Sources']
  const languages = ['All Languages', 'English', 'Typescript', 'Javascript', 'العربية', 'Français', 'Español', 'Italiano', '中文']

  // Format type name for UI
  const formatCategory = (typeStr) => {
    if (!typeStr) return 'Plugins'
    if (typeStr.includes('onlinestream')) return 'Online Streaming'
    if (typeStr.includes('manga')) return 'Manga'
    if (typeStr.includes('torrent')) return 'Anime Torrents'
    return 'Plugins'
  }

  const filteredExtensions = loadedExtensions.filter(item => {
    const m = item.manifest || {}
    const cat = formatCategory(m.type)
    
    if (selectedCategory !== 'All Types' && cat !== selectedCategory) return false
    if (selectedLang !== 'All Languages' && m.lang !== selectedLang && m.language !== selectedLang) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = (m.name || '').toLowerCase().includes(q)
      const matchDesc = (m.description || '').toLowerCase().includes(q)
      const matchId = (m.id || '').toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchId) return false
    }
    return true
  })

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 32px 60px', color: 'var(--text-main)' }}>
      
      {/* ── Seanime Extension Engine Header Banner ── */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#10b981' }}>
              Seanime Extension Engine Active ({loadedExtensions.length} Plugins Live)
            </div>
            <div style={{ fontSize: 12, color: 'rgba(16, 185, 129, 0.85)', marginTop: 2 }}>
              KamiWatch automatically detected and loaded all Seanime JS/TS extension providers on your PC.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchLoadedExtensions}
            style={{
              padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            🔄 Reload Plugins
          </button>
          <button
            onClick={() => setShowRepoModal(true)}
            style={{
              padding: '6px 16px', borderRadius: 8, background: '#4f46e5',
              color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.4)'
            }}
          >
            ➕ Add Extension URL
          </button>
        </div>
      </div>

      {/* ── Top Bar with Tab Pills ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Marketplace & Extensions</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Manage and run Seanime extension provider plugins natively inside KamiWatch.
          </p>
        </div>

        <div className="mode-switcher-pill">
          <button
            className={`mode-switcher-btn${activeTab === 'Installed' ? ' active' : ''}`}
            onClick={() => setActiveTab('Installed')}
          >
            Installed ({loadedExtensions.length})
          </button>
          <button
            className={`mode-switcher-btn${activeTab === 'Marketplace' ? ' active' : ''}`}
            onClick={() => setActiveTab('Marketplace')}
          >
            ★ Marketplace
          </button>
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 16px', borderRadius: 99, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedCategory === cat ? 'var(--accent-purple)' : 'rgba(255,255,255,0.06)',
              color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
              boxShadow: selectedCategory === cat ? '0 0 12px var(--accent-glow)' : 'none'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Search & Language Filter Controls ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <select
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)', padding: '8px 14px', borderRadius: 10, fontSize: 12,
            outline: 'none', cursor: 'pointer'
          }}
        >
          {languages.map(l => <option key={l} value={l} style={{ background: '#0e0e16' }}>{l}</option>)}
        </select>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search extensions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)', padding: '8px 14px', borderRadius: 10, fontSize: 12,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── 4-Column Live Seanime Plugins Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <span className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Scanning and initializing Seanime JS extensions...</p>
        </div>
      ) : filteredExtensions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🧩</div>
          <p style={{ fontSize: 14 }}>No extensions found matching criteria.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {filteredExtensions.map(item => {
            const m = item.manifest || {}
            const cat = formatCategory(m.type)
            return (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', minHeight: 180, position: 'relative',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {m.icon ? (
                        <img
                          src={m.icon}
                          alt={m.name}
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
                          onError={e => e.target.style.display = 'none'}
                        />
                      ) : (
                        <span style={{
                          width: 40, height: 40, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                        }}>
                          🧩
                        </span>
                      )}
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{m.name}</h3>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.id} · v{m.version}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(m.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981', cursor: 'pointer',
                        fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Loaded & Active (Click to unload)"
                    >
                      ✓
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                    {m.description || 'Seanime provider plugin.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {m.author || 'Community'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {cat}
                    </span>
                  </div>

                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    ● LIVE
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Extension Modal ── */}
      {showRepoModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 480, background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Add Custom Seanime Extension URL</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Enter a direct link to an extension JSON manifest file (e.g. GitHub raw URL).
            </p>

            {repoSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: repoSuccess.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: repoSuccess.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: 12.5, marginBottom: 14 }}>
                {repoSuccess}
              </div>
            )}

            <input
              type="text"
              placeholder="https://raw.githubusercontent.com/aquaryuo/seanime/main/extensions/anikoto.json"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 12, outline: 'none', marginBottom: 20
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowRepoModal(false)}
                style={{
                  padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                  border: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleInstallUrl(repoUrl)}
                style={{
                  padding: '8px 20px', borderRadius: 8, background: '#4f46e5',
                  border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Load Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
