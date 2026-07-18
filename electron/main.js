const { app, BrowserWindow, ipcMain, dialog, Notification, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const http = require('http');

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

function startBackend() {
  const { execSync } = require('child_process');
  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM anivault-backend.exe');
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
      process.platform === 'win32' ? 'anivault-backend.exe' : 'anivault-backend'
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
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') app.quit();
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

ipcMain.handle('check-update', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.handle('send-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

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

autoUpdater.on('update-downloaded', (info) => {
  console.log('[Updater] Update downloaded:', info.version);
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error:', err.message);
  mainWindow?.webContents.send('update-error', err.message);
});
