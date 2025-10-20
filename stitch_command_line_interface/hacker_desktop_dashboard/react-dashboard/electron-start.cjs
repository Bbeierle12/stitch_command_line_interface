// electron-start.js - Start Electron with the correct Vite dev server URL
const { spawn } = require('child_process');
const http = require('http');

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await checkPort(port);
    if (isReady) {
      console.log(`✓ Vite dev server ready on port ${port}`);
      return true;
    }
    console.log(`Waiting for Vite server... (${i + 1}/${maxAttempts})`);
    await sleep(1000);
  }
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: port,
      method: 'HEAD',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
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
  console.log('Starting Electron...');
  
  // Wait for Vite on port 5173
  const ready = await waitForServer(5173);
  if (!ready) {
    console.error('✗ Vite server did not start in time');
    process.exit(1);
  }
  
  process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
  
  console.log('Launching Electron window...');
  
  // Use npx electron to ensure it finds the right executable
  const electron = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    env: { ...process.env },
    shell: true
  });
  
  electron.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
    process.exit(code);
  });
}

startElectron();
