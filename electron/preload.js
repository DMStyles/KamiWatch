const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // File system
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Updates
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onCheckingForUpdate: (cb) => ipcRenderer.on('checking-for-update', cb),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update-not-available', cb),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  onUpdateError: (cb) => ipcRenderer.on('update-error', cb),

  // Notifications
  sendNotification: (data) => ipcRenderer.invoke('send-notification', data),

  // Player controls
  seekPlayer: (seconds) => ipcRenderer.invoke('player-seek', seconds),
  getPlayerTime: () => ipcRenderer.invoke('player-get-time'),

  // Extension system
  extensions: {
    list: () => ipcRenderer.invoke('extension:list'),
    install: (data) => ipcRenderer.invoke('extension:install', data),
    remove: (id) => ipcRenderer.invoke('extension:remove', { id }),
    callProvider: (id, method, args) => ipcRenderer.invoke('extension:callProvider', { id, method, args }),
  },
});
