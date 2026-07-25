import React, { useState, useEffect, useRef } from 'react'

const OFFICIAL_PLUGINS = [
  // ── Online Streaming Providers ──
  { id: '4anime', name: '4Anime.gg', author: 'KoDevV2', lang: 'English', description: '4anime.gg as an online streaming provider with fast HD embeds.', installed: true, icon: '4️⃣', category: 'Online Streaming' },
  { id: 'agefans', name: 'AgeFans', author: 'Pal', lang: '中文', description: 'AgeFans is an online streaming provider for Chinese subbed anime.', installed: false, icon: '🔮', category: 'Online Streaming' },
  { id: 'anidao', name: 'AniDao', author: 'Pal', lang: 'English', description: 'AniDao is an online streaming provider for anime series & movies.', installed: false, icon: '🅰️', category: 'Online Streaming' },
  { id: 'aniwatch', name: 'AniWatch', author: 'Thekingcrusher', lang: 'English', description: 'AniWatch is an online stream provider with multi-quality options.', installed: true, icon: '🍿', category: 'Online Streaming' },
  { id: 'anizone', name: 'AniZone', author: 'jabifx', lang: 'English', description: 'Online streaming provider with soft subs and high bitrate audio.', installed: false, icon: '🅰️', category: 'Online Streaming' },
  { id: 'anikoto-ext', name: 'Anikoto', author: 'aquaryuo', lang: 'English', description: 'Only anikoto compatibility layer you\'ll ever need for multi-server playback.', installed: true, icon: '⚡', category: 'Online Streaming' },
  { id: 'animeav1', name: 'AnimeAV1', author: 'jabifx', lang: 'Español', description: 'Online streaming provider with hard subs and AV1 codec encoding.', installed: false, icon: '📐', category: 'Online Streaming' },
  { id: 'animegg', name: 'AnimeGG', author: 'Pal', lang: 'English', description: 'AnimeGG is an online streaming provider for ongoing releases.', installed: false, icon: '🍊', category: 'Online Streaming' },
  { id: 'animeheaven', name: 'AnimeHeaven', author: 'Pal', lang: 'English', description: 'AnimeHeaven is an online streaming provider with instant player mirrors.', installed: true, icon: '🅰️', category: 'Online Streaming' },
  { id: 'animesalt', name: 'AnimeSalt', author: 'mohaisreal', lang: 'English', description: 'AnimeSalt is an online streaming provider for sub & dub anime.', installed: false, icon: '🧂', category: 'Online Streaming' },
  { id: 'animesaturn', name: 'AnimeSaturn', author: 'kRYstall9', lang: 'Italiano', description: 'AnimeSaturn is an online streaming provider for Italian subbed anime.', installed: false, icon: '🪐', category: 'Online Streaming' },
  { id: 'animesaturn-mirror', name: 'AnimeSaturn (Mirror)', author: 'Pal', lang: 'Italiano', description: 'AnimeSaturn mirror provider.', installed: false, icon: '🪐', category: 'Online Streaming' },

  // ── Manga Providers ──
  { id: '3asq', name: '3asq', author: 'Bruuhim', lang: 'العربية', description: 'Manga provider for 3asq.org.', installed: true, icon: '📖', category: 'Manga' },
  { id: 'animesama-manga', name: 'AnimeSama (Manga)', author: 'pal', lang: 'Français', description: 'AnimeSama is a manga provider for KamiWatch.', installed: false, icon: '⛩️', category: 'Manga' },
  { id: 'asurascans', name: 'AsuraScans', author: 'Pal', lang: 'English', description: 'AsuraScans is a top manga & manhwa provider with fast releases.', installed: true, icon: '🥷', category: 'Manga' },
  { id: 'atsumaru', name: 'Atsumaru', author: 'Pal', lang: 'English', description: 'Atsumaru is a manga provider for KamiWatch.', installed: false, icon: '🅰️', category: 'Manga' },
  { id: 'azoramoon', name: 'AzoraMoon', author: 'Bruuhim', lang: 'العربية', description: 'Manga provider for azoramoon.com (Arabic).', installed: false, icon: '🌙', category: 'Manga' },
  { id: 'capibaratraductor', name: 'CapibaraTraductor', author: 'mohaisreal', lang: 'Español', description: 'El Hub de tus Scans Favoritos. Proveedor de manga en español.', installed: false, icon: '🦫', category: 'Manga' },
  { id: 'comix', name: 'Comix', author: 'Pal & Ari-03', lang: 'English', description: 'Comix is a fast manga provider for KamiWatch.', installed: true, icon: '✖️', category: 'Manga' },
  { id: 'demonic-scans', name: 'Demonic Scans', author: 'Faddix', lang: 'English', description: 'Integrates Demonic Scans as a manga provider.', installed: false, icon: '👿', category: 'Manga' },
  { id: 'mangadex', name: 'MangaDex', author: 'Official', lang: 'English', description: 'Official global MangaDex API provider with multi-language chapters.', installed: true, icon: '📚', category: 'Manga' },

  // ── Plugins ──
  { id: 'aiostreams-plugin', name: 'AIOStreams', author: 'Viren070', lang: 'Javascript', description: 'Stream content from AIOStreams directly in KamiWatch. Supports all streams with URLs.', installed: true, icon: '⚡', category: 'Plugins' },
  { id: 'alternative-titles', name: 'Alternative Titles', author: 'nnotwen', lang: 'Typescript', description: 'Choose how anime and manga titles are displayed in their respective pages.', installed: false, icon: '🔤', category: 'Plugins' },
  { id: 'anilist-discussions', name: 'AniList Discussions', author: 'Bas1874', lang: 'Typescript', description: 'Read/Post AniList discussions inside KamiWatch.', installed: false, icon: '💬', category: 'Plugins' },
  { id: 'anilist-discussions-player', name: 'AniList Discussions (Integrated Player)', author: 'Bas1874', lang: 'Typescript', description: 'Read AniList discussions inside KamiWatch\'s built-in video player.', installed: false, icon: '💬', category: 'Plugins' },
  { id: 'anilist-notifications', name: 'AniList Notifications', author: 'Pal', lang: 'Typescript', description: 'View your AniList notifications in real time.', installed: true, icon: '🔔', category: 'Plugins' },
  { id: 'anilist-autopause', name: 'AniList Autopause', author: 'nnotwen', lang: 'English', subLang: 'Typescript', description: 'Automatically pause your AniList entries when you stop watching for a set time.', installed: false, icon: '⏸️', category: 'Plugins' },
  { id: 'anilist-favorites', name: 'AniList Favorites', author: 'nnotwen', lang: 'English', subLang: 'Typescript', description: 'Add functionality to favorite anime/manga in AniList inside KamiWatch.', installed: false, icon: '❤️', category: 'Plugins' },
  { id: 'anilist-forums', name: 'AniList Forums', author: 'nnotwen', lang: 'English', subLang: 'Typescript', description: 'Instant access to AniList forum threads inside KamiWatch.', installed: false, icon: '💬', category: 'Plugins' },
  { id: 'anilist-private', name: 'AniList Private', author: 'nnotwen', lang: 'English', subLang: 'Typescript', description: 'Add functionality to private anime in AniList inside KamiWatch.', installed: false, icon: '👁️‍🗨️', category: 'Plugins' },
  { id: 'anilist-watch-order', name: 'AniList Watch Order', author: 'nnotwen', lang: 'English', subLang: 'Typescript', description: 'Get the AniList-recommended watch order within the anime\'s page.', installed: false, icon: '🔢', category: 'Plugins' },
  { id: 'anilist-activity', name: 'AniList activity', author: 'Pal', lang: 'Typescript', description: 'A plugin for viewing your friend\'s and your AniList activities inside KamiWatch.', installed: false, icon: '📊', category: 'Plugins' },
  { id: 'anime-news', name: 'Anime News', author: 'SyntaxSama & Pal', lang: 'English', subLang: 'Typescript', description: 'Get anime news in your KamiWatch instance!', installed: false, icon: '📰', category: 'Plugins' },
  { id: 'anime-notes', name: 'Anime Notes', author: 'Faddix, Bas1874', lang: 'Typescript', description: 'Add personal notes to anime.', installed: false, icon: '📝', category: 'Plugins' },
  { id: 'animethemes', name: 'AnimeThemes Player', author: 'jabifx', lang: 'Typescript', description: 'Displays an anime\'s openings and endings (using animethemes.moe) directly on its page.', installed: false, icon: '🎵', category: 'Plugins' },
  { id: 'asunatracks-sync', name: 'AsunaTracks Sync', author: 'Kolex06', lang: 'English', subLang: 'Typescript', description: 'Live-sync KamiWatch/AniList anime and manga progress to AsunaTracks.', installed: true, icon: '🔄', category: 'Plugins' },
  { id: 'banner-remover', name: 'Banner Remover', author: 'bas1874', lang: 'Typescript', description: 'A plugin to hide banner images on various pages.', installed: false, icon: '🚫', category: 'Plugins' },
]

