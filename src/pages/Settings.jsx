import React, { useState, useContext } from 'react'
import { AppContext } from '../App'
import pkg from '../../package.json'

export default function Settings() {
  const { settings, saveSettings } = useContext(AppContext)
  const [local, setLocal] = useState(settings)
  const [updateStatus, setUpdateStatus] = useState('')

  const set = (key, val) => setLocal(s => ({ ...s, [key]: val }))
  const save = async () => {
    saveSettings(local)
    setUpdateStatus('Saving settings...')
    try {
      await Promise.all([
        fetch(`${API}/library/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'anikoto_domain', value: local.anikotoDomain || 'https://anikototv.to' })
        }),
        fetch(`${API}/library/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'animetake_domain', value: local.animetakeDomain || 'https://animetake.tv' })
        }),
        fetch(`${API}/library/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'kissanime_domain', value: local.kissanimeDomain || 'https://kissanime.com.vc' })
        }),
        fetch(`${API}/library/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'schedule_domain', value: local.scheduleDomain || 'https://animeschedule.net' })
        })
      ])
      setUpdateStatus('✅ Settings saved & synced!')
    } catch (e) {
      setUpdateStatus('⚠️ Saved locally, but failed to sync backend.')
    }
    setTimeout(() => setUpdateStatus(''), 3000)
  }

  const pickFolder = async () => {
    const folder = await window.electronAPI?.selectDownloadFolder()
    if (folder) set('downloadFolder', folder)
  }

  React.useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCheckingForUpdate(() => {
        setUpdateStatus('Checking for updates...')
      })
      window.electronAPI.onUpdateAvailable((_, info) => {
        setUpdateStatus(`✨ Update available! (v${info.version})`)
      })
      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateStatus('✅ You are on the latest version!')
      })
      window.electronAPI.onUpdateError((_, errMsg) => {
        setUpdateStatus(`❌ Update check failed!`)
        console.error(errMsg)
      })
    }
  }, [])

  const checkUpdate = () => {
    setUpdateStatus('Checking for updates...')
    window.electronAPI?.checkUpdate()
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
      </div>

      <div className="settings-sections">
        {/* Downloads */}
        <section className="settings-section">
          <h2 className="settings-section-title">Downloads</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">Download Folder</label>
              <p className="settings-desc">Where episodes are saved on your PC</p>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:12,color:'var(--text-muted)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {local.downloadFolder || '~/Downloads/AniVault'}
              </span>
              <button className="btn btn-secondary" style={{padding:'6px 14px',fontSize:12}} onClick={pickFolder}>Browse</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">Default Quality</label>
              <p className="settings-desc">Video resolution to download</p>
            </div>
            <select className="settings-select" value={local.quality} onChange={e => set('quality', e.target.value)}>
              <option value="best">Best Available</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">Max Concurrent Downloads</label>
              <p className="settings-desc">How many episodes download at once</p>
            </div>
            <select className="settings-select" value={local.maxConcurrent} onChange={e => set('maxConcurrent', Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </section>

        {/* Playback & Interface */}
        <section className="settings-section">
          <h2 className="settings-section-title">Playback & Interface</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">Anime Title Language</label>
              <p className="settings-desc">Show English titles or Japanese (Romaji) titles</p>
            </div>
            <div className="toggle-group">
              {[
                { value: 'english', label: 'English' },
                { value: 'romaji', label: 'Romaji' }
              ].map(v => (
                <button 
                  key={v.value} 
                  className={`toggle-btn${local.titleLanguage===v.value?' active':''}`} 
                  onClick={() => set('titleLanguage', v.value)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">Default Audio/Subtitle</label>
              <p className="settings-desc">Prefer sub or dub when available</p>
            </div>
            <div className="toggle-group">
              {['sub','dub'].map(v => (
                <button key={v} className={`toggle-btn${local.subDub===v?' active':''}`} onClick={() => set('subDub', v)}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Source Domains */}
        <section className="settings-section">
          <h2 className="settings-section-title">Source Domains</h2>
          <p className="settings-section-desc" style={{padding:'0 24px', fontSize:12, color:'var(--text-muted)', marginBottom:12}}>
            Configure customized streaming and metadata domains. If a website changes its domain, you can update it here.
          </p>
          <div className="settings-row">
            <div>
              <label className="settings-label">AniKoto Domain</label>
              <p className="settings-desc">Base URL for search and episode scraping</p>
            </div>
            <input 
              type="text" 
              className="settings-input-text" 
              style={{
                background:'rgba(255,255,255,0.05)',
                border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',
                padding:'6px 12px',
                color:'var(--text-primary)',
                width:'280px',
                fontSize:13
              }}
              value={local.anikotoDomain || ''} 
              onChange={e => set('anikotoDomain', e.target.value)} 
            />
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">AnimeTake Domain</label>
              <p className="settings-desc">Base URL for AnimeTake scraper</p>
            </div>
            <input 
              type="text" 
              className="settings-input-text" 
              style={{
                background:'rgba(255,255,255,0.05)',
                border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',
                padding:'6px 12px',
                color:'var(--text-primary)',
                width:'280px',
                fontSize:13
              }}
              value={local.animetakeDomain || ''} 
              onChange={e => set('animetakeDomain', e.target.value)} 
            />
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">KissAnime Domain</label>
              <p className="settings-desc">Base URL for KissAnime scraper</p>
            </div>
            <input 
              type="text" 
              className="settings-input-text" 
              style={{
                background:'rgba(255,255,255,0.05)',
                border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',
                padding:'6px 12px',
                color:'var(--text-primary)',
                width:'280px',
                fontSize:13
              }}
              value={local.kissanimeDomain || ''} 
              onChange={e => set('kissanimeDomain', e.target.value)} 
            />
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">AnimeSchedule Domain</label>
              <p className="settings-desc">Base URL for schedule API</p>
            </div>
            <input 
              type="text" 
              className="settings-input-text" 
              style={{
                background:'rgba(255,255,255,0.05)',
                border:'1px solid var(--border)',
                borderRadius:'var(--radius-sm)',
                padding:'6px 12px',
                color:'var(--text-primary)',
                width:'280px',
                fontSize:13
              }}
              value={local.scheduleDomain || ''} 
              onChange={e => set('scheduleDomain', e.target.value)} 
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-section">
          <h2 className="settings-section-title">Notifications</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">Episode Notifications</label>
              <p className="settings-desc">Get notified when followed anime gets new episodes</p>
            </div>
            <button
              className={`toggle-switch${local.notifications?' on':''}`}
              onClick={() => set('notifications', !local.notifications)}
            />
          </div>
        </section>

        {/* App Updates */}
        <section className="settings-section">
          <h2 className="settings-section-title">Updates</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">App Version</label>
              <p className="settings-desc">AniVault v{pkg.version} — Auto-updates via GitHub Releases</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {updateStatus && <span style={{fontSize:12,color:'var(--success)'}}>{updateStatus}</span>}
              <button className="btn btn-secondary" style={{fontSize:12,padding:'6px 16px'}} onClick={checkUpdate}>
                Check for Updates
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">AniVault</label>
              <p className="settings-desc">Anime downloader powered by yt-dlp · Sources: Anikoto, AnimeTake, AnimeSchedule</p>
            </div>
          </div>
        </section>

        <div style={{padding:'0 24px 32px'}}>
          <button className="btn btn-primary" style={{padding:'10px 28px'}} onClick={save}>Save Settings</button>
        </div>
      </div>
    </div>
  )
}
