# Hacker Desktop Dashboard

**Full-featured React + TypeScript + Tailwind operational console** for developers, security analysts, and power users. Built with live data polling, keyboard shortcuts, command palette, accessibility features, and a modular card architecture.

---

## ✨ Features Implemented

### Core Layout
- **Top HUD** – Global timeline scrubber, time mode toggle (live/fixed), environment badge, command palette trigger
- **Intel Rail** (left dock) – Navigation, saved views, project tree placeholders
- **Snapshot Rail** (right edge) – Timeline checkpoints with rollback capability
- **12-column responsive grid** – Hero preview card + modular status cards
- **Inspector Panel** (right sheet) – Diffs, logs, LLM explanations, approval workflows
- **Bottom Console Tail** – Real-time ANSI-aware log streaming with severity filtering

### Interactive Cards
1. **Live Preview** – Browser/CLI/Plots/Tests/Docs modes with HMR status indicator
2. **Editor & Project Status** – Current file, branch, diagnostics (errors/warnings/info), recent edits
3. **Build & Test Board** – Build duration, cache hit rate, test results (pass/fail/flaky)
4. **Security Posture** – VPN/Firewall/Encryption status, alert feed, startup item diff
5. **System Health** – CPU/RAM/Temp/Battery metrics with color-coded thresholds
6. **Network / IDPS** – Live flow table with ALLOW/WATCH/BLOCK filtering
7. **Notifications Inbox** – Bucketed alerts (CI/OS/Security/IDE) with quick actions

### Real-Time Data & State
- **Mock data service** (`src/services/dataService.ts`) simulating live metrics
- **Polling hook** (`src/hooks/usePolling.ts`) for timed updates (2–8s intervals)
- Live/fixed time mode switching pauses/resumes polling
- Loading skeletons for async card states

### Command Palette
- **Keyboard-first** (Alt + Space to open, Arrow keys + Enter to execute)
- **Risk-gated actions** – Low/Med/High visual indicators
- **Preview-before-execute** – Shows shell commands before running
- Filterable verb-first search

### Keyboard Shortcuts
- `Alt + Space` – Open command palette
- `L` – Toggle live/fixed time mode
- `Esc` – Close palette
- Arrow keys – Navigate commands
- Full focus ring support for accessibility

### Design System
- **Palette**: Ink (`#07090B`), Panel (`#0D1217`), Cyan (`#00E9FF`), Ops-green (`#19FF73`), Warn (`#FFC857`), Danger (`#FF3B3B`)
- **Typography**: JetBrains Mono (code/UI), Inter (headings)
- **Motion**: 120–160ms cubic-bezier(0.2, 0.8, 0.2, 1) transitions
- **Depth**: 1px inner borders + `0 2px 24px rgba(0,0,0,0.45)` shadows
- **Scrollbars**: Thin custom style matching theme

### Accessibility
- ARIA roles (`banner`, `region`, `toolbar`, `live`)
- Focus rings with 4.5:1 contrast
- `aria-live` regions for dynamic updates
- Keyboard navigation throughout
- Screen reader–friendly labels

### Error Handling
- **Error Boundary** component catches React errors
- Graceful fallback UI with reload button
- Console logging for debugging

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```powershell
cd react-dashboard
npm install
```

### Development
```powershell
npm run dev
```
Open **http://localhost:5173** in your browser.

### Build for Production
```powershell
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/        # UI modules (cards, HUD, palette, etc.)
├── hooks/             # Custom React hooks (polling, shortcuts)
├── services/          # Data layer (mock service + future API integrations)
├── types.ts           # TypeScript contracts for state shapes
├── App.tsx            # Main orchestrator
├── main.tsx           # React entry with ErrorBoundary
└── index.css          # Tailwind + custom styles
```

---

## 🎯 Data Contracts

All cards consume typed state from `src/types.ts`:

### `PreviewState`
```ts
{ mode: "browser" | "cli" | "plots" | "tests" | "docs"; url?: string; tail?: {...}; hmr: {...} }
```

### `CiState`
```ts
{ build: { durationMs, cacheHitPct, status }, tests: { pass, fail, skip, flaky, lastRunAt }, logsRef }
```

### `SecState`
```ts
{ vpn, firewall, encryption: "on" | "off"; alerts: [{sev, title, ageSec}]; startupDiff? }
```

Mock implementations live in `src/services/dataService.ts`. Replace with real API calls as needed.

---

## ⚙️ Configuration

### Polling Intervals
Edit `src/App.tsx`:
```ts
const ciState = usePolling(() => dataService.getCiState(), 5000); // 5s
const secState = usePolling(() => dataService.getSecurityState(), 8000); // 8s
```

### Color Palette
Customize tokens in `tailwind.config.js`:
```js
colors: {
  ink: "#07090B",
  cyan: "#00E9FF",
  // ...
}
```

### Keyboard Shortcuts
Add/modify in `src/App.tsx`:
```ts
useKeyboardShortcut("r", () => { /* restart dev server */ });
```

---

## 🛠️ Remaining Integrations

### High Priority
- [ ] **Drag-resize grid** – Integrate `@dnd-kit` or `react-grid-layout` for card repositioning
- [ ] **Persistent layouts** – Save/load view configurations to localStorage or backend
- [ ] **Real API connections** – Replace `dataService` mocks with fetch/WebSocket calls
- [ ] **Tool execution** – Wire command palette actions to shell runners with dry-run preview
- [ ] **LLM integration** – "Explain" buttons call GPT-4/Claude for context-aware suggestions

### Medium Priority
- [ ] **DOM Probe overlay** – Hover on preview → highlight source file
- [ ] **Timeline scrubber** – Functional replay of past states (requires backend support)
- [ ] **Flaky test drill-down** – Click CI card fail count → inspector shows logs + fix proposals
- [ ] **Network graph visualization** – Replace placeholder with D3/Sigma mini-graph
- [ ] **Notification actions** – "Mute rule", "Quick reply", "Create task" workflows

### Nice-to-Have
- [ ] **Telemetry dashboard** – Opt-in metrics (HMR latency, palette open time)
- [ ] **Voice input** – Push-to-talk for command palette
- [ ] **Dark/light mode toggle** – User preference (currently dark-only)
- [ ] **Plugin system** – External cards via `CardPlugin` contract (see outline §9)
- [ ] **Multi-environment switcher** – Toggle between dev/staging/prod contexts

---

## 🎨 Visual Polish

All UI elements follow the outlined motion and depth specs:
- **Hover states** scale buttons 5% with cyan borders
- **Pulse animations** on HMR status and live badges
- **Smooth transitions** (150ms cubic-bezier)
- **Shadow lift** on card hover for depth
- **Loading skeletons** with shimmer effect

---

## 📚 References

- Original design outline: See project root for full spec
- Tailwind docs: https://tailwindcss.com/docs
- Vite: https://vitejs.dev
- TypeScript: https://www.typescriptlang.org

---

## 🤝 Contributing

1. Keep card components pure (props in, JSX out)
2. Add new data contracts to `src/types.ts`
3. Mock new endpoints in `dataService` first
4. Test with both live and fixed time modes
5. Ensure keyboard accessibility for all interactions

---

## 📄 License

MIT – See LICENSE file for details.

---

**Status**: ✅ MVP Complete | 🚧 Advanced integrations pending
