import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../App'

const API = 'http://localhost:8765'

export default function Library() {
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const { setPlayerModal } = useContext(AppContext)

  useEffect(() => {
    fetchLibrary()
  }, [])

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`${API}/library`)
      const data = await res.json()
      setLibrary(data)
    } catch {
      // Use mock data if backend not running
      setLibrary([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="library-page">
      <div className="page-header">
        <h1 className="page-title">Library</h1>
        <span style={{color:'var(--text-muted)',fontSize:13}}>{library.length} downloaded</span>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><span className="spinner" style={{width:36,height:36,borderWidth:3}}/></div>
      ) : library.length === 0 ? (
        <div className="empty-state">
          <span style={{fontSize:56}}>📚</span>
          <h3>Your library is empty</h3>
          <p>Downloaded episodes will appear here</p>
        </div>
      ) : (
        <div className="library-grid">
          {library.map((item) => (
            <div key={item.id} className="library-card">
              {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="library-card-img" />}
              <div className="library-card-info">
                <p className="library-title">{item.title}</p>
                <p className="library-ep" style={{color:'var(--text-muted)',fontSize:12,marginTop:2}}>{item.episode}</p>
                <p style={{color:'var(--text-muted)',fontSize:11,marginTop:4}}>{item.download_date?.slice(0,10)}</p>
                <div className="library-actions">
                  <button className="btn btn-primary" style={{fontSize:11,padding:'4px 10px'}} onClick={() => setPlayerModal({url: item.file_path, title: item.title})}>
                    ▶ Play
                  </button>
                  <button className="btn btn-secondary" style={{fontSize:11,padding:'4px 10px'}} onClick={() => window.electronAPI?.openFolder(item.file_path)}>
                    📂
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
