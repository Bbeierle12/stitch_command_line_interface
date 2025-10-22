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
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('[Main] Loading dev server:', devUrl);
    mainWindow.loadURL(devUrl);
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
  ipcMain.handle('execute-command', async (event, options) => {
    console.log('[Main] Execute command:', options);
    
    const { commandId, args = [], dryRun = false, timeout = 30000 } = options;
    
    // Build command string from commandId and args
    let command = commandId;
    if (args.length > 0) {
      command += ' ' + args.join(' ');
    }
    
    // Security: Don't execute high-risk commands without explicit confirmation
    if (command.includes('panic') || command.includes('kill all') || command.includes('rm -rf /')) {
      return { 
        success: false,
        exitCode: 1,
        stderr: `Command blocked for safety: ${command}. Implement confirmation dialog first.`,
        error: 'Command blocked for safety'
      };
    }
    
    // If dry-run, just return the command that would be executed
    if (dryRun) {
      return {
        success: true,
        stdout: `Would execute: ${command}`,
        exitCode: 0
      };
    }
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      const { stdout, stderr } = await execPromise(command, {
        timeout: timeout,
        maxBuffer: 10 * 1024 * 1024 // 10MB max output
      });
      
      return { 
        success: stderr ? false : true,
        stdout, 
        stderr,
        exitCode: stderr ? 1 : 0
      };
    } catch (error) {
      console.error('[Main] Command execution error:', error);
      return { 
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
        error: error.message
      };
    }
  });

  // Handler for streaming command output
  ipcMain.handle('stream-command', async (event, options, onDataCallback) => {
    console.log('[Main] Stream command:', options);
    
    const { commandId, args = [], timeout = 30000 } = options;
    
    let command = commandId;
    if (args.length > 0) {
      command += ' ' + args.join(' ');
    }
    
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn(command, { shell: true, timeout });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        event.sender.send('command-output', chunk);
      });
      
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        event.sender.send('command-output', chunk);
      });
      
      child.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          error: code !== 0 ? stderr : undefined
        });
      });
      
      child.on('error', (error) => {
        resolve({
          success: false,
          exitCode: 1,
          error: error.message
        });
      });
    });
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
