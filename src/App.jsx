import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Downloads from './pages/Downloads'
import Schedule from './pages/Schedule'
import Library from './pages/Library'
import Details from './pages/Details'
import Settings from './pages/Settings'
import EpisodeModal from './components/EpisodeModal'
import PlayerModal from './components/PlayerModal'
import UpdateBanner from './components/UpdateBanner'
import './styles/app.css'
import './styles/pages.css'

export const AppContext = React.createContext({})

export default function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [episodeModal, setEpisodeModal] = useState(null) // { title, url, thumbnail, source }
  const [playerModal, setPlayerModal] = useState(null)   // { url, title }
  const [downloads, setDownloads] = useState([])
  const [settings, setSettings] = useState({
    downloadFolder: '',
    quality: 'best',
    subDub: 'sub',
    notifications: true,
    theme: 'dark',
    maxConcurrent: 3,
    titleLanguage: 'english',
    anikotoDomain: 'https://anikototv.to',
    animetakeDomain: 'https://animetake.tv',
    kissanimeDomain: 'https://kissanime.com.vc',
    scheduleDomain: 'https://animeschedule.net',
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('anivault-settings')
    let currentSettings = settings
    if (savedSettings) {
      try {
        currentSettings = JSON.parse(savedSettings)
        setSettings(currentSettings)
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }

    // Sync settings domains to backend on startup
    const syncBackend = async () => {
      try {
        const API = 'http://localhost:8642'
        await Promise.all([
          fetch(`${API}/library/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'anikoto_domain', value: currentSettings.anikotoDomain || 'https://anikototv.to' })
          }),
          fetch(`${API}/library/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'animetake_domain', value: currentSettings.animetakeDomain || 'https://animetake.tv' })
          }),
          fetch(`${API}/library/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'kissanime_domain', value: currentSettings.kissanimeDomain || 'https://kissanime.com.vc' })
          }),
          fetch(`${API}/library/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'schedule_domain', value: currentSettings.scheduleDomain || 'https://animeschedule.net' })
          })
        ])
      } catch (e) {
        console.error('Failed to sync scraper domains to backend database.', e)
      }
    }
    syncBackend()

    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable(() => setUpdateAvailable(true))
      window.electronAPI.onUpdateDownloaded(() => setUpdateDownloaded(true))
    }
  }, [])

  const saveSettings = (newSettings) => {
    setSettings(newSettings)
    localStorage.setItem('anivault-settings', JSON.stringify(newSettings))
  }

  const ctx = {
    settings, saveSettings,
    episodeModal, setEpisodeModal,
    playerModal, setPlayerModal,
    downloads, setDownloads,
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-shell">
        <TitleBar />
        {(updateAvailable || updateDownloaded) && (
          <UpdateBanner
            downloaded={updateDownloaded}
            onInstall={() => window.electronAPI?.installUpdate()}
          />
        )}
        <div className="app-body">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/anime/:id" element={<Details />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        {episodeModal && <EpisodeModal />}
        {playerModal && <PlayerModal />}
      </div>
    </AppContext.Provider>
  )
}
