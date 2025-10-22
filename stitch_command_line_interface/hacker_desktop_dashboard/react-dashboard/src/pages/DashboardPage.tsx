import { PreviewState, CiState, SecState } from "../types";

type Metric = {
  label: string;
  value: string;
  accent?: string;
};

interface DashboardPageProps {
  previewState: PreviewState;
  ciState: CiState | null;
  secState: SecState | null;
  systemMetrics: Metric[] | null;
  onPreviewModeChange: (mode: any) => void;
}

export function DashboardPage({
  previewState,
  ciState,
  secState,
  systemMetrics,
  onPreviewModeChange
}: DashboardPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
        {/* Welcome Section */}
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-white">
            Welcome to <span className="text-cyan">CyberOps Dashboard</span>
          </h1>
          <p className="text-lg text-white/70">
            Select a category from the sidebar to get started
          </p>
        </div>

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full max-w-5xl">
          <CategoryCard
            icon="📦"
            title="Build & Deploy"
            description="CI/CD pipeline, builds, and deployments"
            items={["Live Preview", "Build/Test Status"]}
          />
          <CategoryCard
            icon="🛡️"
            title="Security & Identity"
            description="Security posture and threat monitoring"
            items={["Security Posture", "Alerts & Threats"]}
          />
          <CategoryCard
            icon="💻"
            title="Workspace"
            description="Editor status and development tools"
            items={["Editor Status", "File Explorer"]}
          />
          <CategoryCard
            icon="🌐"
            title="Network & Traffic"
            description="Network monitoring and IDPS"
            items={["Network/IDPS", "Traffic Analysis"]}
          />
          <CategoryCard
            icon="🗺️"
            title="Intel & Atlas"
            description="System health and notifications"
            items={["System Health", "Notifications"]}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-4xl">
          <StatCard label="Active Services" value="12" color="cyan" />
          <StatCard label="Alerts" value="3" color="warn" />
          <StatCard label="System Health" value="98%" color="ops-green" />
          <StatCard label="Uptime" value="99.9%" color="cyan" />
        </div>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  icon: string;
  title: string;
  description: string;
  items: string[];
}

function CategoryCard({ icon, title, description, items }: CategoryCardProps) {
  return (
    <div className="bg-panel/60 border border-hairline rounded-lg p-5 hover:border-cyan/50 transition-all hover:bg-panel/80 cursor-pointer group">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan transition-colors">
        {title}
      </h3>
      <p className="text-sm text-white/60 mb-3">{description}</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-xs text-white/50 flex items-center gap-2">
            <span className="w-1 h-1 bg-cyan rounded-full"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClass = color === 'cyan' ? 'text-cyan' : 
                     color === 'warn' ? 'text-warn' : 
                     color === 'ops-green' ? 'text-ops-green' : 'text-white';
  
  return (
    <div className="bg-panel/60 border border-hairline rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${colorClass} mb-1`}>{value}</div>
      <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
    </div>
  );
}
