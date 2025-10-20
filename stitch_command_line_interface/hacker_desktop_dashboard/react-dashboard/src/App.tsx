import { useCallback, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TopHud } from "./components/TopHud";
import { LeftDock } from "./components/LeftDock";
import { SnapshotRail } from "./components/SnapshotRail";
import { BottomConsole } from "./components/BottomConsole";
import { InspectorPanel } from "./components/InspectorPanel";
import { TabNavigation } from "./components/TabNavigation";
import { CommandPalette } from "./components/CommandPalette";
import { ElectronStatus } from "./components/ElectronStatus";
import { DashboardPage } from "./pages/DashboardPage";
import { PreviewPage } from "./pages/PreviewPage";
import { EditorPage } from "./pages/EditorPage";
import { CiPage } from "./pages/CiPage";
import { SecurityPage } from "./pages/SecurityPage";
import { SystemPage } from "./pages/SystemPage";
import { NetworkPage } from "./pages/NetworkPage";
import { InboxPage } from "./pages/InboxPage";
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
    <Router>
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
            <TabNavigation />
            <div className="flex flex-1 overflow-hidden">
              <main className="flex flex-1 overflow-hidden">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <DashboardPage
                        previewState={previewState}
                        ciState={ciState}
                        secState={secState}
                        systemMetrics={systemMetrics}
                        onPreviewModeChange={setPreviewMode}
                      />
                    }
                  />
                  <Route
                    path="/preview"
                    element={<PreviewPage previewState={previewState} onPreviewModeChange={setPreviewMode} />}
                  />
                  <Route path="/editor" element={<EditorPage />} />
                  <Route path="/ci" element={<CiPage ciState={ciState} />} />
                  <Route path="/security" element={<SecurityPage secState={secState} />} />
                  <Route path="/system" element={<SystemPage systemMetrics={systemMetrics} />} />
                  <Route path="/network" element={<NetworkPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                </Routes>
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
    </Router>
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
