import { EditorStatusCard } from "../components/EditorStatusCard";

export function EditorPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan mb-4">Editor Status</h2>
        <EditorStatusCard
          currentFile="src/components/PreviewCard.tsx"
          branch="feature/live-preview"
          diagnostics={{ error: 2, warn: 5, info: 12 }}
          dirty
          recent={[
            { file: "src/App.tsx", delta: "2m" },
            { file: "src/components/NetworkCard.tsx", delta: "7m" },
            { file: "tailwind.config.js", delta: "12m" },
            { file: "src/types.ts", delta: "15m" },
            { file: "src/services/dataService.ts", delta: "18m" }
          ]}
        />
      </div>
    </div>
  );
}
