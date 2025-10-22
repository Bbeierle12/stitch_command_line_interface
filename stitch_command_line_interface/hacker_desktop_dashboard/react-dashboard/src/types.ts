export type PreviewMode = "browser" | "cli" | "plots" | "tests" | "docs";

export type BuildStatus = "idle" | "compiling" | "ready" | "error";

export type PreviewState = {
  mode: PreviewMode;
  url?: string;
  tail?: { lines: string[]; since: string };
  artifacts?: string[];
  hmr: { lastMs: number; ok: boolean };
  buildStatus?: BuildStatus;
  lastBuildTime?: string;
};

export type PreviewUpdateEvent = {
  url: string;
  hmr: { lastMs: number; ok: boolean };
  timestamp: string;
};

export type PreviewBuildEvent = {
  timestamp: string;
  status: BuildStatus;
  durationMs?: number;
  url?: string;
};

export type FileChangeEvent = {
  changeType: 'add' | 'change' | 'unlink';
  files: string[];
  timestamp: string;
  count: number;
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

/**
 * Content taxonomy primitives that drive the Mega-Lens navigation model.
 * Mirrors the proposed data model from the Mega-Lens plan.
 */
export type ContentPage = {
  id: string;
  slug: string;
  title: string;
  section: string;
  subSection?: string;
  audience: string[];
  topic: string[];
  format: string;
  readMinutes: number;
  updatedAt: string;
  popularityScore: number;
};

export type LensFacetKey = "audience" | "topic" | "format" | "readTime" | "updatedAt";

export type LensFacetOption = {
  value: string;
  label: string;
  count: number;
  description?: string;
  isActive?: boolean;
};

export type LensFacetGroup = {
  key: LensFacetKey;
  title: string;
  type: "multi" | "single";
  options: LensFacetOption[];
  helpText?: string;
  liveRegionLabel?: string;
};

export type LensFilterState = Partial<Record<LensFacetKey, string[]>>;

export type MegaNavItem = {
  id: string;
  label: string;
  description?: string;
  href: string;
  format: string;
  audience: string[];
  updatedAt: string;
  readMinutes: number;
  badges?: { tone: "neutral" | "info" | "warn"; label: string }[];
};

export type MegaNavGroup = {
  id: string;
  title: string;
  items: MegaNavItem[];
};

export type MegaNavPreview = {
  heading: string;
  summary?: string;
  items: { id: string; label: string; href: string; meta?: string }[];
};

export type MegaNavSection = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  totalItems: number;
  groups: MegaNavGroup[];
  preview: MegaNavPreview;
};
