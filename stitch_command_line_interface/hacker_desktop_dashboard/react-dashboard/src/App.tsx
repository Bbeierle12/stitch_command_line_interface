import { useCallback, useMemo, useState } from "react";
import { TopHud } from "./components/TopHud";
import { LeftDock } from "./components/LeftDock";
import { SnapshotRail } from "./components/SnapshotRail";
import { BottomConsole } from "./components/BottomConsole";
import { InspectorPanel } from "./components/InspectorPanel";
import { PreviewCard } from "./components/PreviewCard";
import { EditorStatusCard } from "./components/EditorStatusCard";
import { CiSummaryCard } from "./components/CiSummaryCard";
import { SecurityCard } from "./components/SecurityCard";
import { SystemCard } from "./components/SystemCard";
import { NetworkCard } from "./components/NetworkCard";
import { InboxCard } from "./components/InboxCard";
import { CommandPalette } from "./components/CommandPalette";
import { ElectronStatus } from "./components/ElectronStatus";
import { PreviewMode, PreviewState, CiState, SecState } from "./types";
import { dataService } from "./services/dataService";
import { electronService } from "./services/electronService";
import { usePolling, useKeyboardShortcut } from "./hooks/usePolling";
import { config } from "./config";

const previewSeeds: Record<PreviewMode, PreviewState> = {
  browser: {
    mode: "browser",
    url: "https://example.com",
    hmr: { lastMs: 142, ok: true }
  },
  cli: {
    mode: "cli",
    tail: {
      lines: [
        "> yarn dev",
        "⏳ Compiling modules...",
        "✅ Ready on http://localhost:5173"
      ],
      since: new Date().toISOString()
    },
    hmr: { lastMs: 198, ok: true }
  },
  plots: {
    mode: "plots",
    artifacts: ["artifact://latency-trend"],
    hmr: { lastMs: 310, ok: false }
  },
  tests: {
    mode: "tests",
    hmr: { lastMs: 245, ok: true }
  },
  docs: {
    mode: "docs",
    artifacts: ["docs://latest"],
    hmr: { lastMs: 220, ok: true }
  }
};

const ciSeed: CiState = {
  build: { durationMs: 4210, cacheHitPct: 82, status: "running" },
  tests: { pass: 162, fail: 3, skip: 4, flaky: 1, lastRunAt: "13:45" },
  logsRef: "ci/main#1426"
};

const securitySeed: SecState = {
  vpn: "on",
  firewall: "on",
  encryption: "on",
  alerts: [
    { id: "vpn", sev: "low", title: "VPN handshake retried", ageSec: 110 },
    { id: "start", sev: "med", title: "New startup item: agent-helper", ageSec: 540 },
    { id: "download", sev: "high", title: "Quarantine hit: payload.exe", ageSec: 30 }
  ],
  startupDiff: { added: ["agent-helper"], removed: [] }
};

export default function App() {
  const [timeMode, setTimeMode] = useState<"live" | "fixed">(config.ui.defaultTimeMode);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(config.ui.defaultPreviewMode);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notification, setNotification] = useState<string>("");

  // Real-time data polling with configurable intervals
  const isLive = timeMode === "live" && config.features.enablePolling;
  const ciState = usePolling(() => dataService.getCiState(), config.polling.ci, isLive);
  const secState = usePolling(() => dataService.getSecurityState(), config.polling.security, isLive);
  const systemMetrics = usePolling(() => dataService.getSystemMetrics(), config.polling.system, isLive);
  const consoleLogs = usePolling(() => dataService.getConsoleLogs(), config.polling.console, isLive);

  const previewState = useMemo(
    () => dataService.getPreviewState(previewMode),
    [previewMode]
  );

  const snapshots = useMemo(
    () => [
      { id: "s1", label: "13:02" },
      { id: "s2", label: "13:17" },
      { id: "s3", label: "13:43" },
      { id: "live", label: "●", isLive: true }
    ],
    []
  );

  const inspector = useMemo(
    () => ({
      title: "CI plan",
      summary: "LLM proposes rerunning flaky specs with --retry 2, followed by targeted lint fix.",
      details: [
        "ci.yml: bump retry count to 2",
        "package.json: add lint:fix script",
        "scripts/lint.ts: use incremental cache"
      ]
    }),
    []
  );

  // Keyboard shortcuts (conditionally enabled)
  if (config.features.enableKeyboardShortcuts) {
    useKeyboardShortcut(" ", () => config.features.enableCommandPalette && setPaletteOpen(true), { alt: true });
    useKeyboardShortcut("l", () =>
      setTimeMode((m: "live" | "fixed"): "live" | "fixed" => (m === "live" ? "fixed" : "live"))
    );
  }

  const handleCommand = useCallback(async (cmd: { id: string; label: string; risk: string }) => {
    if (config.features.enableNotifications) {
      setNotification(`Executing: ${cmd.label}`);
      setTimeout(() => setNotification(""), config.ui.notificationDuration);
    }
    
    console.log(`[Command] ${cmd.id}:`, cmd.label);
    
    // Execute via Electron if available
    if (electronService.isElectronApp()) {
      try {
        const result = await electronService.executeCommand(cmd);
        console.log('[Electron] Command result:', result);
        if (result.success && result.output) {
          console.log('[Electron] Output:', result.output);
        }
        if (result.error) {
          console.error('[Electron] Error:', result.error);
        }
      } catch (error) {
        console.error('[Electron] Failed to execute command:', error);
      }
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-ink text-white">
      {config.features.enableCommandPalette && (
        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} onExecute={handleCommand} />
      )}
      {notification && config.features.enableNotifications && (
        <div
          className="fixed top-20 right-8 z-30 rounded border border-cyan bg-panel px-4 py-2 text-sm text-cyan shadow-depth animate-pulse"
          role="status"
          aria-live="polite"
        >
          {notification}
        </div>
      )}
      <TopHud
        snapshotLabel={timeMode === "live" ? "Live" : "Snapshot 142"}
        timeMode={timeMode}
        timeRangeLabel={timeMode === "live" ? "Live ±15m" : "12:30 - 12:45"}
        onToggleMode={() =>
          setTimeMode((mode: "live" | "fixed"): "live" | "fixed" =>
            mode === "live" ? "fixed" : "live"
          )}
        onCommandPalette={() => setPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftDock />
        <div className="relative flex flex-1 flex-col">
          <SnapshotRail
            snapshots={snapshots}
            onSelect={(id) => {
              if (id === "live") setTimeMode("live");
              else setTimeMode("fixed");
            }}
          />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
                <div className="grid grid-cols-12 gap-4 pb-24">
                  <div className="col-span-12 xl:col-span-8">
                    <PreviewCard state={previewState} onModeChange={setPreviewMode} />
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
              <InspectorPanel
                title={inspector.title}
                summary={inspector.summary}
                details={inspector.details}
              />
            </main>
          </div>
          <BottomConsole logs={consoleLogs ?? []} />
        </div>
        <ElectronStatus />
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
