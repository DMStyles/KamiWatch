import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'
import EditProfileModal from '../components/EditProfileModal'
import pkg from '../../package.json'

const API = 'http://localhost:8642'

export default function Settings() {
  const { settings, saveSettings, user, setUser, setShowAuthModal, syncStatus, syncCloudData, handleSignOut } = useContext(AppContext)
  const navigate = useNavigate()
  const [local, setLocal] = useState(settings || {})
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateReady, setUpdateReady] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [newVersionTag, setNewVersionTag] = useState('')
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false) // FIX: prevent spam-clicking

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
    const folder = await window.electronAPI?.selectFolder()
    if (folder) set('downloadFolder', folder)
  }

  React.useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onCheckingForUpdate(() => {
        setUpdateStatus('Checking for updates...')
        setDownloadProgress(null)
      })
      window.electronAPI.onUpdateAvailable((_, info) => {
        setNewVersionTag(info?.version ? `v${info.version}` : '')
        setUpdateStatus(`✨ Update available! (v${info.version}) — Downloading...`)
      })
      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateStatus('✅ You are on the latest version!')
        setDownloadProgress(null)
      })
      window.electronAPI.onDownloadProgress((_, progressObj) => {
        const percent = Math.round(progressObj.percent || 0)
        setDownloadProgress(percent)
        setUpdateStatus(`📥 Downloading update... ${percent}%`)
      })
      window.electronAPI.onUpdateDownloaded((_, info) => {
        setUpdateReady(true)
        setDownloadProgress(null)
        setNewVersionTag(info?.version ? `v${info.version}` : '')
        setUpdateStatus(`🎉 Update v${info.version} ready!`)
      })
      window.electronAPI.onUpdateError((_, errMsg) => {
        setUpdateStatus(`❌ Update check failed!`)
        console.error(errMsg)
      })
    }
  }, [])

  const isNewer = (verStr) => {
    if (!verStr) return false
    const v1 = verStr.replace('v', '').split('.').map(Number)
    const v2 = pkg.version.replace('v', '').split('.').map(Number)
    for (let i = 0; i < 3; i++) {
      if ((v1[i] || 0) > (v2[i] || 0)) return true
      if ((v1[i] || 0) < (v2[i] || 0)) return false
    }
    return false
  }

  const checkUpdate = async () => {
    if (isCheckingUpdate) return // FIX: prevent spam-clicking
    setIsCheckingUpdate(true)
    setUpdateStatus('Checking for updates...')
    setDownloadProgress(null)
    try {
      const res = await window.electronAPI?.checkUpdate()
      if (res?.success && res?.version && isNewer(res.version)) {
        setNewVersionTag(`v${res.version}`)
        setUpdateStatus(`✨ Update available! (v${res.version})`)
        setIsCheckingUpdate(false)
        return
      }
    } catch {}

    // Fallback: Check GitHub Releases API directly
    try {
      const ghRes = await fetch('https://api.github.com/repos/DMStyles/KamiWatch/releases/latest')
      const ghData = await ghRes.json()
      if (ghData.tag_name) {
        const latestTag = ghData.tag_name.replace('v', '')
        if (isNewer(latestTag)) {
          setNewVersionTag(ghData.tag_name)
          setUpdateStatus(`✨ Update available! (${ghData.tag_name})`)
        } else {
          setUpdateStatus('✅ You are on the latest version!')
        }
      } else {
        setUpdateStatus('✅ You are on the latest version!')
      }
    } catch {
      setUpdateStatus('⚠️ Could not check for updates. Check internet connection.')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleInstallUpdate = () => {
    if (updateReady) {
      window.electronAPI?.installUpdate()
    } else {
      window.electronAPI?.openExternal('https://github.com/DMStyles/KamiWatch/releases/latest')
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
      </div>

      <div className="settings-sections">
        {/* Google Account & Cloud Sync */}
        <section className="settings-section">
          <h2 className="settings-section-title">Google Account & Cloud Sync</h2>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1d28', border: '2px solid #10b981' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                    ☁️ Cloud Sync Active ({syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced' : 'Ready'})
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700 }} onClick={() => setShowEditProfileModal(true)}>
                  ✏️ Edit Profile
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700 }} onClick={() => syncCloudData()}>
                  ☁️ Sync Now
                </button>
                <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, color: '#ef4444' }} onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(66, 133, 244, 0.08)', border: '1px solid rgba(66, 133, 244, 0.2)', borderRadius: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>Google Cloud Sync</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign in with Google to backup & sync history, watchlist, favorites across all your devices.</div>
              </div>
              <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #4285F4 0%, #34a853 100%)', border: 'none' }} onClick={() => setShowAuthModal(true)}>
                🌐 Connect Google Account
              </button>
            </div>
          )}
        </section>

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
                {local.downloadFolder || '~/Downloads/KamiWatch'}
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
              <p className="settings-desc">KamiWatch v{pkg.version} — Auto-updates via GitHub Releases</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {updateStatus && <span style={{fontSize:12,color: updateReady ? '#10b981' : 'var(--success)'}}>{updateStatus}</span>}
              
              {updateReady ? (
                <button
                  className="btn btn-primary"
                  style={{fontSize:12,padding:'6px 18px',background:'#10b981',borderColor:'#10b981',fontWeight:700}}
                  onClick={handleInstallUpdate}
                >
                  🚀 Restart & Install {newVersionTag}
                </button>
              ) : newVersionTag && newVersionTag !== `v${pkg.version}` ? (
                <button
                  className="btn btn-primary"
                  style={{fontSize:12,padding:'6px 18px',fontWeight:700}}
                  onClick={handleInstallUpdate}
                >
                  ⬇ Download & Install {newVersionTag}
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{fontSize:12,padding:'6px 16px', opacity: isCheckingUpdate ? 0.6 : 1}}
                  onClick={checkUpdate}
                  disabled={isCheckingUpdate}
                >
                  {isCheckingUpdate ? <><span className="spinner" style={{width:10,height:10,display:'inline-block',marginRight:6}} />Checking...</> : 'Check for Updates'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Extensions */}
        <section className="settings-section">
          <h2 className="settings-section-title">Extensions</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">Community Extensions</label>
              <p className="settings-desc">Install community-built scrapers to add new anime and manga sources.</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/extensions')}
              style={{ flexShrink: 0 }}
            >
              🧩 Manage Extensions
            </button>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>
          <div className="settings-row">
            <div>
              <label className="settings-label">KamiWatch</label>
              <p className="settings-desc">Anime downloader powered by yt-dlp · Sources: Anikoto, AnimeTake, AnimeSchedule</p>
            </div>
          </div>
        </section>

        <div style={{padding:'0 24px 32px'}}>
          <button className="btn btn-primary" style={{padding:'10px 28px'}} onClick={save}>Save Settings</button>
        </div>
      </div>

      {showEditProfileModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfileModal(false)}
          onSave={(u) => setUser(u)}
        />
      )}
    </div>
  )
}
