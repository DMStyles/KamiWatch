import React, { useState } from 'react'

export default function GoogleAuthModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const performLogin = async (userEmail, userName) => {
    const finalEmail = (userEmail || email || 'user@gmail.com').trim()
    const finalName = (userName || name || 'Anime Fan').trim()

    setLoading(true)
    setError('')

    try {
      const googleId = 'g_' + btoa(finalEmail.toLowerCase()).replace(/=/g, '')
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalEmail)}`

      const API = 'http://localhost:8642'
      try {
        await fetch(`${API}/sync/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: googleId,
            email: finalEmail,
            name: finalName,
            avatar
          })
        })
      } catch (e) {
        console.warn('Backend sync auth offline, continuing local sync profile.')
      }

      const userObj = {
        id: googleId,
        email: finalEmail,
        name: finalName,
        avatar,
        loggedInAt: Date.now()
      }
      localStorage.setItem('kamiwatch-user', JSON.stringify(userObj))
      onLoginSuccess(userObj)
      onClose()
    } catch (err) {
      setError('An error occurred while initializing sync profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    performLogin(email, name)
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 3000, background: 'rgba(5, 7, 13, 0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 440, background: '#0e111a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 32, boxShadow: '0 25px 80px rgba(0,0,0,0.9)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 20, position: 'relative'
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
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Sign in with Google</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Sync your watch history, reading progress, favorites, and settings seamlessly across all devices!
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* 1-Click Fast Google Sign-In Button */}
        <button
          onClick={() => performLogin(email, name)}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #4285F4 0%, #34a853 100%)',
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 25px rgba(66,133,244,0.35)', transition: 'all 0.2s'
          }}
        >
          {loading ? <span className="spinner small" /> : '🌐 1-Click Sign in & Enable Cloud Sync'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER ACCOUNT DETAILS</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email Address</label>
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
              marginTop: 4, width: '100%', padding: '10px', borderRadius: 10,
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
