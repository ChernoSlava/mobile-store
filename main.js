const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      // Эти две строки критически важны для работы с fs и классами в renderer.js
      nodeIntegration: true, 
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
  
  // Раскомментируй строку ниже, если захочешь открыть консоль разработчика для отладки
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

// Стандартный код для корректного закрытия приложения на macOS и Windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
