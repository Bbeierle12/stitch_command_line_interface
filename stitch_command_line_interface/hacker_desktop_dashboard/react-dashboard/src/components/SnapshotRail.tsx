type Snapshot = {
  id: string;
  label: string;
  isLive?: boolean;
};

type SnapshotRailProps = {
  snapshots: Snapshot[];
  onSelect: (id: string) => void;
};

export function SnapshotRail({ snapshots, onSelect }: SnapshotRailProps) {
  return (
    <aside className="fixed right-4 top-16 z-10 flex h-[calc(100vh-4rem)] w-12 flex-col items-center justify-between rounded-full border border-hairline bg-panel/80 py-6">
      {snapshots.map((snap) => (
        <button
          key={snap.id}
          onClick={() => onSelect(snap.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] transition ${
            snap.isLive
              ? "border border-ops-green bg-ops-green/10 text-ops-green"
              : "border border-transparent text-white/60 hover:border-cyan hover:text-cyan"
          }`}
          title={snap.isLive ? "Live" : `Snapshot ${snap.label}`}
        >
          {snap.label}
        </button>
      ))}
    </aside>
  );
}
