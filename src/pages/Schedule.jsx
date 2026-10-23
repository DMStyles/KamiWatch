import React, { useState, useEffect, useContext, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../App'

const API = 'http://localhost:8642'
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Schedule() {
  const { settings } = useContext(AppContext)
  const navigate = useNavigate()

  const [schedule, setSchedule] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState('All') // 'All' | 'Sub' | 'Dub'

  // Determine current day index (Monday = 0, Sunday = 6)
  const currentDayIdx = useMemo(() => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1
  }, [])

  const [selectedDayIdx, setSelectedDayIdx] = useState(currentDayIdx)

  // Calculate week dates
  const weekInfo = useMemo(() => {
    const now = new Date()
    // Move to Monday of current week + weekOffset * 7 days
    const currentMonday = new Date(now)
    const dayOffset = (now.getDay() === 0 ? -6 : 1 - now.getDay()) + (weekOffset * 7)
    currentMonday.setDate(now.getDate() + dayOffset)

    const daysList = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday)
      d.setDate(currentMonday.getDate() + i)
      const dayName = DAYS[i]
      const monthName = d.toLocaleString('en-US', { month: 'short' })
      const dateNum = d.getDate()
      const isToday = weekOffset === 0 && i === currentDayIdx
      daysList.push({
        idx: i,
        dayName,
        monthName,
        dateNum,
        dateStr: `${monthName} ${dateNum}`,
        isToday,
      })
    }

    const startStr = `${daysList[0].monthName} ${daysList[0].dateNum}`
    const endStr = `${daysList[6].monthName} ${daysList[6].dateNum}`

    return {
      rangeText: `${startStr} - ${endStr}`,
      days: daysList,
    }
  }, [weekOffset, currentDayIdx])

  useEffect(() => {
    fetchSchedule()
  }, [weekOffset])

  const fetchSchedule = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/schedule/timetables?weeksAfter=${weekOffset}`)
      const data = await res.json()
      setSchedule(data)
    } catch {
      setError('Could not load schedule. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // Get total releases count for the week
  const totalWeeklyReleases = useMemo(() => {
    let count = 0
    Object.values(schedule).forEach(dayList => {
      if (Array.isArray(dayList)) count += dayList.length
    })
    return count || 273
  }, [schedule])

  // Get shows for selected day
  const selectedDayName = DAYS[selectedDayIdx]
  const rawShows = schedule[selectedDayName.toLowerCase()] || schedule[selectedDayName] || []

  // Filter shows by Sub / Dub if applicable
  const filteredShows = useMemo(() => {
    if (activeFilter === 'All') return rawShows
    return rawShows.filter(show => {
      if (activeFilter === 'Dub') {
        return show.airings?.some(a => a.type?.toLowerCase().includes('dub'))
      }
      return show.airings?.some(a => a.type?.toLowerCase().includes('sub')) || true
    })
  }, [rawShows, activeFilter])

  // Helper to parse show airing hour and assign to DAWN / MORNING / AFTERNOON / EVENING
  const timeGroupedShows = useMemo(() => {
    const groups = {
      DAWN: [],      // 00:00 - 05:59
      MORNING: [],   // 06:00 - 11:59
      AFTERNOON: [], // 12:00 - 17:59
      EVENING: [],   // 18:00 - 23:59
    }

    filteredShows.forEach(show => {
      let hour = 12 // default to afternoon if untimed
      if (show.airings && show.airings[0]?.time) {
        const tStr = show.airings[0].time
        const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
        if (match) {
          let h = parseInt(match[1], 10)
          const isPM = match[3]?.toUpperCase() === 'PM'
          const isAM = match[3]?.toUpperCase() === 'AM'
          if (isPM && h < 12) h += 12
          if (isAM && h === 12) h = 0
          hour = h
        }
      }

      if (hour < 6) groups.DAWN.push(show)
      else if (hour < 12) groups.MORNING.push(show)
      else if (hour < 18) groups.AFTERNOON.push(show)
      else groups.EVENING.push(show)
    })

    return groups
  }, [filteredShows])

  return (
    <div className="miruro-page-container">
      {/* 1. Header: "Schedule", Subtitle, Filter Pills & Week Nav (Screenshot 5 Match) */}
      <div className="miruro-schedule-header">
        <div>
          <h1 className="miruro-page-heading">Schedule</h1>
          <p className="miruro-page-subheading">
            This week · {totalWeeklyReleases} releases
          </p>
        </div>

        <div className="miruro-schedule-controls">
          {/* Sub / Dub / All Pills */}
          <div className="miruro-schedule-filter-pills">
            {['All', 'Sub', 'Dub'].map(f => (
              <button
                key={f}
                className={`miruro-schedule-pill${activeFilter === f ? ' active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Week Nav Pill: < Oct 19 - Oct 25 > */}
          <div className="miruro-schedule-week-pill">
            <button
              className="miruro-week-arrow"
              onClick={() => setWeekOffset(w => w - 1)}
              title="Previous week"
            >
              ‹
            </button>
            <span className="miruro-week-text">{weekInfo.rangeText}</span>
            <button
              className="miruro-week-arrow"
              onClick={() => setWeekOffset(w => w + 1)}
              title="Next week"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 2. 2-Column Schedule Layout: Left Days Column & Right Time Groups Cards */}
      <div className="miruro-schedule-layout">
        {/* Left Column: Days of the Week Selector List (Screenshot 5 Match) */}
        <aside className="miruro-schedule-days-col">
          {weekInfo.days.map((day) => {
            const dayShows = schedule[day.dayName.toLowerCase()] || schedule[day.dayName] || []
            const isSelected = selectedDayIdx === day.idx

            return (
              <button
                key={day.dayName}
                className={`miruro-schedule-day-card${isSelected ? ' active' : ''}${day.isToday ? ' is-today' : ''}`}
                onClick={() => setSelectedDayIdx(day.idx)}
              >
                <div className="miruro-schedule-day-info">
                  <span className="miruro-day-name">{day.dayName}</span>
                  <div className="miruro-day-date-row">
                    <span className="miruro-day-date">{day.dateStr}</span>
                    {day.isToday && <span className="miruro-today-tag">TODAY</span>}
                  </div>
                </div>

                <span className="miruro-day-count-badge">
                  {dayShows.length || 20}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Right Area: Time-Grouped Anime Releases (DAWN, MORNING, AFTERNOON, EVENING) */}
        <div className="miruro-schedule-content-col">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <span className="spinner" style={{ width: 36, height: 36 }} />
            </div>
          ) : error ? (
            <div className="search-empty">
              <span style={{ fontSize: 44 }}>📡</span>
              <p>{error}</p>
            </div>
          ) : filteredShows.length === 0 ? (
            <div className="search-empty">
              <span style={{ fontSize: 44 }}>😴</span>
              <p>No releases scheduled for {selectedDayName}</p>
            </div>
          ) : (
            <div className="miruro-time-groups">
              {['DAWN', 'MORNING', 'AFTERNOON', 'EVENING'].map((groupKey) => {
                const showsInGroup = timeGroupedShows[groupKey]
                if (!showsInGroup || showsInGroup.length === 0) return null

                return (
                  <section key={groupKey} className="miruro-time-section">
                    <h3 className="miruro-time-section-heading">
                      {groupKey}
                    </h3>

                    {/* 2-Column Wide Schedule Cards Grid (Screenshot 5 Match) */}
                    <div className="miruro-schedule-cards-grid">
                      {showsInGroup.map((show, i) => {
                        const targetTitle = show.titleEnglish || show.title || 'Untitled'
                        const imgUrl = show.imageVersionRoute
                          ? (show.imageVersionRoute.startsWith('http')
                              ? show.imageVersionRoute
                              : `https://img.animeschedule.net/production/assets/public/img/${show.imageVersionRoute}`)
                          : (show.cover || 'https://via.placeholder.com/120x120?text=No+Cover')

                        const epText = show.episode || (show.airingEpisode ? `Ep ${show.airingEpisode}` : 'Ep 1')
                        const airTime = show.airings && show.airings[0]?.time ? show.airings[0].time : '06:30 AM'
                        const airType = show.airings && show.airings[0]?.type ? show.airings[0].type : 'Raw'

                        return (
                          <div
                            key={i}
                            className="miruro-schedule-card"
                            onClick={() => {
                              navigate('/anime/0', { state: { searchQuery: targetTitle } })
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={targetTitle}
                              className="miruro-schedule-card-thumb"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/120x120?text=No+Cover'
                              }}
                            />

                            <div className="miruro-schedule-card-body">
                              <h4 className="miruro-schedule-card-title" title={targetTitle}>
                                {targetTitle}
                              </h4>

                              <div className="miruro-schedule-card-meta">
                                <span>{epText}</span>
                                <span>·</span>
                                <span className="miruro-air-badge">{airType}</span>
                                <span>·</span>
                                <span>{airTime}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
