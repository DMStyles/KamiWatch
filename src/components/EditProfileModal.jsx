import React, { useState } from 'react'

export default function EditProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.name && user.name !== 'google.user' ? user.name : '')
  const [email, setEmail] = useState(user?.email && !user.email.includes('kamiwatch.app') ? user.email : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const finalEmail = (email.trim() || 'user@gmail.com')
    const finalName = (name.trim() || finalEmail.split('@')[0] || 'User')

    setLoading(true)

    try {
      const googleId = user?.id || ('g_' + btoa(finalEmail.toLowerCase()).replace(/=/g, ''))
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalEmail)}`

      const updatedUser = {
        ...user,
        id: googleId,
        email: finalEmail,
        name: finalName,
        avatar,
        updatedAt: Date.now()
      }

      // 1. Save locally
      localStorage.setItem('kamiwatch-user', JSON.stringify(updatedUser))

      // 2. Sync to local backend
      try {
        const API = 'http://localhost:8642'
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
      } catch (err) {
        console.warn('Backend sync auth updated locally.')
      }

      onSave(updatedUser)
      onClose()
    } catch (e) {
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
          <div style={{ fontSize: 32 }}>✏️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Edit Account Profile</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
            Update your profile display name and cloud sync email address.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Display Name</label>
            <input
              type="text"
              placeholder="e.g. Dilshan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Google Email Address</label>
            <input
              type="email"
              placeholder="your.email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
            />
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
              {loading ? <span className="spinner small" /> : '💾 Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
