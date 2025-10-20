import { PreviewState, CiState, SecState } from "../types";

// Mock data service that simulates real-time updates
export class DataService {
  private listeners = new Set<() => void>();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // Preview updates
  getPreviewState(mode: PreviewState["mode"]): PreviewState {
    const base = { hmr: { lastMs: Math.floor(Math.random() * 300) + 100, ok: Math.random() > 0.1 } };
    
    switch (mode) {
      case "browser":
        return { mode, url: "http://localhost:5173", ...base };
      case "cli":
        return {
          mode,
          tail: {
            lines: [
              "> npm run dev",
              "⏳ Compiling...",
              `✅ Ready on http://localhost:5173 [${new Date().toLocaleTimeString()}]`,
              "HMR connected"
            ],
            since: new Date().toISOString()
          },
          ...base
        };
      case "plots":
        return { mode, artifacts: ["artifact://latency-p99"], ...base };
      case "tests":
        return { mode, ...base };
      case "docs":
        return { mode, artifacts: ["docs://api-reference"], ...base };
    }
  }

  // CI state with random fluctuations
  getCiState(): CiState {
    const statuses: CiState["build"]["status"][] = ["pass", "fail", "running"];
    return {
      build: {
        durationMs: Math.floor(Math.random() * 3000) + 2000,
        cacheHitPct: Math.floor(Math.random() * 30) + 70,
        status: statuses[Math.floor(Math.random() * statuses.length)]
      },
      tests: {
        pass: Math.floor(Math.random() * 50) + 150,
        fail: Math.floor(Math.random() * 5),
        skip: Math.floor(Math.random() * 10),
        flaky: Math.floor(Math.random() * 3),
        lastRunAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      },
      logsRef: `ci/main#${Math.floor(Math.random() * 1000) + 1400}`
    };
  }

  // Security state
  getSecurityState(): SecState {
    const alerts = [
      { id: "vpn", sev: "low" as const, title: "VPN reconnected successfully", ageSec: 120 },
      { id: "startup", sev: "med" as const, title: "New launch agent detected", ageSec: 450 },
      { id: "quarantine", sev: "high" as const, title: "Suspicious binary quarantined", ageSec: 60 }
    ];

    return {
      vpn: Math.random() > 0.1 ? "on" : "off",
      firewall: "on",
      encryption: "on",
      alerts: alerts.filter(() => Math.random() > 0.3),
      startupDiff: Math.random() > 0.7 ? { added: ["com.unknown.agent"], removed: [] } : undefined
    };
  }

  // System metrics
  getSystemMetrics() {
    return [
      { label: "CPU", value: `${Math.floor(Math.random() * 40) + 20}%`, accent: "text-cyan" },
      { label: "RAM", value: `${Math.floor(Math.random() * 30) + 50}%`, accent: "text-cyan" },
      { label: "Temp", value: `${Math.floor(Math.random() * 20) + 55}°C`, accent: Math.random() > 0.7 ? "text-warn" : undefined },
      { label: "Battery", value: Math.random() > 0.5 ? `AC / ${Math.floor(Math.random() * 20) + 80}%` : `${Math.floor(Math.random() * 30) + 40}%` }
    ];
  }

  // Network flows
  getNetworkFlows() {
    const apps = ["node", "docker", "chrome", "vscode", "curl"];
    const dests = ["api.internal", "registry.hub", "cdn.jsdelivr.net", "github.com", "unknown-host"];
    const statuses: ("allow" | "watch" | "block")[] = ["allow", "allow", "allow", "watch", "block"];

    return Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      app: apps[i % apps.length],
      dest: dests[i % dests.length],
      status: statuses[i % statuses.length]
    }));
  }

  // Console logs
  getConsoleLogs() {
    const tags = ["INFO", "WARN", "ERROR"];
    const messages = [
      "Dev server ready on http://localhost:5173",
      "HMR update detected, reloading",
      "Three slow tests detected (>= 1200 ms)",
      "VPN heartbeat stalled, retrying",
      "File watcher limit reached, consider increasing",
      "Build completed in 2.4s"
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      tag: tags[Math.floor(Math.random() * tags.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      ts: new Date(Date.now() - Math.random() * 600000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }));
  }
}

export const dataService = new DataService();
