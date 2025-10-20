import { SecState } from "../types";
import { CardShell } from "./CardShell";

type SecurityCardProps = {
  state: SecState;
};

export function SecurityCard({ state }: SecurityCardProps) {
  return (
    <CardShell
      title="Security Posture"
      actions={
        <div className="flex items-center gap-2 text-xs">
          <button className="rounded border border-hairline px-2 py-1 text-white/70 transition hover:border-cyan hover:text-cyan">
            Run checks
          </button>
          <button className="rounded border border-danger px-2 py-1 text-danger transition hover:bg-danger/10">
            Panic
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-white/70">
        <div className="flex gap-3">
          <StatusPill label="VPN" active={state.vpn === "on"} />
          <StatusPill label="Firewall" active={state.firewall === "on"} />
          <StatusPill label="Encryption" active={state.encryption === "on"} />
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] text-white/50">Alerts</h4>
          <ul className="mt-2 space-y-2 text-xs">
            {state.alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-center justify-between rounded border border-hairline/40 bg-ink/40 px-3 py-2"
              >
                <span className={alert.sev === "high" ? "text-danger" : alert.sev === "med" ? "text-warn" : "text-white/70"}>
                  {alert.title}
                </span>
                <span className="text-white/40">{Math.round(alert.ageSec / 60)}m</span>
              </li>
            ))}
          </ul>
        </div>
        {state.startupDiff && (
          <div className="rounded border border-hairline/40 bg-ink/40 p-3 text-xs">
            <p className="text-white/50">New startup items:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-white/70">
              {state.startupDiff.added.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CardShell>
  );
}

type StatusPillProps = {
  label: string;
  active: boolean;
};

function StatusPill({ label, active }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-3 py-1 text-xs uppercase tracking-[0.18em] transition ${
        active ? "border border-ops-green text-ops-green" : "border border-hairline text-white/40"
      }`}
    >
      {label}
    </span>
  );
}
