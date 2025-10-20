import { NavLink } from 'react-router-dom';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'preview', label: 'Preview', path: '/preview' },
  { id: 'editor', label: 'Editor Status', path: '/editor' },
  { id: 'ci', label: 'CI/CD', path: '/ci' },
  { id: 'security', label: 'Security', path: '/security' },
  { id: 'system', label: 'System', path: '/system' },
  { id: 'network', label: 'Network', path: '/network' },
  { id: 'inbox', label: 'Inbox', path: '/inbox' }
];

export function TabNavigation() {
  return (
    <div className="border-b border-cyan/20 bg-panel">
      <div className="flex space-x-1 px-4 py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cyan/20 text-cyan border border-cyan/50 shadow-glow'
                  : 'text-mute hover:text-cyan hover:bg-panel-hover border border-transparent'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
