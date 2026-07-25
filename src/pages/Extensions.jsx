import React, { useState, useEffect, useRef } from 'react'

const MOCK_MARKETPLACE_PLUGINS = [
  { id: 'aiostreams', name: 'AIOStreams', author: 'Viren07', lang: 'Javascript', description: 'Stream content from AIOStreams directly in KamiWatch. Supports all streams with URLs.', installed: true, icon: '⚡', type: 'anime' },
  { id: 'alt-titles', name: 'Alternative Titles', author: 'nnotwen', lang: 'Typescript', description: 'Choose how anime and manga titles are displayed in their respective pages.', installed: false, icon: '🔤', type: 'anime' },
  { id: 'anilist-disc', name: 'AniList Discussions', author: 'Bas1874', lang: 'Typescript', description: 'Read/Post AniList discussions inside KamiWatch.', installed: false, icon: '💬', type: 'anime' },
  { id: 'anilist-notif', name: 'AniList Notifications', author: 'Pal', lang: 'Typescript', description: 'View your AniList notifications in real time.', installed: true, icon: '🔔', type: 'anime' },
  { id: 'anilist-pause', name: 'AniList Autopause', author: 'nnotwen', lang: 'Typescript', description: 'Automatically pause your AniList entries when you stop watching for a set time.', installed: false, icon: '⏸️', type: 'anime' },
  { id: 'anilist-favs', name: 'AniList Favorites', author: 'nnotwen', lang: 'Typescript', description: 'Add functionality to favorite anime/manga in AniList inside KamiWatch.', installed: false, icon: '❤️', type: 'anime' },
  { id: 'anilist-order', name: 'AniList Watch Order', author: 'nnotwen', lang: 'Typescript', description: 'Get the AniList-recommended watch order within the anime page.', installed: false, icon: '🔢', type: 'anime' },
  { id: 'anime-news', name: 'Anime News', author: 'SyntaxSama & Pal', lang: 'Typescript', description: 'Get anime news in your KamiWatch instance!', installed: false, icon: '📰', type: 'anime' },
]

export default function Extensions() {
  const [activeTab, setActiveTab] = useState('Marketplace') // 'Installed' | 'Marketplace'
  const [selectedType, setSelectedType] = useState('All Types')
  const [extensions, setExtensions] = useState([])
  const [marketplacePlugins, setMarketplacePlugins] = useState(MOCK_MARKETPLACE_PLUGINS)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [installUrl, setInstallUrl] = useState('')
  const [installCode, setInstallCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    loadExtensions()
  }, [])

  const loadExtensions = async () => {
    setLoading(true)
    try {
      const list = await window.electronAPI?.extensions?.list() || []
      setExtensions(list)
    } catch (e) {
      setExtensions([])
    } finally {
      setLoading(false)
    }
  }

  const toggleMarketplaceInstall = (id) => {
    setMarketplacePlugins(prev => prev.map(p => p.id === id ? { ...p, installed: !p.installed } : p))
  }

  const handleInstallUrl = async () => {
    if (!installUrl.trim()) { setError('Please enter a URL'); return }
    setInstalling(true)
    setError('')
    setSuccess('')
    try {
      const result = await window.electronAPI?.extensions?.install({ url: installUrl.trim() })
      if (result?.success) {
        setSuccess(`✅ Extension "${result.manifest.name}" installed successfully!`)
        setInstallUrl('')
        await loadExtensions()
      } else {
        setError(result?.error || 'Failed to install extension')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 32px 60px' }}>
      
      {/* ── Seanime Marketplace Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Marketplace</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Browse and install extension plugins from the official repository.
          </p>
        </div>

        {/* Installed / Marketplace Pill Switcher */}
        <div style={{
          display: 'flex', background: 'rgba(15, 15, 23, 0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: 3, gap: 2
        }}>
          <button
            onClick={() => setActiveTab('Installed')}
            style={{
              padding: '6px 18px', borderRadius: 999, border: 'none',
              background: activeTab === 'Installed' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'Installed' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Installed
          </button>
          <button
            onClick={() => setActiveTab('Marketplace')}
            style={{
              padding: '6px 18px', borderRadius: 999, border: 'none',
              background: activeTab === 'Marketplace' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'Marketplace' ? '#fff' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            ★ Marketplace
          </button>
        </div>
      </div>

      {/* Official Notice Banner */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center'
      }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span style={{ fontSize: 12.5, color: '#fbbf24', fontWeight: 600 }}>
          Official Extension Marketplace — All extension packages are validated for security, privacy, and fast scraping.
        </span>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        {['All Types', 'Plugins', 'Anime Torrents', 'Manga', 'Online Streaming', 'Custom Sources'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            style={{
              padding: '6px 16px', borderRadius: 99, border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: selectedType === type ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: selectedType === type ? '#fff' : 'var(--text-secondary)'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Extensions Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16, marginBottom: 40
      }}>
        {marketplacePlugins
          .filter(p => activeTab === 'Marketplace' || p.installed)
          .map(plugin => (
            <div
              key={plugin.id}
              style={{
                background: 'rgba(15, 15, 23, 0.75)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                backdropFilter: 'blur(12px)', transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      width: 38, height: 38, borderRadius: 10, background: 'rgba(124, 58, 237, 0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                    }}>
                      {plugin.icon}
                    </span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{plugin.name}</h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{plugin.author}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleMarketplaceInstall(plugin.id)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: 'none',
                      background: plugin.installed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                      color: plugin.installed ? '#10b981' : '#fff', cursor: 'pointer',
                      fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title={plugin.installed ? 'Installed' : 'Install'}
                  >
                    {plugin.installed ? '✓' : '📥'}
                  </button>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                  {plugin.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {plugin.lang}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Install custom URL or file section */}
      <div style={{
        background: 'rgba(15, 15, 23, 0.75)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 20
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Install Custom Extension URL</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={installUrl}
            onChange={e => setInstallUrl(e.target.value)}
            placeholder="https://raw.githubusercontent.com/user/repo/main/extension.js"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none'
            }}
          />
          <button className="btn btn-primary" onClick={handleInstallUrl} disabled={installing}>
            {installing ? 'Installing...' : '⬇ Install URL'}
          </button>
        </div>
      </div>
    </div>
  )
}
