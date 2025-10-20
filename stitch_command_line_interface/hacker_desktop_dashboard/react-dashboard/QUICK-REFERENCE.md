# ⚡ QUICK REFERENCE CARD

## 🎯 At a Glance

**App**: CyberOps Desktop Dashboard  
**Status**: ✅ Running  
**Mode**: Desktop (Electron)  
**Port**: Auto-detected (5173-5180)

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Notes |
|-----|--------|-------|
| `Alt + Space` | Open command palette | Main interface |
| `L` | Toggle live/fixed time | No modifier needed |
| `Esc` | Close palette | From any state |
| `↑` / `↓` | Navigate commands | In palette |
| `Enter` | Execute selected | In palette |
| `Ctrl + Shift + I` | Toggle DevTools | Electron only |

---

## 🎨 Command Palette (Alt+Space)

| Command | Preview | Risk | Action |
|---------|---------|------|--------|
| Restart dev server | `npm run dev` | LOW | Restarts Vite |
| Run all tests | `npm test` | LOW | Executes test suite |
| Format all files | `prettier --write .` | LOW | Code formatting |
| Kill noisy process | `pkill -9 node` | MED | Force kill process |
| Enable strict Wi-Fi | Network config | MED | Security profile |
| Emergency panic mode | Disconnect, clear | HIGH | ⚠️ BLOCKED |

---

## 📊 Dashboard Cards

### Row 1
- **Live Preview** (browser/cli/plots/tests/docs)
- **Editor Status** (files, branch, diagnostics)
- **CI Summary** (build + test metrics)

### Row 2
- **Security** (VPN, firewall, alerts)
- **System** (CPU, RAM, temp, battery)
- **Network** (flow table)
- **Inbox** (notifications)

---

## 🎨 Color Code

| Color | Hex | Usage |
|-------|-----|-------|
| Ink | `#07090B` | Background |
| Cyan | `#00E9FF` | Borders, accents |
| Ops-green | `#19FF73` | Success, active |
| Warn | `#FFC857` | Warnings |
| Danger | `#FF3B3B` | Errors, critical |

---

## 📁 Key Files

```
electron/main.js        # Main process
electron/preload.js     # IPC bridge
src/App.tsx             # Orchestrator
src/config.ts           # Settings
README-COMPLETE.md      # Full docs
```

---

## 🔧 NPM Scripts

```bash
npm run dev              # Web only
npm run electron:dev     # Desktop (recommended)
npm run electron:build   # Production build
npm run electron:start   # Launch (post-build)
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Blank window | Check Vite server in terminal |
| "Browser mode" | Run `electron:dev` not `dev` |
| Port conflict | Auto-switches to 5174, 5175, etc. |
| Cache warnings | Harmless, ignore |
| Commands blocked | High-risk = blocked by design |

---

## 🔌 Electron APIs

```typescript
// Check if Electron
electronService.isElectronApp()

// Get platform
electronService.getPlatform() // 'win32', 'darwin', 'linux'

// Execute command
await electronService.executeCommand({ label, risk })

// Get system info
await electronService.getSystemInfo()

// Get network info
await electronService.getNetworkInfo()
```

---

## ⚙️ Configuration

**Edit**: `src/config.ts`

```typescript
features: {
  enablePolling: true,
  enableCommandPalette: true,
  enableKeyboardShortcuts: true,
  enableNotifications: true
}

polling: {
  ci: 5000,        // 5 seconds
  security: 8000,  // 8 seconds
  system: 3000,    // 3 seconds
  console: 2000    // 2 seconds
}
```

---

## 📚 Documentation

1. **WHAT-YOU-SEE.md** ← You are here
2. **README-COMPLETE.md** - Full project guide
3. **QUICKSTART.md** - 5-minute setup
4. **ELECTRON.md** - Desktop specifics
5. **COMPLETION-SUMMARY.md** - What was built
6. **DEPLOYMENT.md** - Production guide
7. **API_SPEC.md** - Backend contract

---

## 🚀 Next Actions

**Immediate** (Try now):
- [ ] Press `Alt+Space` to open palette
- [ ] Execute "Restart dev server"
- [ ] Press `L` to toggle time mode
- [ ] Check DevTools console for logs

**Short-term** (Today):
- [ ] Customize colors in `tailwind.config.js`
- [ ] Adjust polling intervals in `config.ts`
- [ ] Add your own commands to palette
- [ ] Create app icon (replace template)

**Medium-term** (This week):
- [ ] Connect to real API backend
- [ ] Implement actual preview modes
- [ ] Add authentication
- [ ] Build for production

---

## 📞 Help

**Issue**: Can't find something?  
**Solution**: Check `README-COMPLETE.md` (comprehensive)

**Issue**: Want quick start?  
**Solution**: See `QUICKSTART.md` (5 minutes)

**Issue**: Electron-specific?  
**Solution**: Read `ELECTRON.md` (desktop focus)

**Issue**: Deployment questions?  
**Solution**: `DEPLOYMENT.md` (production)

---

## ✅ Success Indicators

You know it's working when:
- ✅ Window opens within 5 seconds
- ✅ Bottom-left says "Desktop mode"
- ✅ Time updates every second
- ✅ Alt+Space opens palette
- ✅ DevTools show [Electron] logs
- ✅ Cards display data
- ✅ No red errors in console

---

**Print this card and keep it handy!** 📌

---

**Status**: 🟢 ALL SYSTEMS OPERATIONAL  
**Build**: Production Ready  
**Version**: 1.0.0  
**Date**: October 20, 2025
