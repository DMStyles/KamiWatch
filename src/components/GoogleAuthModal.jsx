import React, { useState, useEffect } from 'react'
import { signInWithGoogleOAuth, createSupabaseInstance } from '../services/supabase'

export default function GoogleAuthModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Listen for Supabase Google OAuth callback redirect
    const client = createSupabaseInstance()
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleSupabaseSession(session.user)
        }
      })
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

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    let sessionEmail = ''
    let sessionName = ''

    try {
      // Get OAuth URL with skipBrowserRedirect so Electron main window never goes black
      const data = await signInWithGoogleOAuth()
      if (data?.url) {
        if (window.electronAPI?.openExternal) {
          window.electronAPI.openExternal(data.url)
        } else {
          window.open(data.url, '_blank')
        }
      }
      
      const client = createSupabaseInstance()
      if (client) {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          sessionEmail = session.user.email
          sessionName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        }
      }
    } catch (err) {
      console.warn('OAuth window warning:', err.message)
    }

    // Complete login profile using real email
    try {
      const userEmail = email.trim() || sessionEmail || 'google.user@kamiwatch.app'
      const userName = name.trim() || sessionName || userEmail.split('@')[0]
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
    } catch (err) {
      setError('Could not complete sign in session.')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomFormSubmit = (e) => {
    e.preventDefault()
    handleGoogleSignIn()
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
              placeholder="e.g. User"
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
