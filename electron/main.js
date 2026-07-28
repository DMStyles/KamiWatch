const { app, BrowserWindow, ipcMain, dialog, Notification, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const http = require('http');
const https = require('https');

// Global crash protection handlers
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.stack || err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason?.stack || reason?.message || reason || 'Unknown rejection');
});


const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow;
let backendProcess;

// Wait for backend to be ready by polling /health
function waitForBackend(retries = 30, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get('http://127.0.0.1:8642/health', (res) => {
        if (res.statusCode === 200) resolve();
        else if (n > 0) setTimeout(() => attempt(n - 1), delay);
        else reject(new Error('Backend not ready'));
      }).on('error', () => {
        if (n > 0) setTimeout(() => attempt(n - 1), delay);
        else reject(new Error('Backend not responding'));
      });
    };
    attempt(retries);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0a0f',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    icon: path.join(__dirname, '../public/icon.ico'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.once('ready-to-show', () => mainWindow.show());
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());
  }

  // Intercept all popup windows (used to block iframe ads)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('github.com')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Override Referer header for YouTube requests to bypass embed restriction errors (e.g. Muse Asia Error 153)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.youtube.com/';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow.on('closed', () => { mainWindow = null; });
}

// Global popup ad blocker across all webviews and child frames
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url && url.includes('github.com')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

function startBackend() {
  const { execSync } = require('child_process');
  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM kamiwatch-backend.exe');
      console.log('[Backend] Terminated pre-existing backend process instances.');
    } catch (e) {
      // Ignored if process was not running
    }
  }

  let backendCmd, backendArgs;

  if (isDev) {
    // In dev: run python directly
    backendCmd = process.platform === 'win32' ? 'python' : 'python3';
    backendArgs = [path.join(__dirname, '../backend/main.py')];
  } else {
    // In production: run the bundled .exe
    const backendExe = path.join(
      process.resourcesPath,
      'backend',
      process.platform === 'win32' ? 'kamiwatch-backend.exe' : 'kamiwatch-backend'
    );
    backendCmd = backendExe;
    backendArgs = [];
  }

  console.log('[Backend] Starting:', backendCmd, backendArgs.join(' '));

  backendProcess = spawn(backendCmd, backendArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true,
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.stderr?.on('data', (data) => {
    // FastAPI logs to stderr — not an error
    console.log('[Backend]', data.toString().trim());
  });

  backendProcess.on('close', (code) => {
    console.log('[Backend] exited with code', code);
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err.message);
  });
}

app.whenReady().then(async () => {
  startBackend();

  if (!isDev) {
    // Wait for backend before showing UI
    try {
      await waitForBackend(40, 500);
      console.log('[Backend] Ready!');
    } catch (e) {
      console.error('[Backend] Failed to start in time:', e.message);
    }
  }

  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('[Backend] Terminating on app quit...');
    try {
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${backendProcess.pid} /t /f`);
      } else {
        process.kill(-backendProcess.pid);
      }
    } catch (e) {
      console.error('[Backend] Error terminating:', e.message);
    }
  }
});

// ─── IPC Handlers ────────────────────────────────────────
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());

ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Download Folder',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-folder', async (_, folderPath) => {
  // Open the folder containing the file
  const folder = path.dirname(folderPath);
  await shell.openPath(folder);
});

ipcMain.handle('open-file', async (_, filePath) => {
  await shell.openPath(filePath);
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('check-update', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, version: result?.updateInfo?.version };
  } catch (e) {
    console.error('[Updater] Manual check error:', e.message);
    mainWindow?.webContents.send('update-error', e.message);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('send-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// ─── Auto-updater events ─────────────────────────────────
autoUpdater.on('checking-for-update', () => {
  console.log('[Updater] Checking for update...');
  mainWindow?.webContents.send('checking-for-update');
});

autoUpdater.on('update-available', (info) => {
  console.log('[Updater] Update available:', info.version);
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[Updater] Update not available:', info ? info.version : '');
  mainWindow?.webContents.send('update-not-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('[Updater] Download speed:', progressObj.bytesPerSecond, 'Percent:', progressObj.percent);
  mainWindow?.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Update downloaded:', info.version);
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error:', err.message);
  mainWindow?.webContents.send('update-error', err.message);
});

// Embedded player cross-origin frame seeking & progress query handlers
ipcMain.handle('player-seek', async (event, seconds) => {
  if (!mainWindow) return false;
  try {
    return await mainWindow.webContents.executeJavaScript(`
      (function() {
        function findAndSeek(win, secs) {
          try {
            let v = win.document.querySelector('video');
            if (v) { v.currentTime += secs; return true; }
            for (let i = 0; i < win.frames.length; i++) {
              if (findAndSeek(win.frames[i], secs)) return true;
            }
          } catch(e) {}
          return false;
        }
        let wv = document.querySelector('webview');
        if (wv) {
          try {
            wv.executeJavaScript('let v = document.querySelector("video"); if (v) v.currentTime += ' + ${seconds} + ';');
          } catch(e){}
        }
        return findAndSeek(window, ${seconds});
      })();
    `);
  } catch (e) {
    return false;
  }
});

ipcMain.handle('player-get-time', async () => {
  if (!mainWindow) return null;
  try {
    return await mainWindow.webContents.executeJavaScript(`
      (function() {
        function getTime(win) {
          try {
            let v = win.document.querySelector('video');
            if (v && v.duration > 0) {
              return { currentTime: v.currentTime, duration: v.duration };
            }
            for (let i = 0; i < win.frames.length; i++) {
              let t = getTime(win.frames[i]);
              if (t) return t;
            }
          } catch(e) {}
          return null;
        }
        let wv = document.querySelector('webview');
        if (wv) {
          try {
            wv.executeJavaScript('let v = document.querySelector("video"); if (v && v.duration > 0) ({ currentTime: v.currentTime, duration: v.duration });');
          } catch(e){}
        }
        return getTime(window);
      })();
    `);
  } catch (e) {
    return null;
  }
});

// ============================================================
// EXTENSION SYSTEM (Seanime Compatible Engine)
// ============================================================
const extensionRunner = require('./extensionRunner');

app.whenReady().then(async () => {
  await extensionRunner.autoScanAndLoad();
});

// List all installed and loaded extensions
ipcMain.handle('extension:list', async () => {
  try {
    return extensionRunner.getLoadedExtensions();
  } catch (e) {
    return [];
  }
});

// Call a provider method (search, findChapters, findChapterPages, findEpisodes, findEpisodeServer)
ipcMain.handle('extension:callProvider', async (event, { id, method, args }) => {
  try {
    return await extensionRunner.callProvider(id, method, ...(args || []));
  } catch (e) {
    return { error: e.message };
  }
});

// Helper to fetch URL following redirects
function fetchUrlWithRedirects(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'))
    try {
      const urlObj = new URL(targetUrl)
      const isHttps = urlObj.protocol === 'https:'
      const lib = isHttps ? https : http
      lib.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString()
          return resolve(fetchUrlWithRedirects(redirectUrl, maxRedirects - 1))
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} fetching ${targetUrl}`))
        }
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => resolve(data))
      }).on('error', reject)
    } catch (e) {
      reject(e)
    }
  })
}

