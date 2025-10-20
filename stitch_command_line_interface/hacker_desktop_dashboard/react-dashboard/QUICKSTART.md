# Quick Start Guide

## First Launch (5 minutes)

### 1. Install Dependencies
```powershell
cd hacker_desktop_dashboard/react-dashboard
npm install
```

### 2. Start Dev Server
```powershell
npm run dev
```

### 3. Open in Browser
Navigate to **http://localhost:5173**

---

## What You'll See

### Live Dashboard
- **Top bar**: Environment badge, time mode toggle, command palette button
- **Left sidebar**: Intel rail with navigation placeholders
- **Main canvas**: 12-column grid with 7+ interactive cards
- **Right rail**: Snapshot timeline (click dots to switch)
- **Right panel**: Inspector with LLM explanations
- **Bottom**: Console tail with live logs

### Data Updates
All cards refresh automatically in **live mode**:
- CI/Test: Every 5 seconds
- Security: Every 8 seconds  
- System: Every 3 seconds
- Console: Every 2 seconds

Press **L** to toggle between live and fixed time modes.

---

## Try These Actions

### Command Palette
1. Press **Alt + Space**
2. Type "restart" or "test"
3. Use ↑↓ arrows to navigate
4. Press **Enter** to execute (currently logs to notification)

### Preview Modes
1. Click any mode button in the Live Preview card (Browser, CLI, Plots, Tests, Docs)
2. Watch the preview area update

### Snapshots
1. Click any dot on the right snapshot rail
2. Toggle between live and historical views

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Space` | Open command palette |
| `L` | Toggle live/fixed time |
| `Esc` | Close palette |
| `↑↓` | Navigate commands |
| `Enter` | Execute command |

---

## Customization

### Change Polling Intervals
Edit `src/App.tsx`:
```ts
const ciState = usePolling(() => dataService.getCiState(), 5000); // Change 5000 to desired ms
```

### Add New Commands
Edit `src/components/CommandPalette.tsx`:
```ts
const commands: CommandItem[] = [
  { id: "my-cmd", label: "My Custom Command", verb: "run", risk: "low", preview: "echo hello" },
  // ...existing commands
];
```

### Modify Color Palette
Edit `tailwind.config.js`:
```js
colors: {
  ink: "#07090B",      // Main background
  cyan: "#00E9FF",     // Primary accent
  "ops-green": "#19FF73", // Success
  warn: "#FFC857",     // Warnings
  danger: "#FF3B3B"    // Errors
}
```

---

## Troubleshooting

### Port 5173 Already in Use
```powershell
# Kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# Or change port in vite.config.ts
server: { port: 3000 }
```

### TypeScript Errors
```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Hot Reload Not Working
1. Check file watcher limits (Windows usually fine)
2. Restart dev server: `Ctrl + C`, then `npm run dev`

---

## Next: Connect Real Data

Replace mock service in `src/services/dataService.ts` with fetch calls:

```ts
async getCiState(): Promise<CiState> {
  const response = await fetch('/api/ci/status');
  return response.json();
}
```

Then update polling in `src/App.tsx`:
```ts
const ciState = usePolling(
  async () => await dataService.getCiState(),
  5000,
  timeMode === "live"
);
```

---

## Support

- Check console for errors (`F12` → Console tab)
- Review full README.md for architecture details
- See `src/types.ts` for all data contracts
