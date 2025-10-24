import { PreviewCard } from "../components/PreviewCard";
import { PreviewState } from "../types";

interface PreviewPageProps {
  previewState: PreviewState;
  onPreviewModeChange: (mode: any) => void;
}

export function PreviewPage({ previewState, onPreviewModeChange }: PreviewPageProps) {
  return (
    <div className="h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">Live Preview</h2>
        <PreviewCard state={previewState} onModeChange={onPreviewModeChange} />
      </div>
    </div>
  );
}
