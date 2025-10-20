import { CardShell } from "./CardShell";

const flows = [
  { id: "1", app: "node", dest: "api.internal", status: "allow" },
  { id: "2", app: "docker", dest: "registry", status: "watch" },
  { id: "3", app: "browser", dest: "unknown-hub", status: "block" }
];

export function NetworkCard() {
  return (
    <CardShell
      title="Network / IDPS"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Toggle VPN
          </button>
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Only untrusted Wi-Fi
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex h-32 items-center justify-center rounded border border-hairline/40 bg-ink/40 text-xs text-white/50">
          Live mini-graph placeholder
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-white/50">Flows</h4>
          <ul className="mt-2 space-y-2 text-xs">
            {flows.map((flow) => (
              <li
                key={flow.id}
                className="flex items-center justify-between rounded border border-hairline/40 bg-ink/40 px-3 py-2"
              >
                <span className="text-white/70">{flow.app} → {flow.dest}</span>
                <span
                  className={`rounded border px-2 py-0.5 uppercase tracking-[0.14em] ${
                    flow.status === "allow"
                      ? "border-ops-green text-ops-green"
                      : flow.status === "watch"
                      ? "border-warn text-warn"
                      : "border-danger text-danger"
                  }`}
                >
                  {flow.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CardShell>
  );
}
