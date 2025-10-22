# Navigation Components - Quick Reference

## LeftDock Component API

### Props
```typescript
// No props required - fully self-contained
```

### Internal State
```typescript
const [activeTab, setActiveTab] = useState('explorer');
const [isCollapsed, setIsCollapsed] = useState(false);
const [savedViews] = useState<SavedView[]>([...]);
```

### Navigation Items Configuration
```typescript
interface NavItem {
  id: string;           // Unique identifier
  label: string;        // Display text
  icon: LucideIcon;     // Icon component
  tooltip: string;      // Hover tooltip
  badge?: number;       // Optional count badge
  href?: string;        // Route to navigate to
}
```

### Usage Example
```tsx
import { LeftDock } from './components/LeftDock';

function App() {
  return (
    <div className="flex">
      <LeftDock />
      <main>{/* Your content */}</main>
    </div>
  );
}
```

## TopHud Component API

### Props
```typescript
interface HUDProps {
  snapshotLabel: string;        // "Live" or "Snapshot 142"
  timeMode: "live" | "fixed";   // Current time mode
  timeRangeLabel: string;       // "Live +/-15m" or time range
  onToggleMode: () => void;     // Toggle callback
  onCommandPalette: () => void; // Open palette callback
  projectName?: string;         // Optional project name
  branch?: string;              // Optional branch name
  buildStatus?: BuildStatus;    // Optional build status
}

type BuildStatus = 'idle' | 'building' | 'success' | 'error';
```

### Usage Example
```tsx
import { TopHud } from './components/TopHud';

function App() {
  const [timeMode, setTimeMode] = useState<"live" | "fixed">("live");
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  
  return (
    <TopHud
      snapshotLabel={timeMode === "live" ? "Live" : "Snapshot 142"}
      timeMode={timeMode}
      timeRangeLabel="Live +/-15m"
      onToggleMode={() => setTimeMode(m => m === "live" ? "fixed" : "live")}
      onCommandPalette={() => setPaletteOpen(true)}
      projectName="stitch-cli"
      branch="main"
      buildStatus={buildStatus}
    />
  );
}
```

## Visual States Reference

### LeftDock States

#### Expanded (Default)
```
┌─────────────────────────────────┐
│ Stitch IDE              [<]     │ ← Header with collapse
├─────────────────────────────────┤
│ 📁 File Explorer           [3]  │ ← Active + Badge
│ 🌿 Build Pipeline              │
│ 🕐 Run History                 │
│ ☑️ Tasks                    [2] │
│                                 │
├─────────────────────────────────┤
│ 💾 SAVED VIEWS                  │
│ ⭐ Debug Layout                │
│ ⭐ Full Editor                 │
└─────────────────────────────────┘
```

#### Collapsed
```
┌────┐
│[>] │ ← Expand button
├────┤
│ 📁 │ ← Icon only with tooltip
│ 🌿 │
│ 🕐 │
│ ☑️ │
│    │
├────┤
│ ⭐ │
│ ⭐ │
└────┘
```

### TopHud States

#### Live Mode
```
┌────────────────────────────────────────────────────────────────┐
│ stitch-cli [main] ● Ready  │ [▶ LIVE] Live +/-15m  │ 🌐 [Cmd] │
└────────────────────────────────────────────────────────────────┘
```

#### Snapshot Mode
```
┌────────────────────────────────────────────────────────────────┐
│ stitch-cli [main]  │ [⏸ SNAPSHOT] 📅 2025-10-22 14:30  │ 🌐 [Cmd]│
└────────────────────────────────────────────────────────────────┘
```

#### Building State
```
┌────────────────────────────────────────────────────────────────┐
│ stitch-cli [main] ⟳ Building...  │ [▶ LIVE]  │ 🌐 [Cmd]        │
└────────────────────────────────────────────────────────────────┘
```

#### Error State
```
┌────────────────────────────────────────────────────────────────┐
│ stitch-cli [main] ⚠ Failed  │ [▶ LIVE]  │ 🌐❌ [Cmd]            │
└────────────────────────────────────────────────────────────────┘
```

## Color Scheme

### LeftDock
- **Background**: `bg-panel/60` (semi-transparent dark panel)
- **Active Tab**: `bg-cyan/10 text-cyan border-l-2 border-cyan`
- **Hover**: `bg-hairline hover:text-white`
- **Badge**: `bg-cyan/20 text-cyan`
- **Tooltips**: `bg-panel border-hairline`

### TopHud
- **Live Mode**: `border-ops-green bg-ops-green/10 text-ops-green`
- **Snapshot Mode**: `border-hairline bg-panel/60 text-white/70`
- **Building**: `text-warn` (yellow)
- **Success**: `text-ops-green` (green)
- **Error**: `text-danger` (red)
- **Connected**: `text-ops-green`
- **Disconnected**: `text-danger`
- **Command Button**: `bg-cyan/10 border-cyan text-cyan`

