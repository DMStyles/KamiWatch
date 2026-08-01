import React, { useState } from 'react'

const API = 'http://localhost:8642'

export default function EditProfileModal({ user, onClose, onSave }) {
  // SECURITY FIX: Only allow display name changes.
  // Email is verified by Google and cannot be changed here — changing it would allow identity spoofing.
  const [name, setName] = useState(user?.name && user.name !== 'google.user' ? user.name : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const finalName = name.trim()
    if (!finalName) {
      setError('Display name cannot be empty.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // SECURITY: Keep the existing verified id and email — do NOT regenerate them
      const updatedUser = {
        ...user,
        name: finalName,
        updatedAt: Date.now()
      }

      // 1. Save locally
      localStorage.setItem('kamiwatch-user', JSON.stringify(updatedUser))

      // 2. Sync name change to backend — only updates name, keeps existing verified email/id
      if (user?.id) {
        try {
          await fetch(`${API}/sync/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,       // Use existing verified ID — never regenerate
              email: user.email,      // Use existing verified email — never allow change
              name: finalName,
              avatar: user.avatar || ''
            })
          })
        } catch {
          // Non-critical if backend is unreachable
        }
      }

      onSave(updatedUser)
      onClose()
    } catch (e) {
      setError('Failed to save profile. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
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
        borderRadius: 22, padding: 30, boxShadow: '0 25px 80px rgba(0,0,0,0.9)', color: '#fff',
        display: 'flex', flexDirection: 'column', gap: 18, position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {user?.avatar && (
            <img src={user.avatar} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 4 }} onError={e => e.target.style.display='none'} />
          )}
          <div style={{ fontSize: 20 }}>✏️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Edit Profile</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
            Update your display name shown across KamiWatch.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Display Name — editable */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dilshan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            />
          </div>

          {/* Email — read-only, managed by Google */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Google Email <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>(managed by Google, cannot be changed)</span>
            </label>
            <div style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: 'rgba(255,255,255,0.4)', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              🔒 {user?.email || 'No email linked'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 2, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? <span className="spinner small" /> : '💾 Save Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
