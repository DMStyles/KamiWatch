import React, { useState, useEffect, useRef } from 'react'
import { signInWithGoogleOAuth, createSupabaseInstance } from '../services/supabase'

export default function GoogleAuthModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kamiwatch-user')
      if (saved) {
        const u = JSON.parse(saved)
        if (u.email && !u.email.includes('kamiwatch.app')) setEmail(u.email)
        if (u.name && u.name !== 'google.user') setName(u.name)
      }
    } catch {}

    // Listen for Supabase Google OAuth callback redirect
    const client = createSupabaseInstance()
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleSupabaseSession(session.user)
        }
      })
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const handleSupabaseSession = (sbUser) => {
    const userObj = {
      id: sbUser.id,
      email: sbUser.email || 'user@gmail.com',
      name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
      avatar: sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sbUser.email || 'user')}`,
      loggedInAt: Date.now()
    }
    localStorage.setItem('kamiwatch-user', JSON.stringify(userObj))
    onLoginSuccess(userObj)
    onClose()
  }

  const startPollingLatestAuthUser = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    let attempts = 0
    pollIntervalRef.current = setInterval(async () => {
      attempts++
      if (attempts > 90) {
        clearInterval(pollIntervalRef.current)
        setLoading(false)
        setStatusText('')
        setError('Google Sign-In timed out. Please try clicking the button again.')
        return
      }

      try {
        const res = await fetch('http://localhost:8642/sync/latest-user')
        const data = await res.json()
        if (data.status === 'success' && data.user && data.user.email) {
          clearInterval(pollIntervalRef.current)
          const realUser = {
            id: data.user.id || ('g_' + btoa(data.user.email.toLowerCase()).replace(/=/g, '')),
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            avatar: data.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
            loggedInAt: Date.now()
          }
          localStorage.setItem('kamiwatch-user', JSON.stringify(realUser))
          onLoginSuccess(realUser)
          onClose()
        }
      } catch {}
    }, 1000)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    setStatusText('Opening Google Sign-In in browser...')

    try {
      // Get OAuth URL with skipBrowserRedirect so Electron main window never goes black
      const data = await signInWithGoogleOAuth()
      if (data?.url) {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url)
        } else {
          window.open(data.url, '_blank')
        }
        setStatusText('⏳ Waiting for Google Sign-In in browser...')
        startPollingLatestAuthUser()
      } else {
        throw new Error('Failed to retrieve Google Auth URL')
      }
    } catch (err) {
      console.warn('OAuth launch error:', err.message)
      setLoading(false)
      setStatusText('')
      setError('Could not launch Google Sign-In window.')
    }
  }

  const handleCustomFormSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your Google Email Address.')
      return
    }

    const userEmail = email.trim()
    const userName = name.trim() || userEmail.split('@')[0]
    const googleId = 'g_' + btoa(userEmail.toLowerCase()).replace(/=/g, '')
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userEmail)}`

    const userObj = {
      id: googleId,
      email: userEmail,
      name: userName,
      avatar,
      loggedInAt: Date.now()
    }

    localStorage.setItem('kamiwatch-user', JSON.stringify(userObj))
    onLoginSuccess(userObj)
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 3000, background: 'rgba(5, 7, 13, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 420, background: '#0e111a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 22, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.9)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 20, position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #ea4335, #fbbc05, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, boxShadow: '0 8px 24px rgba(66,133,244,0.4)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0e111a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              ☁️
            </div>
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0 }}>Sign in with Google</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Sync your anime watch history, reading progress, favorites, and settings across all devices!
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* 1-Click Primary Sign-In Button */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #4285F4 0%, #34a853 100%)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 25px rgba(66,133,244,0.35)', transition: 'all 0.2s'
            }}
          >
            {loading ? <span className="spinner small" /> : '🌐 Sign in with Google Account'}
          </button>
          {statusText && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#60a5fa', fontWeight: 600, marginTop: 8 }}>
              {statusText}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER EMAIL & NAME</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form onSubmit={handleCustomFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Display Name</label>
            <input
              type="text"
              placeholder="e.g. Dilshan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Google Email Address</label>
            <input
              type="email"
              placeholder="user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', padding: '11px', borderRadius: 12,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Connect Account & Sync
          </button>
        </form>
      </div>
    </div>
  )
}
