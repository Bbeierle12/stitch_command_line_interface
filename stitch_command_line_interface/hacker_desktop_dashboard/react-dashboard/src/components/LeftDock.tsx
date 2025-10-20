const navItems = [
  { id: "sources", label: "Sources" },
  { id: "pipelines", label: "Pipelines" },
  { id: "snapshots", label: "Snapshots" },
  { id: "tasks", label: "Tasks" }
];

export function LeftDock() {
  return (
    <aside className="flex w-72 flex-col border-r border-hairline bg-panel/60">
      <div className="border-b border-hairline px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/60">
        Intel Rail
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-thin">
        {navItems.map((item) => (
          <button
            key={item.id}
            className="w-full rounded border border-transparent px-3 py-2 text-left text-sm text-white/70 transition hover:border-cyan hover:text-white"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="border-t border-hairline p-4 text-xs text-white/40">Saved views land here.</div>
    </aside>
  );
}
