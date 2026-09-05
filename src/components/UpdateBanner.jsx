import React, { useState } from 'react'

export default function UpdateBanner({ downloaded, progress, onInstall }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="update-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="update-banner-text">
        {downloaded
          ? <><span>KamiWatch update ready!</span> Restart to apply the latest version.</>
          : <><span>New version available!</span> Downloading update... {progress > 0 ? `(${Math.round(progress)}%)` : ''}</>
        }
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {downloaded && (
          <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 12 }} onClick={onInstall}>
            Restart & Update
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ padding: '4px 8px', fontSize: 12, opacity: 0.7 }}
          onClick={() => setDismissed(true)}
          title="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

