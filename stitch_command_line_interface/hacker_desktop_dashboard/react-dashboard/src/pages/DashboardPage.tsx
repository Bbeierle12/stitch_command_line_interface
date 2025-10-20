import { PreviewCard } from "../components/PreviewCard";
import { EditorStatusCard } from "../components/EditorStatusCard";
import { CiSummaryCard } from "../components/CiSummaryCard";
import { SecurityCard } from "../components/SecurityCard";
import { SystemCard } from "../components/SystemCard";
import { NetworkCard } from "../components/NetworkCard";
import { InboxCard } from "../components/InboxCard";
import { PreviewState, CiState, SecState } from "../types";

type Metric = {
  label: string;
  value: string;
  accent?: string;
};

interface DashboardPageProps {
  previewState: PreviewState;
  ciState: CiState | null;
  secState: SecState | null;
  systemMetrics: Metric[] | null;
  onPreviewModeChange: (mode: any) => void;
}

export function DashboardPage({
  previewState,
  ciState,
  secState,
  systemMetrics,
  onPreviewModeChange
}: DashboardPageProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="grid grid-cols-12 gap-4 pb-24">
        <div className="col-span-12 xl:col-span-8">
          <PreviewCard state={previewState} onModeChange={onPreviewModeChange} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <EditorStatusCard
            currentFile="src/components/PreviewCard.tsx"
            branch="feature/live-preview"
            diagnostics={{ error: 2, warn: 5, info: 12 }}
            dirty
            recent={[
              { file: "src/App.tsx", delta: "2m" },
              { file: "src/components/NetworkCard.tsx", delta: "7m" },
              { file: "tailwind.config.js", delta: "12m" }
            ]}
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          {ciState ? <CiSummaryCard state={ciState} /> : <LoadingSkeleton />}
        </div>
        <div className="col-span-12 lg:col-span-6">
          {secState ? <SecurityCard state={secState} /> : <LoadingSkeleton />}
        </div>
        <div className="col-span-12 lg:col-span-4">
          {systemMetrics ? <SystemCard metrics={systemMetrics} /> : <LoadingSkeleton />}
        </div>
        <div className="col-span-12 lg:col-span-8">
          <NetworkCard />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <InboxCard />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="card-surface h-full animate-pulse">
      <div className="h-6 w-32 rounded bg-white/10"></div>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full rounded bg-white/5"></div>
        <div className="h-4 w-3/4 rounded bg-white/5"></div>
      </div>
    </div>
  );
}
