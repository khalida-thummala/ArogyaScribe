const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    title: 'ArogyaScribe',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Allow microphone access for live transcription
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  win.maximize();

  win.loadURL('https://mediscribe-kohl.vercel.app');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});