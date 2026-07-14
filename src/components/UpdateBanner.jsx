import React from 'react'

export default function UpdateBanner({ downloaded, onInstall }) {
  return (
    <div className="update-banner">
      <span className="update-banner-text">
        {downloaded
          ? <><span>AniVault update ready!</span> Restart to apply the latest version.</>
          : <><span>New version available!</span> Downloading update in the background...</>
        }
      </span>
      {downloaded && (
        <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 12 }} onClick={onInstall}>
          Restart & Update
        </button>
      )}
    </div>
  )
}
