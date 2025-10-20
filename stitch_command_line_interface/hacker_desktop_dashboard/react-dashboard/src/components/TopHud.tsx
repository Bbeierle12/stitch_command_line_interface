type TimeWindowMode = "live" | "fixed";

export type HUDProps = {
  snapshotLabel: string;
  timeMode: TimeWindowMode;
  timeRangeLabel: string;
  onToggleMode: () => void;
  onCommandPalette: () => void;
};

export function TopHud({ snapshotLabel, timeMode, timeRangeLabel, onToggleMode, onCommandPalette }: HUDProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-hairline bg-ink/95 px-4 backdrop-blur" role="banner">
      <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-white/70">
        <span className="rounded border border-hairline px-2 py-1 text-white/80" aria-label="Environment">Blacksite-Alpha</span>
        <span className="text-ops-green" aria-live="polite" aria-label="Current snapshot">{snapshotLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMode}
          className="rounded border border-hairline px-3 py-1 text-xs font-medium text-white/80 transition hover:border-cyan hover:text-cyan focus:outline-none focus:ring-2 focus:ring-cyan"
          aria-label={`Toggle time mode, currently ${timeMode}`}
        >
          {timeMode === "live" ? "Following live" : "View fixed"}
        </button>
        <div className="flex h-9 w-80 items-center gap-3 rounded border border-hairline bg-panel px-3">
          <input type="range" min={0} max={100} defaultValue={100} className="w-full accent-cyan" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">{timeRangeLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
          Mic
        </button>
        <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
          VPN
        </button>
        <button
          onClick={onCommandPalette}
          className="rounded border border-cyan px-2 py-1 text-cyan font-medium transition hover:bg-cyan/10 focus:outline-none focus:ring-2 focus:ring-cyan"
          aria-label="Open command palette (Alt + Space)"
          aria-keyshortcuts="Alt+Space"
        >
          Command
        </button>
      </div>
    </header>
  );
}
