import React, { useState, useEffect } from 'react'

const API = 'http://localhost:8765'
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export default function Schedule() {
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
    } catch {
      setError('Could not load schedule. Check your connection.')
    } finally {
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
            <div key={i} className="schedule-card">
              {show.imageVersionRoute && (
                <img
                  src={show.imageVersionRoute.startsWith('http') ? show.imageVersionRoute : `https://img.animeschedule.net/production/assets/public/img/${show.imageVersionRoute}`}
                  alt={show.title}
                  className="schedule-card-img"
                  onError={e => e.target.style.display='none'}
                />
              )}
              <div className="schedule-card-info">
                <p className="schedule-title">{show.title || show.romaji}</p>
                <p className="schedule-time" style={{color:'var(--accent-light)',fontSize:12,marginTop:4}}>
                  {show.time ? `🕐 ${show.time}` : 'Time TBA'}
                </p>
                {show.episodeNumber && (
                  <span className="badge badge-sub" style={{marginTop:6}}>Ep {show.episodeNumber}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
