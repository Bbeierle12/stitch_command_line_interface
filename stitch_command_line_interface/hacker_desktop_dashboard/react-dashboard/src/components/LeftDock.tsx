import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FolderOpen, 
  GitBranch, 
  History, 
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Save,
  Star,
  Package,
  Shield,
  Monitor,
  Network,
  Map,
  Settings,
  type LucideIcon
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
  badge?: number;
  href?: string;
  children?: NavItem[];
  action?: string | (() => void);
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
    href: '/editor'
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
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    tooltip: 'Configure workspace, editor, and system (Ctrl+,)',
  }
];

const categoryItems: NavItem[] = [
  {
    id: 'build',
    label: 'Build & Deploy',
    icon: Package,
    tooltip: 'CI, previews, change planning',
    badge: 5
  },
  {
    id: 'security',
    label: 'Security & Identity',
    icon: Shield,
    tooltip: 'Threats, policies, incident drills',
    badge: 4
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: Monitor,
    tooltip: 'Editor, snippets, project setup',
    badge: 4
  },
  {
    id: 'network',
    label: 'Network & Traffic',
    icon: Network,
    tooltip: 'Ingress, telemetry, edge posture',
    badge: 4
  },
  {
    id: 'intel',
    label: 'Intel & Atlas',
    icon: Map,
    tooltip: 'Maps, saved sets, research dossiers',
    badge: 5
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    tooltip: 'Configure workspace, editor, and system settings',
    action: 'openSettings'
  }
];

export function LeftDock({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const location = useLocation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [savedViews] = useState<SavedView[]>([
    { id: 'view1', name: 'Debug Layout', icon: 'star' },
    { id: 'view2', name: 'Full Editor', icon: 'folder' }
  ]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
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
        const active = isActive(item.href);
     
          // Settings button - special handling
          if (item.id === 'settings') {
            return (
          <button
      key={item.id}
      onClick={() => onOpenSettings?.()}
        className={`
               w-full flex items-center gap-3 px-3 py-2.5
         transition-all duration-150 relative group
       ${active 
     ? 'bg-cyan/10 text-cyan border-l-2 border-cyan' 
 : 'text-white/70 hover:bg-hairline hover:text-white border-l-2 border-transparent'
           }
      `}
    aria-label={item.tooltip}
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
    }

          // Regular navigation items
  if (item.href) {
    return (
        <Link
           key={item.id}
                to={item.href}
         className={`
   w-full flex items-center gap-3 px-3 py-2.5
     transition-all duration-150 relative group
        ${active 
       ? 'bg-cyan/10 text-cyan border-l-2 border-cyan' 
  : 'text-white/70 hover:bg-hairline hover:text-white border-l-2 border-transparent'
      }
      `}
        aria-label={item.tooltip}
     aria-current={active ? 'page' : undefined}
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
</Link>
            );
       }

    return null;
        })}

        {/* Divider */}
        <div className="my-2 mx-3 border-t border-hairline" />

        {/* Category Navigation */}
        <div className="px-2">
          {!isCollapsed && (
     <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] px-2 py-2 font-semibold">
     Categories
      </div>
          )}
          {categoryItems.map((category) => {
const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;
            const isSettingsCategory = category.action === 'openSettings';
      
    return (
     <div key={category.id}>
 <button
       onClick={() => {
         if (isSettingsCategory) {
           onOpenSettings?.();
         } else {
           toggleCategory(category.id);
         }
       }}
   className={`
     w-full flex items-center gap-3 px-2 py-2.5 rounded
     transition-all duration-150 relative group
    ${isExpanded 
      ? 'bg-hairline text-white' 
    : 'text-white/70 hover:bg-hairline/50 hover:text-white'
              }
             `}
       aria-label={category.tooltip}
        title={isCollapsed ? category.label : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{category.label}</span>
                    {category.badge && (
                      <span className="bg-white/10 text-white/80 text-xs px-1.5 py-0.5 rounded font-medium">
                        {category.badge}
                      </span>
                    )}
                    {!isSettingsCategory && (
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? '' : '-rotate-90'
                        }`}
                      />
                    )}
                  </>
                )}               {isCollapsed && (
   <div className="
       absolute left-full ml-2 px-2 py-1 bg-panel border border-hairline
       text-xs rounded opacity-0 group-hover:opacity-100 
pointer-events-none transition-opacity whitespace-nowrap
      z-50 shadow-depth
          ">
      {category.label}
     {category.badge && ` (${category.badge} items)`}
  </div>
    )}
                </button>
    
                {/* Expandable content */}
  {isExpanded && !isCollapsed && !isSettingsCategory && (
    <div className="ml-8 mt-1 mb-2 space-y-1">
        <div className="text-xs text-white/50 px-2 py-1">
  {category.tooltip}
      </div>
     </div>
       )}
       </div>
  );
     })}
    </div>
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
