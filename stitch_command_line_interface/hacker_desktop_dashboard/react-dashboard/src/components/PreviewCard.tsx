import { PreviewState, PreviewMode } from "../types";
import { CardShell } from "./CardShell";
import { usePreviewStream } from "../hooks/useWebSocket";

const modeLabels: Record<PreviewMode, string> = {
  browser: "Browser",
  cli: "CLI",
  plots: "Plots",
  tests: "Tests",
  docs: "Docs"
};

type PreviewProps = {
  state: PreviewState;
  onModeChange: (mode: PreviewMode) => void;
};

export function PreviewCard({ state, onModeChange }: PreviewProps) {
  // Use WebSocket for real-time preview updates
  const { iframeKey, buildStatus, isConnected } = usePreviewStream();
  
  // Merge WebSocket build status with state
  const effectiveBuildStatus = buildStatus !== 'idle' ? buildStatus : state.buildStatus;
  const hmrOk = effectiveBuildStatus === 'ready' || state.hmr.ok;
  
  return (
    <CardShell
      title="Live Preview"
      actions={
        <div className="flex items-center gap-2">
          <button className="rounded border border-hairline px-2 py-1 text-xs text-white/70 transition-all duration-150 ease-glide hover:border-cyan hover:text-cyan hover:scale-105">
            Restart
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-xs text-white/70 transition-all duration-150 ease-glide hover:border-cyan hover:text-cyan hover:scale-105">
            Explain change
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-xs">
          {(Object.keys(modeLabels) as PreviewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`rounded px-3 py-1 transition ${
                state.mode === mode
                  ? "border border-cyan bg-cyan/10 text-cyan"
                  : "border border-transparent text-white/60 hover:border-hairline hover:text-white"
              }`}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>
        <div className="relative flex flex-1 items-center justify-center rounded border border-hairline bg-ink/60 p-6">
          {state.mode === "browser" && state.url ? (
            <iframe 
              key={iframeKey}
              title="preview" 
              src={state.url} 
              className="h-full w-full rounded border border-hairline"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : state.mode === "cli" && state.tail ? (
            <pre className="h-full w-full overflow-auto bg-black/60 p-4 font-mono text-xs text-ops-green scrollbar-thin">
              {state.tail.lines.join("\n")}
            </pre>
          ) : state.mode === "plots" && state.artifacts ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
              Plot artifact: {state.artifacts[0]}
            </div>
          ) : state.mode === "tests" ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-warn">
              3 failing specs. Review in inspector.
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
              Documentation preview coming soon.
            </div>
          )}
          <div className="absolute right-4 top-4 flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                effectiveBuildStatus === 'compiling' 
                  ? "bg-yellow-500 animate-pulse" 
                  : hmrOk 
                  ? "bg-ops-green animate-pulse" 
                  : "bg-warn"
              }`}
              title={isConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
            ></span>
            <span className="text-white/60">
              HMR {
                effectiveBuildStatus === 'compiling' ? 'building' :
                effectiveBuildStatus === 'error' ? 'error' :
                hmrOk ? "stable" : "degraded"
              } · {state.hmr.lastMs} ms
              {!isConnected && ' (offline)'}
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
