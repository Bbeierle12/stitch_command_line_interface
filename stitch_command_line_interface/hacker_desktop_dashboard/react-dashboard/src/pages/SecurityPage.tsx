import { SecurityCard } from "../components/SecurityCard";
import { SecState } from "../types";

interface SecurityPageProps {
  secState: SecState | null;
}

export function SecurityPage({ secState }: SecurityPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">Security Center</h2>
        {secState ? (
          <div className="grid gap-4">
            <SecurityCard state={secState} />
            <div className="card-surface p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Security Logs</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-3 bg-ink/40 rounded border border-red-500/30">
                  <span className="text-red-400">[HIGH]</span>
                  <span className="text-white/70 ml-2">Quarantine hit: payload.exe - 30s ago</span>
                </div>
                <div className="p-3 bg-ink/40 rounded border border-yellow-500/30">
                  <span className="text-yellow-400">[MEDIUM]</span>
                  <span className="text-white/70 ml-2">New startup item: agent-helper - 9m ago</span>
                </div>
                <div className="p-3 bg-ink/40 rounded border border-cyan/30">
                  <span className="text-cyan">[LOW]</span>
                  <span className="text-white/70 ml-2">VPN handshake retried - 1m ago</span>
                </div>
                <div className="p-3 bg-ink/40 rounded border border-cyan/30">
                  <span className="text-cyan">[INFO]</span>
                  <span className="text-white/70 ml-2">Firewall rules updated - 15m ago</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LoadingSkeleton />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="card-surface h-64 animate-pulse">
      <div className="h-6 w-32 rounded bg-white/10"></div>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full rounded bg-white/5"></div>
        <div className="h-4 w-3/4 rounded bg-white/5"></div>
      </div>
    </div>
  );
}
