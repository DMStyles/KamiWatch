import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const convertToLocalTime = (timeStr) => {
  if (!timeStr || timeStr === 'Time TBA' || timeStr === 'NOW') return timeStr
  try {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return timeStr
    let [_, hours, minutes, ampm] = match
    hours = parseInt(hours, 10)
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0

    const now = new Date()
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, parseInt(minutes, 10)))
    return utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch (e) {
    return timeStr
  }
}

export default function Schedule() {
  const { settings } = useContext(AppContext)
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])
  const [week, setWeek] = useState(0)

  useEffect(() => {
    fetchSchedule()
  }, [week])

  const fetchSchedule = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/schedule/timetables?weeksAfter=${week}`)
      const data = await res.json()
      setSchedule(data)
      setLoading(false)

      // After rendering, resolve any missing English titles in background
      const uncached = []
      Object.values(data).forEach(dayShows => {
        dayShows.forEach(show => {
          if (!show.titleEnglish && show.title) {
            uncached.push(show.title)
          }
        })
      })

      if (uncached.length > 0) {
        try {
          const unique = [...new Set(uncached)]
          const res2 = await fetch(`${API}/schedule/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unique)
          })
          const translations = await res2.json()
          // Patch existing schedule state with resolved translations
          setSchedule(prev => {
            const updated = {}
            Object.entries(prev).forEach(([day, shows]) => {
              updated[day] = shows.map(show => ({
                ...show,
                titleEnglish: show.titleEnglish || translations[show.title] || show.title
              }))
            })
            return updated
          })
        } catch {}
      }
    } catch {
      setError('Could not load schedule. Check your connection.')
      setLoading(false)
    }
  }

  const todayShows = schedule[activeDay?.toLowerCase()] || schedule[activeDay] || []

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1 className="page-title">📅 Airing Schedule</h1>
        <div className="week-nav">
          <button className="btn btn-secondary" style={{padding:'5px 12px',fontSize:12}} onClick={() => setWeek(w => w - 1)} disabled={week <= -2}>← Prev</button>
          <span style={{color:'var(--text-secondary)',fontSize:13}}>{week === 0 ? 'This Week' : week > 0 ? `+${week} weeks` : `${week} weeks`}</span>
          <button className="btn btn-secondary" style={{padding:'5px 12px',fontSize:12}} onClick={() => setWeek(w => w + 1)} disabled={week >= 2}>Next →</button>
        </div>
      </div>

      <div className="day-tabs">
        {DAYS.map(d => (
          <button
            key={d}
            className={`day-tab${activeDay === d ? ' active' : ''}`}
            onClick={() => setActiveDay(d)}
          >
            {d.slice(0,3)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><span className="spinner" style={{width:36,height:36,borderWidth:3}} /></div>
      ) : error ? (
        <div className="empty-state"><span style={{fontSize:48}}>📡</span><h3>{error}</h3></div>
      ) : todayShows.length === 0 ? (
        <div className="empty-state"><span style={{fontSize:48}}>😴</span><h3>No shows airing on {activeDay}</h3></div>
      ) : (
        <div className="schedule-grid">
          {todayShows.map((show, i) => (
            <div 
              key={i} 
              className="schedule-card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const targetTitle = show.titleEnglish || show.title
                navigate('/anime/0', { state: { searchQuery: targetTitle } })
              }}
            >
              {show.imageVersionRoute && (
                <img
                  src={show.imageVersionRoute.startsWith('http') ? show.imageVersionRoute : `https://img.animeschedule.net/production/assets/public/img/${show.imageVersionRoute}`}
                  alt={show.title}
                  className="schedule-card-img"
                  onError={e => e.target.style.display='none'}
                />
              )}
              <div className="schedule-card-info">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                  <p className="schedule-title" style={{flex: 1}}>
                    {settings.titleLanguage === 'english' ? (show.titleEnglish || show.title) : show.title}
                  </p>
                  {show.episode && (
                    <span className="badge badge-source" style={{fontSize:10, flexShrink:0}}>{show.episode}</span>
                  )}
                </div>
                {show.airings && show.airings.length > 0 && (
                  <div className="schedule-airings">
                    {show.airings.map((air, idx) => (
                      <div key={idx} className="airing-row">
                        <span className={`airing-type-badge badge-${air.type.toLowerCase()}`}>{air.type}</span>
                        <span className="airing-time-val">{convertToLocalTime(air.time)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