// Install an extension from a URL or raw JSON code
ipcMain.handle('extension:install', async (event, { url, code }) => {
  try {
    let extCode = code

    // Download from URL if no code provided
    if (url && !extCode) {
      extCode = await fetchUrlWithRedirects(url)
    }

    if (!extCode) return { success: false, error: 'No extension code or URL provided' }

    let json = null
    try {
      json = JSON.parse(extCode)
    } catch (err) {
      // If code is not JSON (e.g. raw JS/TS class Provider starting with "import" or "class")
      const cleanName = path.basename(url || 'plugin', path.extname(url || '.js'))
      json = {
        id: cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        name: cleanName,
        version: '1.0.0',
        type: 'plugin',
        payload: extCode
      }
    }

    // If manifest has payloadURI but payload field is empty, fetch the provider payload
    if (json && !json.payload && json.payloadURI) {
      try {
        const payloadData = await fetchUrlWithRedirects(json.payloadURI)
        json.payload = payloadData
      } catch (e) {
        console.error('[ExtensionEngine] Failed to fetch payloadURI:', e.message)
      }
    }

    if (!json.payload) {
      return { success: false, error: 'Extension missing executable JS Provider payload.' }
    }

    const extensionsDir = path.join(app.getPath('userData'), 'extensions')
    try { fs.mkdirSync(extensionsDir, { recursive: true }) } catch {}

    const extId = (json.id || json.name || 'custom')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')

    const saveJsonStr = JSON.stringify(json, null, 2)
    const filePath = path.join(extensionsDir, `${extId}.json`)
    fs.writeFileSync(filePath, saveJsonStr, 'utf8')

    const loadRes = await extensionRunner.loadExtensionFile(filePath)
    return loadRes
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// Remove an extension
ipcMain.handle('extension:remove', async (event, { id }) => {
  try {
    const extensionsDir = path.join(app.getPath('userData'), 'extensions');
    const filePath = path.join(extensionsDir, `${id}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    extensionRunner.extensions.delete(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ============================================================
// DISCORD RICH PRESENCE (RPC)
// ============================================================
const DiscordRPC = require('discord-rpc');
const DISCORD_CLIENT_ID = '123456789012345678';

let rpcClient = null;

app.whenReady().then(() => {
  try {
    rpcClient = new DiscordRPC.Client({ transport: 'ipc' });
    rpcClient.on('ready', () => {
      console.log('[Discord RPC] Connected to Discord!');
    });
    rpcClient.login({ clientId: DISCORD_CLIENT_ID }).catch(() => {});
  } catch {}
});

ipcMain.handle('discord:updatePresence', async (event, data) => {
  if (!rpcClient) return;
  try {
    await rpcClient.setActivity({
      details: data.details || 'Watching Anime',
      state: data.state || 'KamiWatch',
      startTimestamp: data.startTimestamp || Date.now(),
      largeImageKey: 'kamiwatch_logo',
      largeImageText: 'KamiWatch',
      instance: false,
    });
  } catch {}
});

ipcMain.handle('discord:clearPresence', async () => {
  if (rpcClient) {
    try { await rpcClient.clearActivity(); } catch {}
  }
});
