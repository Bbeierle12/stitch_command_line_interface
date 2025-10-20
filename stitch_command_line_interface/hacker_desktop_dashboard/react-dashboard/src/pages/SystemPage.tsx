import { SystemCard } from "../components/SystemCard";

type Metric = {
  label: string;
  value: string;
  accent?: string;
};

interface SystemPageProps {
  systemMetrics: Metric[] | null;
}

export function SystemPage({ systemMetrics }: SystemPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">System Health</h2>
        {systemMetrics ? (
          <div className="grid gap-4">
            <SystemCard metrics={systemMetrics} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-surface p-4">
                <h3 className="text-lg font-semibold text-white mb-3">CPU Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Core 1</span>
                    <span className="text-cyan">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Core 2</span>
                    <span className="text-cyan">38%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Core 3</span>
                    <span className="text-cyan">52%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Core 4</span>
                    <span className="text-cyan">41%</span>
                  </div>
                </div>
              </div>
              <div className="card-surface p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Memory Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Used</span>
                    <span className="text-cyan">8.2 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Cached</span>
                    <span className="text-cyan">4.1 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Available</span>
                    <span className="text-green-400">7.8 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">Total</span>
                    <span className="text-white/90">16 GB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-surface p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Top Processes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-hairline/50">
                    <tr>
                      <th className="text-left py-2 text-white/50">Process</th>
                      <th className="text-right py-2 text-white/50">CPU %</th>
                      <th className="text-right py-2 text-white/50">Memory</th>
                      <th className="text-right py-2 text-white/50">PID</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/70">
                    <tr className="border-b border-hairline/30">
                      <td className="py-2">chrome.exe</td>
                      <td className="text-right">12.3%</td>
                      <td className="text-right">512 MB</td>
                      <td className="text-right">1234</td>
                    </tr>
                    <tr className="border-b border-hairline/30">
                      <td className="py-2">node.exe</td>
                      <td className="text-right">8.7%</td>
                      <td className="text-right">256 MB</td>
                      <td className="text-right">5678</td>
                    </tr>
                    <tr className="border-b border-hairline/30">
                      <td className="py-2">electron.exe</td>
                      <td className="text-right">6.2%</td>
                      <td className="text-right">384 MB</td>
                      <td className="text-right">9012</td>
                    </tr>
                  </tbody>
                </table>
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