export default function Extensions() {
  const [activeTab, setActiveTab] = useState('Marketplace') // 'Installed' | 'Marketplace'
  const [selectedCategory, setSelectedCategory] = useState('All Types')
  const [selectedLang, setSelectedLang] = useState('All Languages')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRepoModal, setShowRepoModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [repoSuccess, setRepoSuccess] = useState('')

  const [installedIds, setInstalledIds] = useState(() => {
    try {
      const saved = localStorage.getItem('kamiwatch-installed-plugins')
      return saved ? JSON.parse(saved) : ['aiostreams-plugin', 'anilist-notifications', 'asunatracks-sync']
    } catch {
      return ['aiostreams-plugin', 'anilist-notifications', 'asunatracks-sync']
    }
  })

  const toggleInstall = (id) => {
    setInstalledIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try {
        localStorage.setItem('kamiwatch-installed-plugins', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleAddRepo = () => {
    if (!repoUrl.trim()) return
    setRepoSuccess(`Repository "${repoUrl.trim()}" added successfully!`)
    setRepoUrl('')
    setTimeout(() => {
      setRepoSuccess('')
      setShowRepoModal(false)
    }, 2000)
  }

  const categories = ['All Types', 'Plugins', 'Anime Torrents', 'Manga', 'Online Streaming', 'Custom Sources']
  const languages = ['All Languages', 'English', 'Typescript', 'Javascript']

  const filteredPlugins = OFFICIAL_PLUGINS.filter(p => {
    const isInst = installedIds.includes(p.id)
    if (activeTab === 'Installed' && !isInst) return false
    if (selectedCategory !== 'All Types' && p.category !== selectedCategory) return false
    if (selectedLang !== 'All Languages' && p.lang !== selectedLang && p.subLang !== selectedLang) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 32px 60px', color: 'var(--text-main)' }}>
      
      {/* ── Seanime Repository Warning Header Banner ── */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 18, color: '#fbbf24' }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>No content providers available</div>
            <div style={{ fontSize: 12, color: 'rgba(251, 191, 36, 0.8)', marginTop: 2 }}>
              The Seanime default marketplace no longer indexes content providers. Find a new repository URL online and add it.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowRepoModal(true)}
          style={{
            padding: '6px 14px', borderRadius: 8, background: '#4f46e5',
            color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(79, 70, 229, 0.4)'
          }}
        >
          Add new repository
        </button>
      </div>

      {/* ── Top Bar with Tab Pills ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Marketplace</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>Browse and install extensions from the official repository.</p>
        </div>

        <div className="mode-switcher-pill">
          <button
            className={`mode-switcher-btn${activeTab === 'Installed' ? ' active' : ''}`}
            onClick={() => setActiveTab('Installed')}
          >
            Installed
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

      {/* ── Plugin Category Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🧩</span>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Plugins</h2>
      </div>

      {/* ── 4-Column Seanime Plugins Grid ── */}
      {filteredPlugins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🧩</div>
          <p style={{ fontSize: 14 }}>No extensions found matching current filter criteria.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {filteredPlugins.map(p => {
            const isInstalled = installedIds.includes(p.id)
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column',
                  justify: 'space-between', minHeight: 180, position: 'relative',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{
                        width: 40, height: 40, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                      }}>
                        {p.icon}
                      </span>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{p.name}</h3>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.id}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleInstall(p.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: isInstalled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                        color: isInstalled ? '#10b981' : '#fff', cursor: 'pointer',
                        fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title={isInstalled ? 'Installed' : 'Install'}
                    >
                      {isInstalled ? '✓' : '📥'}
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                    {p.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {p.author}
                  </span>
                  {p.lang && (
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {p.lang}
                    </span>
                  )}
                  {p.subLang && (
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {p.subLang}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Repository Modal ── */}
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
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Add Extension Repository</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              Enter a direct link to an online extension repository JSON feed.
            </p>

            {repoSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: 12.5, marginBottom: 14 }}>
                {repoSuccess}
              </div>
            )}

            <input
              type="text"
              placeholder="https://raw.githubusercontent.com/user/repo/main/plugins.json"
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
                onClick={handleAddRepo}
                style={{
                  padding: '8px 20px', borderRadius: 8, background: '#4f46e5',
                  border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Add Repository
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
