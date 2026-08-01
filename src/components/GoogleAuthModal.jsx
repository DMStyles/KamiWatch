import React, { useState, useEffect, useRef } from 'react'
import { signInWithGoogleOAuth, createSupabaseInstance } from '../services/supabase'

const API = 'http://localhost:8642'

export default function GoogleAuthModal({ onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const pollIntervalRef = useRef(null)

  useEffect(() => {
    // Check if already signed in via Supabase session
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

  const handleSupabaseSession = async (sbUser) => {
    // For Supabase sessions, send to /sync/auth which validates UUID format
    try {
      const userObj = {
        id: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
        avatar: sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sbUser.email || 'user')}`,
        loggedInAt: Date.now()
      }

      // Sync verified Supabase user to backend
      await fetch(`${API}/sync/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userObj.id,
          email: userObj.email,
          name: userObj.name,
          avatar: userObj.avatar
        })
      }).catch(() => {}) // Non-critical if backend is down

      localStorage.setItem('kamiwatch-user', JSON.stringify(userObj))
      onLoginSuccess(userObj)
      onClose()
    } catch (e) {
      console.error('Session handling error:', e)
    }
  }

  const startPollingForVerifiedUser = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    let attempts = 0
    pollIntervalRef.current = setInterval(async () => {
      attempts++
      if (attempts > 90) {
        clearInterval(pollIntervalRef.current)
        setLoading(false)
        setStatusText('')
        setError('Google Sign-In timed out. Please try again.')
        return
      }

      try {
        // Poll backend for the verified user (set by /sync/verify after OAuth callback)
        const res = await fetch(`${API}/sync/latest-user`)
        const data = await res.json()
        if (data.status === 'success' && data.user?.email) {
          clearInterval(pollIntervalRef.current)
          const verifiedUser = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email.split('@')[0],
            avatar: data.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.user.email)}`,
            loggedInAt: Date.now()
          }
          localStorage.setItem('kamiwatch-user', JSON.stringify(verifiedUser))
          onLoginSuccess(verifiedUser)
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
      const data = await signInWithGoogleOAuth()
      if (data?.url) {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url)
        } else {
          window.open(data.url, '_blank')
        }
        setStatusText('⏳ Waiting for Google Sign-In...')
        startPollingForVerifiedUser()
      } else {
        throw new Error('Failed to retrieve Google Auth URL')
      }
    } catch (err) {
      setLoading(false)
      setStatusText('')
      setError('Could not launch Google Sign-In. Please try again.')
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 3000, background: 'rgba(5, 7, 13, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 420, background: '#0e111a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 22, padding: 36, boxShadow: '0 25px 80px rgba(0,0,0,0.9)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 24, position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #ea4335, #fbbc05, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, boxShadow: '0 8px 24px rgba(66,133,244,0.4)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0e111a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              ☁️
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Sign in with Google</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Sync your watch history, reading progress, favorites, and settings across all devices.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: 'linear-gradient(135deg, #4285F4 0%, #34a853 100%)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 25px rgba(66,133,244,0.35)', transition: 'all 0.2s',
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {statusText || 'Connecting...'}</>
            : '🌐 Sign in with Google'}
        </button>

        {/* Security note */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
          🔒 Your identity is verified securely by Google.<br />
          KamiWatch never stores your Google password.
        </div>
      </div>
    </div>
  )
}
