# Component Architecture

Visual map of how components connect and data flows through the dashboard.

---

## Component Hierarchy

```
App (main orchestrator)
├── ErrorBoundary (error handling wrapper)
├── CommandPalette (modal overlay)
│   └── Command list with keyboard nav
├── Notification Toast (fixed position)
├── TopHud (banner)
│   ├── Environment badge
│   ├── Snapshot label (live region)
│   ├── Time mode toggle button
│   ├── Timeline scrubber input
│   └── Command palette trigger
├── Layout Container
│   ├── LeftDock (sidebar)
│   │   ├── Navigation items
│   │   └── Saved views footer
│   ├── Main Content Area
│   │   ├── SnapshotRail (fixed right)
│   │   │   └── Snapshot buttons
│   │   ├── Grid Container (12 columns)
│   │   │   ├── PreviewCard (col-span-8)
│   │   │   │   ├── Mode selector buttons
│   │   │   │   └── Preview area (iframe/pre/div)
│   │   │   ├── EditorStatusCard (col-span-4)
│   │   │   │   ├── Branch badge
│   │   │   │   ├── Diagnostics chips
│   │   │   │   └── Recent edits list
│   │   │   ├── CiSummaryCard (col-span-6)
│   │   │   │   ├── Build metrics
│   │   │   │   ├── Test results
│   │   │   │   └── Logs reference
│   │   │   ├── SecurityCard (col-span-6)
│   │   │   │   ├── Status pills (VPN/FW/Enc)
│   │   │   │   ├── Alerts list
│   │   │   │   └── Startup diff
│   │   │   ├── SystemCard (col-span-4)
│   │   │   │   └── Metrics grid
│   │   │   ├── NetworkCard (col-span-8)
│   │   │   │   ├── Mini-graph placeholder
│   │   │   │   └── Flows table
│   │   │   └── InboxCard (col-span-4)
│   │   │       └── Notification list
│   │   └── InspectorPanel (right sheet)
│   │       ├── Title header
│   │       ├── Summary text
│   │       ├── Diff details
│   │       ├── LLM explanation
│   │       └── Approve button
│   └── BottomConsole (footer)
│       ├── Console header
│       ├── Log lines (scrollable)
│       └── Input box with send button
```

---

## Data Flow

### 1. Polling Loop (Live Mode)
```
App.tsx
  ↓ usePolling(getCiState, 5000, isLive)
  ↓
dataService.getCiState()
  ↓ returns CiState mock
  ↓
ciState → CiSummaryCard props
  ↓
CardShell wrapper
  ↓ renders
Build/Test metrics displayed
```

### 2. Command Execution
```
User presses Alt+Space
  ↓
useKeyboardShortcut fires
  ↓
setPaletteOpen(true)
  ↓
CommandPalette renders
  ↓ user types & selects
onExecute(cmd)
  ↓
handleCommand callback
  ↓
setNotification("Executing...")
  ↓
Toast appears for 3 seconds
```

### 3. Time Mode Toggle
```
User presses L (or clicks button)
  ↓
setTimeMode(mode => mode === "live" ? "fixed" : "live")
  ↓
usePolling hooks see new `timeMode`
  ↓ if fixed:
Stop all polling intervals
  ↓ if live:
Resume polling → fetch new data
```

### 4. Preview Mode Switch
```
User clicks "CLI" button in PreviewCard
  ↓
onModeChange("cli")
  ↓
setPreviewMode("cli")
  ↓
useMemo recomputes previewState
  ↓
dataService.getPreviewState("cli")
  ↓
PreviewCard re-renders with new mode
  ↓ shows CLI tail instead of iframe
```

---

## State Management

### Global State (App.tsx)
```ts
timeMode: "live" | "fixed"              // Controls polling
previewMode: PreviewMode                // Current preview type
paletteOpen: boolean                    // Command palette visibility
notification: string                    // Toast message
```

### Polled State (hooks/usePolling.ts)
```ts
ciState: CiState | null                 // Build & test data
secState: SecState | null               // Security status
systemMetrics: Metric[] | null          // Hardware metrics
consoleLogs: LogLine[] | null           // Console tail
```

### Static/Memoized
```ts
previewState: PreviewState              // Computed from previewMode
snapshots: Snapshot[]                   // Timeline checkpoints
inspector: InspectorData                // LLM plan details
```

---

## Props Contracts

### Card Props (all cards)
```ts
// Each card receives typed state
CiSummaryCard: { state: CiState }
SecurityCard: { state: SecState }
SystemCard: { metrics: Metric[] }
PreviewCard: { state: PreviewState, onModeChange: (mode) => void }
```

### Wrapper Props
```ts
CardShell: {
  title: string,
  actions?: ReactNode,    // Toolbar buttons
  children: ReactNode
}

ErrorBoundary: {
  children: ReactNode
}
```

### HUD Props
```ts
TopHud: {
  snapshotLabel: string,
  timeMode: "live" | "fixed",
  timeRangeLabel: string,
  onToggleMode: () => void,
  onCommandPalette: () => void
}
```

---

## Event Flow

