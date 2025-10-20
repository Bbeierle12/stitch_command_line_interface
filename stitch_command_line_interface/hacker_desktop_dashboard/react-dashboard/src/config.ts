// Dashboard configuration
// Modify these values to customize behavior without touching component code

export const config = {
  // Data refresh intervals (milliseconds)
  polling: {
    ci: 5000,          // Build & test status
    security: 8000,    // VPN, firewall, alerts
    system: 3000,      // CPU, RAM, temp
    console: 2000,     // Log tail
    preview: 1000      // HMR status
  },

  // Performance budgets (milliseconds)
  budgets: {
    paletteOpen: 100,
    hmrUpdate: 300,
    fullReload: 700,
    cliRestart: 800,
    cardReflow: 16
  },

  // Feature flags
  features: {
    enablePolling: true,
    enableCommandPalette: true,
    enableSnapshots: true,
    enableInspector: true,
    enableNotifications: true,
    enableKeyboardShortcuts: true
  },

  // UI preferences
  ui: {
    defaultTimeMode: "live" as "live" | "fixed",
    defaultPreviewMode: "browser" as "browser" | "cli" | "plots" | "tests" | "docs",
    notificationDuration: 3000, // ms
    consoleMaxLines: 100,
    snapshotRetention: 24 // hours
  },

  // Accessibility
  a11y: {
    enableFocusRings: true,
    enableLiveRegions: true,
    minimumContrastRatio: 4.5,
    reduceMotion: false // Override user preference (not recommended)
  },

  // Telemetry (opt-in only)
  telemetry: {
    enabled: false,
    endpoint: "/api/telemetry",
    sampleRate: 0.1 // 10% of sessions
  }
};

export type DashboardConfig = typeof config;
