import { CiState } from "../types";
import { CardShell } from "./CardShell";

type CiSummaryProps = {
  state: CiState;
};

export function CiSummaryCard({ state }: CiSummaryProps) {
  return (
    <CardShell
      title="Build & Test"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Run tests
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Propose fix
          </button>
        </div>
      }
    >
      <div className="grid h-full grid-cols-2 gap-4 text-sm text-white/70">
        <div className="rounded border border-hairline/60 bg-ink/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Build</p>
          <p className="mt-2 text-2xl font-semibold text-white/90">
            {state.build.durationMs} ms
          </p>
          <p className="text-xs text-white/50">Cache hit {state.build.cacheHitPct}%</p>
          <span
            className={`mt-3 inline-flex items-center rounded px-2 py-1 text-xs uppercase tracking-[0.16em] ${
              state.build.status === "pass"
                ? "border border-ops-green text-ops-green"
                : state.build.status === "running"
                ? "border border-warn text-warn"
                : "border border-danger text-danger"
            }`}
          >
            {state.build.status}
          </span>
        </div>
        <div className="rounded border border-hairline/60 bg-ink/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Tests</p>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-semibold text-ops-green">{state.tests.pass}</div>
            <div className="text-sm text-danger">{state.tests.fail} fail</div>
            <div className="text-sm text-warn">{state.tests.flaky} flaky</div>
          </div>
          <p className="mt-2 text-xs text-white/50">Last run {state.tests.lastRunAt}</p>
        </div>
        <div className="col-span-2 rounded border border-hairline/60 bg-ink/40 p-4 text-xs">
          <p className="text-white/50">Timeline scrub to replay previous runs.</p>
          <p className="mt-2 font-mono text-white/60">logs://{state.logsRef}</p>
        </div>
      </div>
    </CardShell>
  );
}
