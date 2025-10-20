const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Development mode detection: check if dist folder exists
const distPath = path.join(__dirname, '../dist/index.html');
const isDev = !fs.existsSync(distPath);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#07090B',
    title: 'Hacker Ops Console',
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load the app
  if (isDev) {
    // Try common dev server ports
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to 5174 if 5173 is taken
      mainWindow.loadURL('http://localhost:5174');
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Remove default menu in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // IPC handlers for system operations
  ipcMain.handle('execute-command', async (event, command) => {
    console.log('[Main] Execute command:', command);
    
    // Security: Don't execute high-risk commands without explicit confirmation
    // In production, implement proper command validation and sandboxing
    if (command.includes('panic') || command.includes('kill') || command.includes('rm ')) {
      return { 
        stdout: '', 
        stderr: `Command blocked for safety: ${command}. Implement confirmation dialog first.` 
      };
    }
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const { stdout, stderr } = await execPromise(command, {
        timeout: 10000, // 10 second timeout
        maxBuffer: 1024 * 1024 // 1MB max output
      });
      
      return { stdout, stderr };
    } catch (error) {
      console.error('[Main] Command execution error:', error);
      return { 
        stdout: '', 
        stderr: error.message || 'Command execution failed' 
      };
    }
  });

  ipcMain.handle('get-system-info', async () => {
    const os = require('os');
    return {
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      hostname: os.hostname()
    };
  });

  ipcMain.handle('get-network-info', async () => {
    const os = require('os');
    return os.networkInterfaces();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    // Prevent opening new windows
    return { action: 'deny' };
  });
});
