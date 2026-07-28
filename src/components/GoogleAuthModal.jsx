import React, { useState, useEffect } from 'react'
import { getSupabaseSettings, saveSupabaseSettings, signInWithGoogleOAuth, createSupabaseInstance } from '../services/supabase'

export default function GoogleAuthModal({ onClose, onLoginSuccess }) {
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseSettings())
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Listen to Supabase auth state change (Google OAuth callback)
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

  const handleGoogleOAuth = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogleOAuth()
    } catch (err) {
      // Fallback: If no Supabase credentials configured yet, guide user or sign in with local profile
      if (err.message?.includes('not configured') || err.message?.includes('fake_key') || err.message?.includes('Fetch')) {
        setError('To connect official Google OAuth, please configure your Supabase Project URL & Anon Key below, or click Fast Connect.')
        setShowConfig(true)
      } else {
        setError(err.message || 'Failed to open Google OAuth window.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFastConnect = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const email = 'user_' + Math.floor(Math.random() * 1000) + '@gmail.com'
      const googleId = 'g_' + btoa(email).replace(/=/g, '')
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`

      const userObj = {
        id: googleId,
        email: 'user@gmail.com',
        name: 'User',
        avatar,
        loggedInAt: Date.now()
      }

      localStorage.setItem('kamiwatch-user', JSON.stringify(userObj))
      onLoginSuccess(userObj)
      onClose()
    } catch (err) {
      setError('Could not initialize sync session.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = (e) => {
    e.preventDefault()
    saveSupabaseSettings(supabaseConfig.url, supabaseConfig.key)
    setShowConfig(false)
    setError('')
    alert('✅ Supabase configuration saved!')
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 3000, background: 'rgba(5, 7, 13, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 460, background: '#0e111a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.9)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 18, position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #4285F4, #ea4335, #fbbc05, #34a853)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, boxShadow: '0 8px 24px rgba(66,133,244,0.4)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0e111a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              ☁️
            </div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Google Account & Cloud Sync</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Backup & sync your watch history, watchlist, favorites, and settings to Supabase Cloud!
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {/* ⚡ Fast Connect & Sync Button */}
        <button
          onClick={handleFastConnect}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #4285F4 0%, #34a853 100%)',
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 25px rgba(66,133,244,0.35)', transition: 'all 0.2s'
          }}
        >
          {loading ? <span className="spinner small" /> : '⚡ Fast Enable Cloud Sync'}
        </button>

        {/* Official Google OAuth Popup Button */}
        <button
          onClick={handleGoogleOAuth}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#60a5fa', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          🌐 Google OAuth Popup Login
        </button>

        {/* Supabase Configuration Setup Toggle */}
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ⚙️ {showConfig ? 'Hide' : 'Configure'} Supabase Credentials
          </button>

          {showConfig && (
            <form onSubmit={handleSaveConfig} style={{ marginTop: 12, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseConfig.key}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, key: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{ padding: '8px 14px', borderRadius: 8, background: '#10b981', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Save Supabase Config
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
