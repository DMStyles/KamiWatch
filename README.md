# AniVault 🎌

AniVault is a sleek, modern desktop downloader for anime and other media. Built with a cinematic Stremio-inspired dark glassmorphism UI, AniVault lets users search, stream, and download media directly to their PCs.

---

## ✨ Features

- 🔍 **Unified Search**: Search across multiple sources (Anikoto, AnimeTake) simultaneously.
- 📅 **Airing Schedule**: Real-time weekly airing calendar fetched from AnimeSchedule.net API v3.
- 📥 **Download Manager**: Multi-threaded downloads powered by `yt-dlp` with live speed, ETA, and progress tracking.
- ▶️ **Built-in Player**: Play streams or downloaded files inside the app (using video.js with HLS support).
- 📚 **Media Library**: View, play, and open the destination folder of completed downloads.
- ⚙️ **Custom Settings**: Choose quality settings (1080p, 720p, etc.), sub/dub preferences, download folder, and toggles.
- 🔄 **Auto-Updates**: Integrated GitHub Releases auto-updater checker.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, CSS Variables (Dark glassmorphism theme)
- **Desktop Shell**: Electron 28
- **Backend Service**: FastAPI (Python), SQLite
- **Download Engine**: `yt-dlp`
- **Packaging**: PyInstaller (bundled Python backend) & `electron-builder`

---

## 🚀 How to Run locally

### 1. Clone the repository
```bash
git clone https://github.com/DMStyles/AniVault.git
cd AniVault
```

### 2. Set up backend dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up frontend dependencies
```bash
npm install
```

### 4. Run in Development Mode
```bash
# Starts both the FastAPI server and the Electron shell concurrently
npm run dev
```

---

## 📦 Building a Release Setup File

You can build a standalone Windows setup installer (`AniVault-Setup-1.0.0.exe`) containing the compiled Python server and React UI:

```bash
# Bundles the python backend, compiles React, and creates the NSIS installer
python build.py
```
Check the `/release` folder for the setup executable.

---

## 🔄 Publishing Updates (GitHub Releases)

AniVault is configured with an auto-updater pointing to this repository. To publish a new release:
1. Increment the version in `package.json` (e.g., `"version": "1.1.0"`).
2. Run the build script: `python build.py`
3. Create a new Release on your GitHub repository with the tag matching the version (e.g., `v1.1.0`).
4. Upload `release/AniVault-Setup-1.1.0.exe` and `release/latest.yml` to the release assets.
5. Users running the older version will automatically see an update notification banner and download it!
