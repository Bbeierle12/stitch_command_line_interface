import { LucideIcon } from 'lucide-react';
import { ReactNode, memo } from 'react';

interface MetricCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  accent?: 'cyan' | 'green' | 'warn' | 'danger';
  loading?: boolean;
}

// Memoize MetricCard to prevent unnecessary re-renders
export const MetricCard = memo(({ title, icon: Icon, children, accent = 'cyan', loading = false }: MetricCardProps) => {
  const accentColors = {
    cyan: 'border-cyan text-cyan',
    green: 'border-ops-green text-ops-green',
    warn: 'border-warn text-warn',
    danger: 'border-danger text-danger',
  };

  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-hairline">
        {Icon && <Icon className={`w-5 h-5 ${accentColors[accent]}`} />}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
          {title}
        </h3>
      </div>
      
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-full rounded bg-white/5"></div>
          <div className="h-4 w-3/4 rounded bg-white/5"></div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

interface MetricRowProps {
  label: string;
  value: string | ReactNode;
  accent?: 'cyan' | 'green' | 'warn' | 'danger' | 'default';
}

// Memoize MetricRow for better performance
export const MetricRow = memo(({ label, value, accent = 'default' }: MetricRowProps) => {
  const accentColors = {
    cyan: 'text-cyan',
    green: 'text-ops-green',
    warn: 'text-warn',
    danger: 'text-danger',
    default: 'text-white/90',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/60">{label}</span>
      <span className={`text-sm font-medium ${accentColors[accent]}`}>
        {value}
      </span>
    </div>
  );
});

MetricRow.displayName = 'MetricRow';
