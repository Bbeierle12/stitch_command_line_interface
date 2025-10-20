// electron-start.js - Start Electron with the correct Vite dev server URL
const { spawn } = require('child_process');
const http = require('http');

async function findVitePort() {
  // Try ports 5173-5180
  for (let port = 5173; port <= 5180; port++) {
    try {
      const isAvailable = await checkPort(port);
      if (isAvailable) {
        console.log(`Found Vite dev server on port ${port}`);
        return port;
      }
    } catch (e) {
      // Continue to next port
    }
  }
  return 5173; // Default fallback
}

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: port,
      method: 'HEAD',
      timeout: 1000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function startElectron() {
  const port = await findVitePort();
  process.env.VITE_DEV_SERVER_URL = `http://localhost:${port}`;
  
  const electron = spawn('electron', ['.'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  electron.on('close', (code) => {
    process.exit(code);
  });
}

startElectron();
