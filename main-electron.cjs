/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "万能工具箱 - 太赫兹调制器件参数计算",
    icon: path.join(__dirname, 'dist/favicon.ico'), // Fallback if icon is built
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Remove menu bar for a clean, professional native software look
  win.setMenuBarVisibility(false);

  // Load the built app
  win.loadFile(path.join(__dirname, 'dist/index.html')).catch((err) => {
    console.error("Failed to load dist/index.html. Make sure you run 'npm run build' first!", err);
    win.loadURL("http://localhost:3000"); // Fallback to dev server
  });
}

app.whenReady().then(() => {
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
