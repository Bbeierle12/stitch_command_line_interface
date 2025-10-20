import { CardShell } from "./CardShell";

type EditItem = {
  file: string;
  delta: string;
};

type EditorStatusProps = {
  currentFile: string;
  branch: string;
  diagnostics: { error: number; warn: number; info: number };
  dirty: boolean;
  recent: EditItem[];
};

export function EditorStatusCard({ currentFile, branch, diagnostics, dirty, recent }: EditorStatusProps) {
  return (
    <CardShell
      title="Editor Status"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Format
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Run file
          </button>
          <button className="rounded border border-cyan px-2 py-1 text-cyan transition hover:bg-cyan/10">
            Commit draft
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-white/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/90">{currentFile}</p>
            <p className="text-xs text-white/50">Branch {branch}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={dirty ? "text-warn" : "text-ops-green"}>{dirty ? "Dirty" : "Clean"}</span>
            <span className="rounded border border-hairline px-2 py-1">E {diagnostics.error}</span>
            <span className="rounded border border-hairline px-2 py-1">W {diagnostics.warn}</span>
            <span className="rounded border border-hairline px-2 py-1">I {diagnostics.info}</span>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-white/50">Recent edits</h4>
          <ul className="mt-2 space-y-2 text-xs">
            {recent.map((item) => (
              <li key={item.file} className="flex items-center justify-between rounded border border-hairline/50 bg-ink/40 px-3 py-2">
                <span className="text-white/70">{item.file}</span>
                <span className="text-white/50">{item.delta} ago</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CardShell>
  );
}