## Animation Classes

### Transitions
```css
transition-all duration-200    /* Width changes */
transition-colors             /* Color changes */
transition-opacity            /* Tooltip fade */
transition-transform          /* Icon rotation */
```

### Animations
```css
animate-spin                  /* Loading spinner */
animate-pulse                 /* Pulsing dot */
```

## Responsive Breakpoints

### LeftDock
- **Collapsed**: `w-12` (48px)
- **Expanded**: `w-72` (288px)

### TopHud
- **Height**: `h-14` (56px)
- **Horizontal Padding**: `px-4` (16px)

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Open File Explorer |
| `Ctrl+Shift+B` | Open Build Pipeline |
| `Ctrl+H` | Open Run History |
| `Ctrl+Shift+T` | Open Tasks |
| `Alt+Space` | Open Command Palette |
| `L` | Toggle Live/Snapshot mode |
| `Esc` | Close Command Palette |

## Icon Library Reference

All icons from `lucide-react`:

```typescript
import {
  FolderOpen,      // File Explorer
  GitBranch,       // Build Pipeline / Branch
  History,         // Run History
  CheckSquare,     // Tasks
  ChevronRight,    // Collapse/Expand
  Save,            // Saved Views
  Star,            // Favorite/Starred
  Wifi,            // Connected
  WifiOff,         // Disconnected
  Terminal,        // Command
  PlayCircle,      // Live Mode
  PauseCircle,     // Snapshot Mode
  Calendar,        // Date Picker
  Loader2          // Building Spinner
} from 'lucide-react';
```

## Common Patterns

### Tooltip Pattern (Collapsed Sidebar)
```tsx
{isCollapsed && (
  <div className="
    absolute left-full ml-2 px-2 py-1 bg-panel border border-hairline
    text-xs rounded opacity-0 group-hover:opacity-100 
    pointer-events-none transition-opacity whitespace-nowrap
    z-50 shadow-depth
  ">
    {tooltipText}
  </div>
)}
```

### Badge Pattern
```tsx
{badge && (
  <span className="ml-auto bg-cyan/20 text-cyan text-xs px-1.5 py-0.5 rounded font-medium">
    {badge}
  </span>
)}
```

### Active State Pattern
```tsx
className={`
  w-full flex items-center gap-3 px-3 py-2.5
  transition-all duration-150 relative group
  ${isActive 
    ? 'bg-cyan/10 text-cyan border-l-2 border-cyan' 
    : 'text-white/70 hover:bg-hairline hover:text-white border-l-2 border-transparent'
  }
`}
```

### Build Status Indicator Pattern
```tsx
const getBuildStatusIndicator = () => {
  switch(buildStatus) {
    case 'building':
      return <Loader2 className="w-3 h-3 animate-spin" />;
    case 'success':
      return <div className="w-2 h-2 rounded-full bg-ops-green" />;
    case 'error':
      return <div className="w-2 h-2 rounded-full bg-danger" />;
    default:
      return null;
  }
};
```

## Integration Checklist

- [x] Install `lucide-react` dependency
- [x] Import components in `App.tsx`
- [x] Set up state management for build status
- [x] Connect CI state to build status via useEffect
- [x] Pass all required props to TopHud
- [x] Configure routing for navigation items
- [x] Test all interactive states
- [x] Verify keyboard shortcuts work
- [x] Check responsive behavior
- [x] Validate accessibility features
- [x] Test with real backend data
- [x] Review console for any warnings

## Browser Compatibility

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ All modern browsers with ES6+ support

## Performance Notes

- Components use React hooks properly (useState, useEffect, useCallback)
- No unnecessary re-renders (proper memoization)
- Smooth animations use CSS transitions (GPU-accelerated)
- Icons are tree-shakeable (only imported icons are bundled)
- No external API calls within components (data passed via props)

## Maintenance Notes

### Updating Navigation Items
Edit the `navItems` array in `LeftDock.tsx`:
```typescript
const navItems: NavItem[] = [
  { 
    id: 'new-item',
    label: 'New Feature',
    icon: NewIcon,
    tooltip: 'Description (Shortcut)',
    badge: 0,
    href: '/new-feature'
  },
  // ... existing items
];
```

### Updating Saved Views
Edit the `savedViews` state in `LeftDock.tsx`:
```typescript
const [savedViews] = useState<SavedView[]>([
  { id: 'view3', name: 'Custom Layout', icon: 'star' },
  // ... existing views
]);
```

### Customizing Colors
Update Tailwind config or use existing CSS variables:
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      cyan: '#00d9ff',
      'ops-green': '#00ff88',
      warn: '#ffaa00',
      danger: '#ff4444',
      // ... etc
    }
  }
}
```