### Keyboard Shortcut Registration
```
App.tsx (mount)
  ↓
useKeyboardShortcut(" ", handler, { alt: true })
  ↓
useEffect adds window.addEventListener("keydown", ...)
  ↓ user presses Alt+Space
handler fires → setPaletteOpen(true)
  ↓
CommandPalette mounts
  ↓
Focus moves to search input (autoFocus)
```

### Snapshot Selection
```
User clicks dot on SnapshotRail
  ↓
onSelect(id)
  ↓ if id === "live":
setTimeMode("live")
  ↓ else:
setTimeMode("fixed")
  ↓
HUD updates label to "Live" or "Snapshot 142"
  ↓
Cards refresh or freeze based on mode
```

---

## Styling System

### Tailwind Classes
```
card-surface        → bg-panel/80 border border-hairline ...
scrollbar-thin      → Custom webkit scrollbar
transition-all      → 150ms cubic-bezier transitions
focus:ring-2        → Cyan focus rings
hover:scale-105     → Button lift effect
```

### Dynamic Classes
```tsx
// Example from StatusPill
className={`${
  active
    ? "border-ops-green text-ops-green"
    : "border-hairline text-white/40"
}`}
```

### Responsive Grid
```tsx
className="col-span-12 xl:col-span-8"
// Mobile: full width
// Desktop (xl): 8/12 columns
```

---

## Dependency Graph

```
App.tsx
├── React (useState, useMemo, useCallback)
├── Types (PreviewMode, CiState, SecState)
├── Components (TopHud, PreviewCard, etc.)
├── Services (dataService)
├── Hooks (usePolling, useKeyboardShortcut)
└── Config (config.ts)

dataService.ts
├── Types (PreviewState, CiState, SecState)
└── Mock data generators

usePolling.ts
├── React (useEffect, useState)
└── Generic polling logic

CommandPalette.tsx
├── React (useState, useEffect)
├── Hooks (useKeyboardShortcut)
└── Command definitions

CardShell.tsx
├── React (ReactNode)
└── ARIA attributes
```

---

## Extension Points

### Adding a New Card
1. Create `src/components/MyCard.tsx`:
```tsx
import { CardShell } from "./CardShell";

type MyCardProps = { data: MyData };

export function MyCard({ data }: MyCardProps) {
  return (
    <CardShell title="My Card">
      <div>{data.value}</div>
    </CardShell>
  );
}
```

2. Add to `App.tsx` grid:
```tsx
<div className="col-span-12 lg:col-span-6">
  <MyCard data={myData} />
</div>
```

3. Add data fetcher to `dataService.ts`:
```ts
getMyData(): MyData {
  return { value: Math.random() };
}
```

4. Poll in `App.tsx`:
```ts
const myData = usePolling(() => dataService.getMyData(), 4000, isLive);
```

### Adding a Command
Edit `src/components/CommandPalette.tsx`:
```ts
const commands: CommandItem[] = [
  {
    id: "my-cmd",
    label: "My Custom Action",
    verb: "run",
    risk: "low",
    preview: "echo 'Hello World'"
  },
  // ...existing
];
```

### Adding a Keyboard Shortcut
Edit `App.tsx`:
```ts
useKeyboardShortcut("r", () => {
  console.log("Restart triggered");
}, { ctrl: true });
```

---

## Testing Strategy

### Unit Tests (Future)
```
src/components/__tests__/
├── PreviewCard.test.tsx
├── CommandPalette.test.tsx
└── usePolling.test.ts
```

### Integration Tests
```
cypress/e2e/
├── command-palette.cy.ts
├── time-mode-toggle.cy.ts
└── card-interactions.cy.ts
```

### Manual Testing Checklist
- [ ] All cards render without errors
- [ ] Polling updates in live mode
- [ ] Polling stops in fixed mode
- [ ] Command palette opens with Alt+Space
- [ ] Keyboard nav works in palette
- [ ] Preview mode switching updates UI
- [ ] Snapshot rail toggles time mode
- [ ] Notifications appear and dismiss
- [ ] Focus rings visible on Tab
- [ ] Reduced motion disables animations

---

## Performance Optimization Points

### Lazy Loading
```tsx
const NetworkCard = lazy(() => import('./components/NetworkCard'));

<Suspense fallback={<LoadingSkeleton />}>
  <NetworkCard />
</Suspense>
```

### Memoization
```tsx
const expensiveValue = useMemo(() => computeHeavy(data), [data]);

const MemoizedCard = memo(PreviewCard);
```

### Virtual Scrolling (for large logs)
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={200}
  itemCount={consoleLogs.length}
  itemSize={24}
>
  {({ index, style }) => (
    <div style={style}>{consoleLogs[index].message}</div>
  )}
</FixedSizeList>
```

---

## Accessibility Tree

```
[banner] TopHud
  [button] Toggle time mode
  [button aria-keyshortcuts="Alt+Space"] Command

[complementary] LeftDock (Intel Rail)

[region aria-label="Live Preview"] PreviewCard
  [toolbar] Actions (Restart, Explain)
  [group] Mode selector buttons
  [region] Preview area

[region aria-label="Build & Test"] CiSummaryCard
  [toolbar] Actions (Run tests, Propose fix)

[status aria-live="polite"] Notification toast

[contentinfo] BottomConsole
  [log] Console tail
  [textbox] Input
```

---

This architecture supports clean separation of concerns, easy testing, and straightforward extension without touching core logic.
