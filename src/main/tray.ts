import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow) {
  // Create a simple 16x16 tray icon using nativeImage
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAaElEQVQ4T2NkoBAwUqifgWoG' +
      '/P//n+H///8MjIyMDAwMDAxkGcDIyMjw////B4yMjA+INoCRkfEAAwPDA0ZGxgeEDGFkZHzA' +
      'wMBwgJGR8QEhFzAyMj5gYGB4QLQBo4EMGMgwAADSNSgR5rLGxAAAAABJRU5ErkJggg==',
      'base64'
    )
  );

  tray = new Tray(icon);
  tray.setToolTip('Jobotta Desktop');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Jobotta', click: () => mainWindow.show() },
    { type: 'separator' },
    {
      label: 'Quick Actions',
      submenu: [
        { label: 'Fill This Application', accelerator: 'CmdOrCtrl+Shift+J', click: () => console.log('Auto-fill triggered') },
        { label: 'New Job Target from Clipboard', click: () => console.log('New target from clipboard') },
        { label: 'Quick Tailored Resume', click: () => console.log('Quick tailor') },
      ],
    },
    { type: 'separator' },
    { label: 'Sync Status: Idle', enabled: false },
    { label: 'Sync Now', click: () => console.log('Sync triggered') },
    { type: 'separator' },
    { label: 'Settings...', click: () => { mainWindow.show(); mainWindow.webContents.send('navigate', 'settings'); }},
    { label: 'Quit Jobotta', role: 'quit' },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  return tray;
}

export function updateTrayStatus(status: 'synced' | 'syncing' | 'error' | 'offline') {
  if (!tray) return;
  const labels: Record<string, string> = {
    synced: 'Sync Status: Synced',
    syncing: 'Sync Status: Syncing...',
    error: 'Sync Status: Error',
    offline: 'Sync Status: Offline',
  };
  tray.setToolTip(`Jobotta Desktop — ${labels[status] || status}`);
}
