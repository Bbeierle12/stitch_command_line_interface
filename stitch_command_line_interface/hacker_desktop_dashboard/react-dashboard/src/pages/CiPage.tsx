import { CiSummaryCard } from "../components/CiSummaryCard";
import { CiState } from "../types";

interface CiPageProps {
  ciState: CiState | null;
}

export function CiPage({ ciState }: CiPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">CI/CD Pipeline</h2>
        {ciState ? (
          <div className="grid gap-4">
            <CiSummaryCard state={ciState} />
            <div className="card-surface p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Pipeline History</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-ink/40 rounded border border-hairline/50">
                  <span className="text-white/70">Build #1426</span>
                  <span className="text-cyan">Running</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-ink/40 rounded border border-hairline/50">
                  <span className="text-white/70">Build #1425</span>
                  <span className="text-green-400">Passed</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-ink/40 rounded border border-hairline/50">
                  <span className="text-white/70">Build #1424</span>
                  <span className="text-red-400">Failed</span>
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
