type LogLine = {
  id: number;
  tag: string;
  message: string;
  ts: string;
};

type BottomConsoleProps = {
  logs: LogLine[];
};

export function BottomConsole({ logs }: BottomConsoleProps) {
  return (
    <footer className="border-t border-hairline bg-panel/80">
      <div className="flex h-40 flex-col">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/50">
          <span>Console Tail</span>
          <button className="rounded border border-transparent px-2 py-1 text-xs text-white/60 transition hover:border-cyan hover:text-cyan">
            Detach to inspector
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs text-white/80 scrollbar-thin">
          {logs.map((line) => (
            <div key={line.id} className="flex items-center gap-3 py-1">
              <span className="rounded border border-hairline px-2 py-0.5 text-[10px] tracking-[0.16em] text-white/50">
                {line.tag}
              </span>
              <span className="text-white/50">{line.ts}</span>
              <span className={line.tag === "ERROR" ? "text-danger" : line.tag === "WARN" ? "text-warn" : ""}>
                {line.message}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-hairline px-4 py-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">Input</span>
          <input
            type="text"
            placeholder="> run smoke-tests --dry"
            className="w-full rounded border border-hairline bg-transparent px-3 py-1 text-sm text-white/80 outline-none transition focus:border-cyan"
          />
          <button className="rounded border border-cyan px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan transition hover:bg-cyan/10">
            Send
          </button>
        </div>
      </div>
    </footer>
  );
}
