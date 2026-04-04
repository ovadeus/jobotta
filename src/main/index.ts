import { app, BrowserWindow, Menu, globalShortcut, shell } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { createTray } from './tray';
import { closeDb } from './database/db';

// Set app name before anything else
app.setName('Jobotta');

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;

// ─── macOS Application Menu ────────────────────────────────────

function buildAppMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Jobotta',
      submenu: [
        { label: 'About Jobotta', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('navigate', 'settings') },
        { type: 'separator' },
        { label: 'Hide Jobotta', role: 'hide' },
        { label: 'Hide Others', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit Jobotta', role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Resume', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('navigate', 'resumes') },
        { label: 'New Job Target', accelerator: 'CmdOrCtrl+Shift+N', click: () => mainWindow?.webContents.send('navigate', 'targets') },
        { type: 'separator' },
        { label: 'Close Window', role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' as const }] : []),
        { type: 'separator' as const },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' as const },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Jobotta Website', click: () => shell.openExternal('https://jobotta.app') },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── Splash Screen ─────────────────────────────────────────────

function createSplashScreen(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const version = app.getVersion() || '1.0.0';

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: transparent;
    -webkit-app-region: drag;
    user-select: none;
  }
  .card {
    background: #fff;
    border-radius: 16px;
    padding: 48px 56px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
    min-width: 400px;
  }
  .title {
    font-size: 32px;
    font-weight: 800;
    color: #1d1d1f;
    letter-spacing: -0.5px;
    margin-bottom: 2px;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #e8720c;
    border-radius: 50%;
    margin-left: 2px;
    vertical-align: super;
  }
  .subtitle {
    font-size: 13px;
    color: #6e6e73;
    margin-bottom: 24px;
    font-weight: 400;
  }
  .version {
    font-size: 11px;
    color: #999;
    margin-bottom: 20px;
  }
  .loader {
    width: 120px;
    height: 3px;
    background: #ebebed;
    border-radius: 2px;
    margin: 0 auto;
    overflow: hidden;
  }
  .loader-bar {
    width: 40%;
    height: 100%;
    background: #e8720c;
    border-radius: 2px;
    animation: load 1.5s ease-in-out infinite;
  }
  @keyframes load {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(200%); }
    100% { transform: translateX(-100%); }
  }
  .status {
    font-size: 11px;
    color: #bbb;
    margin-top: 12px;
  }
  @media (prefers-color-scheme: dark) {
    .card {
      background: #1a1a1a;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
    }
    .title { color: #e8e8e8; }
    .subtitle { color: #999; }
    .loader { background: #333; }
    .dot { background: #f0850e; }
    .loader-bar { background: #f0850e; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="title">Jobotta<span class="dot"></span></div>
    <div class="subtitle">Intelligent Job Application Assistant</div>
    <div class="version">Version ${version}</div>
    <div class="loader"><div class="loader-bar"></div></div>
    <div class="status">Loading application...</div>
  </div>
</body>
</html>
  `)}`);

  return splash;
}

// ─── Main Window ───────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Jobotta',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // When the main window is ready, dismiss splash and show main
  mainWindow.webContents.on('did-finish-load', () => {
    // Minimum splash display time: 3 seconds
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow) {
        mainWindow.show();
        if (isDev) {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      }
    }, 3000);
  });

  // Create tray
  createTray(mainWindow);

  // Register global hotkey
  globalShortcut.register('CmdOrCtrl+Shift+J', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send('trigger-autofill');
    }
  });
}

// ─── App Lifecycle ─────────────────────────────────────────────

app.whenReady().then(() => {
  buildAppMenu();
  registerIpcHandlers();

  // Show splash first
  splashWindow = createSplashScreen();

  // Then create main window (hidden until loaded)
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  closeDb();
});
