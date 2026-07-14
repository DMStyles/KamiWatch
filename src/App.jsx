import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Downloads from './pages/Downloads'
import Schedule from './pages/Schedule'
import Library from './pages/Library'
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
  })

  useEffect(() => {
    const savedSettings = localStorage.getItem('anivault-settings')
    if (savedSettings) setSettings(JSON.parse(savedSettings))

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
