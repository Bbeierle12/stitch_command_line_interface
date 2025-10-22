const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (options) => ipcRenderer.invoke('execute-command', options),
  streamCommand: (options, onData) => {
    // Listen for streaming output
    const handler = (event, chunk) => onData(chunk);
    ipcRenderer.on('command-output', handler);
    
    // Execute command and cleanup listener when done
    return ipcRenderer.invoke('stream-command', options).finally(() => {
      ipcRenderer.removeListener('command-output', handler);
    });
  },
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  platform: process.platform,
  versions: process.versions
});
