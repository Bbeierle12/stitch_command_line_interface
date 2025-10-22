import { useCallback, useEffect, useMemo, useState } from "react";
import { HashRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { TopHud } from "./components/TopHud";
import { LeftDock } from "./components/LeftDock";
import { SnapshotRail } from "./components/SnapshotRail";
import { BottomConsole } from "./components/BottomConsole";
import { InspectorPanel } from "./components/InspectorPanel";
import { MegaLens } from "./components/MegaLens";
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
import { backendApiService } from "./services/backendApiService";
import { electronService } from "./services/electronService";
import { usePolling, useKeyboardShortcut } from "./hooks/usePolling";
import { useLogStream } from "./hooks/useWebSocket";
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

function AppShell() {
  const navigate = useNavigate();
  const [timeMode, setTimeMode] = useState<"live" | "fixed">(config.ui.defaultTimeMode);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(config.ui.defaultPreviewMode);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notification, setNotification] = useState<string>("");
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('idle');

  // Real-time data polling with configurable intervals
  const isLive = timeMode === "live" && config.features.enablePolling;
  
  // Wrap fetch functions in useCallback to prevent infinite loops
  const fetchCiState = useCallback(async () => {
    try {
      return await backendApiService.getCiState();
    } catch {
      // fallback to mock
      return dataService.getCiState();
    }
  }, []);
  const fetchSecState = useCallback(async () => {
    try {
      return await backendApiService.getSecState();
    } catch {
      return dataService.getSecurityState();
    }
  }, []);
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const sys = await backendApiService.getSystemMetrics();
      const metrics = [
        { label: "CPU", value: `${sys.cpu.usage}%`, accent: "text-cyan" },
        { label: "RAM", value: `${Math.round((sys.memory.used / sys.memory.total) * 100)}%`, accent: "text-cyan" },
        { label: "Temp", value: `${sys.cpu.temperature}°C`, accent: sys.cpu.temperature > 75 ? "text-warn" : undefined },
        { label: "Battery", value: sys.battery.charging ? `AC / ${sys.battery.percentage}%` : `${sys.battery.percentage}%` },
      ];
      return metrics;
    } catch {
      return dataService.getSystemMetrics();
    }
  }, []);
  const fetchConsoleLogs = useCallback(async () => {
    try {
      const res = await backendApiService.getConsoleLogs(8);
      return res.logs.map(l => ({ id: l.id, tag: l.tag, message: l.message, ts: new Date(l.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }));
    } catch {
      return dataService.getConsoleLogs();
    }
  }, []);
  
  const ciState = usePolling(fetchCiState, config.polling.ci, isLive);
  const secState = usePolling(fetchSecState, config.polling.security, isLive);
  const systemMetrics = usePolling(fetchSystemMetrics, config.polling.system, isLive);
  const consoleLogs = usePolling(fetchConsoleLogs, config.polling.console, isLive);

  const fetchPreview = useCallback(async () => {
    try {
      return await backendApiService.getPreviewState(previewMode);
    } catch {
      return dataService.getPreviewState(previewMode);
    }
  }, [previewMode]);
  // Slow polling as fallback (WebSocket is primary in PreviewCard)
  const previewState = usePolling(fetchPreview, config.polling.preview, isLive);

  // Update build status based on CI state
  useEffect(() => {
    if (ciState?.build) {
      switch(ciState.build.status) {
        case 'running':
          setBuildStatus('building');
          break;
        case 'pass':
          setBuildStatus('success');
          break;
        case 'fail':
          setBuildStatus('error');
          break;
        default:
          setBuildStatus('idle');
      }
    }
  }, [ciState]);

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

  const handleLensNavigate = useCallback(
    (href: string) => {
      if (!href) return;
      if (href === "#/" || href === "#") {
        navigate("/");
        return true;
      }
      if (href.startsWith("#/")) {
        navigate(href.slice(1));
        return true;
      }
      return;
    },
    [navigate]
  );

  return (
    <div className="flex h-screen flex-col bg-ink text-white">
      {config.features.enableCommandPalette && (
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onExecute={handleCommand}
        />
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
        timeRangeLabel={timeMode === "live" ? "Live +/-15m" : "12:30 - 12:45"}
        onToggleMode={() =>
          setTimeMode((mode: "live" | "fixed"): "live" | "fixed" =>
            mode === "live" ? "fixed" : "live"
          )}
        onCommandPalette={() => setPaletteOpen(true)}
        projectName="stitch-cli"
        branch="main"
        buildStatus={buildStatus}
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
          <MegaLens onNavigate={handleLensNavigate} />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex flex-1 overflow-hidden">
              <Routes>
                <Route
                  path="/"
                  element={
                    <DashboardPage
                      previewState={previewState || previewSeeds[previewMode]}
                      ciState={ciState}
                      secState={secState}
                      systemMetrics={systemMetrics}
                      onPreviewModeChange={setPreviewMode}
                    />
                  }
                />
                <Route
                  path="/preview"
                  element={
                    <PreviewPage
                      previewState={previewState || previewSeeds[previewMode]}
                      onPreviewModeChange={setPreviewMode}
                    />
                  }
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
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
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
