import { CardShell } from "./CardShell";

type Metric = {
  label: string;
  value: string;
  accent?: string;
};

type SystemCardProps = {
  metrics: Metric[];
};

export function SystemCard({ metrics }: SystemCardProps) {
  return (
    <CardShell
      title="System Health"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Performance
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Kill process
          </button>
        </div>
      }
    >
      <ul className="grid grid-cols-2 gap-3 text-sm text-white/70">
        {metrics.map((metric) => (
          <li key={metric.label} className="rounded border border-hairline/50 bg-ink/40 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">{metric.label}</p>
            <p className={`mt-2 text-lg font-semibold ${metric.accent ?? "text-white/90"}`}>{metric.value}</p>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
