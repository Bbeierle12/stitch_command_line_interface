type InspectorProps = {
  title: string;
  summary: string;
  details: string[];
};

export function InspectorPanel({ title, summary, details }: InspectorProps) {
  return (
    <aside className="flex w-96 flex-col border-l border-hairline bg-panel/70 backdrop-blur">
      <div className="border-b border-hairline px-4 py-3">
        <h3 className="text-xs uppercase tracking-[0.18em] text-white/60">Inspector</h3>
        <p className="mt-2 text-sm font-medium text-white/80">{title}</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm text-white/70 scrollbar-thin">
        <p>{summary}</p>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-white/50">Diff Summary</h4>
          <ul className="mt-2 space-y-2 text-xs">
            {details.map((item, idx) => (
              <li key={idx} className="rounded border border-hairline/50 bg-ink/40 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-white/50">Explain</h4>
          <div className="mt-2 rounded border border-cyan/60 bg-cyan/10 p-3 text-xs text-cyan">
            LLM: "No risky actions detected. Proposed plan queued."
          </div>
        </div>
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <button className="w-full rounded border border-cyan px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan transition hover:bg-cyan/10">
          Approve plan
        </button>
      </div>
    </aside>
  );
}
