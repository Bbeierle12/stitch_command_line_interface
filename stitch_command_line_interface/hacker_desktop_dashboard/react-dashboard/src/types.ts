export type PreviewMode = "browser" | "cli" | "plots" | "tests" | "docs";

export type PreviewState = {
  mode: PreviewMode;
  url?: string;
  tail?: { lines: string[]; since: string };
  artifacts?: string[];
  hmr: { lastMs: number; ok: boolean };
};

export type CiState = {
  build: { durationMs: number; cacheHitPct: number; status: "pass" | "fail" | "running" };
  tests: { pass: number; fail: number; skip: number; flaky: number; lastRunAt: string };
  logsRef: string;
};

export type SecState = {
  vpn: "on" | "off";
  firewall: "on" | "off";
  encryption: "on" | "off";
  alerts: { id: string; sev: "low" | "med" | "high"; title: string; ageSec: number }[];
  startupDiff?: { added: string[]; removed: string[] };
};

export type DashboardView = {
  id: string;
  name: string;
  layout: CardPlacement[];
  timeWindow: { mode: "live" | "fixed"; from?: string; to?: string };
  filters?: Record<string, unknown>;
};

export type CardPlacement = {
  id: string;
  type: CardType;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
};

export type CardType = "preview" | "editor" | "ci" | "security" | "system" | "network" | "inbox";
