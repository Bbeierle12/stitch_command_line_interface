import { useState } from 'react';
import { 
  FolderOpen, 
  GitBranch, 
  History, 
  CheckSquare,
  ChevronRight,
  Save,
  Star,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  badge?: number;
  href?: string;
}

interface SavedView {
  id: string;
  name: string;
  icon: 'star' | 'folder';
}

const navItems: NavItem[] = [
  { 
    id: 'explorer', 
    label: 'File Explorer', 
    icon: FolderOpen,
    tooltip: 'Browse project files (Ctrl+Shift+E)',
    badge: 3,
    href: '/'
  },
  { 
    id: 'pipeline', 
    label: 'Build Pipeline', 
    icon: GitBranch,
    tooltip: 'View build stages and logs (Ctrl+Shift+B)',
    href: '/ci'
  },
  { 
    id: 'history', 
    label: 'Run History', 
    icon: History,
    tooltip: 'Previous executions and snapshots (Ctrl+H)',
    href: '/preview'
  },
  { 
    id: 'tasks', 
    label: 'Tasks', 
    icon: CheckSquare,
    tooltip: 'Task runner and scripts (Ctrl+Shift+T)',
    badge: 2,
    href: '/inbox'
  }
];

export function LeftDock() {
  const [activeTab, setActiveTab] = useState('explorer');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [savedViews] = useState<SavedView[]>([
    { id: 'view1', name: 'Debug Layout', icon: 'star' },
    { id: 'view2', name: 'Full Editor', icon: 'folder' }
  ]);

  const handleNavClick = (item: NavItem) => {
    setActiveTab(item.id);
    if (item.href) {
      // Navigation will be handled by parent component via href
      window.location.hash = item.href;
    }
  };

  return (
    <aside 
      className={`
        flex flex-col h-full bg-panel/60 border-r border-hairline
        transition-all duration-200 ${isCollapsed ? 'w-12' : 'w-72'}
      `}
    >
      {/* Brand/Logo Area */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
        {!isCollapsed && (
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-cyan">
            Stitch IDE
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-hairline rounded transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight 
            className={`w-4 h-4 text-white/60 transition-transform ${
              isCollapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5
                transition-all duration-150 relative group
                ${isActive 
                  ? 'bg-cyan/10 text-cyan border-l-2 border-cyan' 
                  : 'text-white/70 hover:bg-hairline hover:text-white border-l-2 border-transparent'
                }
              `}
              aria-label={item.tooltip}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-cyan/20 text-cyan text-xs px-1.5 py-0.5 rounded font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="
                  absolute left-full ml-2 px-2 py-1 bg-panel border border-hairline
                  text-xs rounded opacity-0 group-hover:opacity-100 
                  pointer-events-none transition-opacity whitespace-nowrap
                  z-50 shadow-depth
                ">
                  {item.label}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Saved Views */}
      <div className="border-t border-hairline p-3">
        {!isCollapsed && (
          <div className="text-[11px] text-white/50 mb-2 flex items-center gap-1 uppercase tracking-[0.16em]">
            <Save className="w-3 h-3" />
            <span>Saved Views</span>
          </div>
        )}
        <div className="space-y-1">
          {savedViews.map(view => (
            <button
              key={view.id}
              className="w-full flex items-center gap-2 p-2 text-white/60 hover:bg-hairline hover:text-white rounded text-sm transition-colors"
              title={isCollapsed ? view.name : ''}
            >
              <Star className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{view.name}</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
