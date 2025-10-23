import { LiveCodeEditor } from "../components/LiveCodeEditor";
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
    <div className="flex-1 overflow-hidden">
      <LiveCodeEditor />
    </div>
  );
}
