# CyberOps Desktop Application

This is the native desktop GUI version of the CyberOps Dashboard, built with Electron.

## 🚀 Quick Start

### Development Mode
```bash
# Run the application in development mode (with hot reload)
npm run electron:dev
```

This will:
1. Start the Vite dev server (auto-finds available port 5173-5180)
2. Auto-detect the Vite port and launch Electron
3. Open DevTools automatically for debugging

**Note**: The Electron window should open within 3-5 seconds. If you see cache warnings in the terminal, they're harmless and won't affect functionality.

### Production Build
```bash
# Build the application for distribution
npm run electron:build
```

This will:
1. Build the React app with Vite
2. Package the Electron application
3. Create installers in `dist-electron/`

## 📦 Distribution Packages

The build process creates installers for your platform:

- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer and `.zip` archive
- **Linux**: `.AppImage` and `.deb` package

## 🔧 Electron Architecture

### Main Process (`electron/main.js`)
- Creates and manages the application window
- Handles IPC (Inter-Process Communication) requests
- Implements global keyboard shortcuts
- Manages application lifecycle

### Preload Script (`electron/preload.js`)
- Bridges the renderer and main processes securely
- Exposes safe APIs via `contextBridge`
- Prevents direct Node.js access from the renderer

### Renderer Process (React App)
- Your React dashboard running in a BrowserView
- Can call Electron APIs via `window.electronAPI`

## 🔌 IPC APIs

The following APIs are exposed to the renderer process:

```javascript
// Execute shell commands
await window.electronAPI.executeCommand('npm test');

// Get system information
const sysInfo = await window.electronAPI.getSystemInfo();

// Get network information
const netInfo = await window.electronAPI.getNetworkInfo();

// Platform and version info
console.log(window.electronAPI.platform); // 'win32', 'darwin', or 'linux'
console.log(window.electronAPI.versions); // Node, Chrome, Electron versions
```

## ⌨️ Global Shortcuts

- **Ctrl+Shift+I** (or Cmd+Option+I on Mac): Toggle DevTools

## 🎨 Application Icon

To create a proper icon:

1. Design a 1024×1024 PNG icon
2. Save it as `assets/icon.png`
3. For best results, use separate icons for each platform:
   - Windows: 256×256 `.ico` file
   - macOS: 1024×1024 `.icns` file
   - Linux: 512×512 `.png` file

You can use the `icon-template.html` as a starting point to screenshot or use tools like:
- **electron-icon-builder**: Generates all formats from a single PNG
- **Photoshop/GIMP**: Manual icon creation

## 🔐 Security Features

- **Context Isolation**: Renderer process can't access Node.js directly
- **No External Navigation**: Links open in the default browser
- **Secure IPC**: Only whitelisted APIs are exposed

## 📝 Configuration

Edit `package.json` → `build` section to customize:

```json
{
  "build": {
    "appId": "com.cyberops.dashboard",
    "productName": "CyberOps Dashboard",
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

See [electron-builder docs](https://www.electron.build/configuration/configuration) for all options.

## 🐛 Debugging

### Enable DevTools in Production
Edit `electron/main.js` and uncomment:
```javascript
mainWindow.webContents.openDevTools();
```

### View Electron Logs
```bash
# Windows
%APPDATA%\CyberOps Dashboard\logs

# macOS
~/Library/Logs/CyberOps Dashboard

# Linux
~/.config/CyberOps Dashboard/logs
```

## 🚨 Known Issues

### Windows: Antivirus False Positives
Some antivirus software flags unsigned Electron apps. To fix:
- Code sign your application with a valid certificate
- Or add an exception to your antivirus

### macOS: "App is damaged" Error
Run this in terminal after downloading:
```bash
xattr -cr /Applications/CyberOps\ Dashboard.app
```

### Linux: AppImage Permissions
Make the AppImage executable:
```bash
chmod +x CyberOps-Dashboard-*.AppImage
```

## 🔄 Auto-Update (Future Enhancement)

To add auto-update functionality:
1. Install `electron-updater`
2. Configure update server in `electron-builder.yml`
3. Implement update checking in `electron/main.js`

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Application Distribution](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
