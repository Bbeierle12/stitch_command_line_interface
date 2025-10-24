// Settings type definitions and schema

export type SettingScope = 'global' | 'workspace' | 'session';
export type RiskLevel = 'low' | 'med' | 'high';
export type PreviewMode = 'browser' | 'cli' | 'plots' | 'tests' | 'docs';
export type SandboxLevel = 'strict' | 'internal-only' | 'full';
export type ExecutionBackend = 'electron-local' | 'container' | 'remote';

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'path';
  defaultValue: any;
  scope: SettingScope;
  risk: RiskLevel;
  requiresConfirm?: boolean;
  options?: { value: any; label: string }[];
  validation?: (value: any) => boolean | string;
}

export interface SettingsProfile {
  id: string;
  name: string;
  description: string;
  settings: Record<string, any>;
  isBuiltIn?: boolean;
}

export interface WorkspaceSettings {
  // 1) Workspace
  projectRoots: string[];
  sourceDir: string;
  buildOutputDir: string;
  artifactsDir: string;
  workspaceCacheDir: string;
  trustedPaths: string[];
  safeMode: boolean;

  // 2) Editor
  formatOnSave: boolean;
  formatProvider: 'prettier' | 'eslint' | 'none';
  diagnosticsDisplay: 'inline' | 'panel' | 'both';
  diagnosticsSeverity: 'error' | 'warning' | 'info';
  autocompleteDebounce: number;
  maxSuggestions: number;
  inlayHints: boolean;
  tabSize: number;
  softTabs: boolean;
  trimTrailing: boolean;
  fileWatcherLimit: number;
  fileWatcherDebounce: number;

  // 3) Languages & Tooling
  languageServers: Record<string, boolean>;
  typeCheckingStrict: boolean;
  incrementalBuild: boolean;
  allowLLMCodeActions: boolean;
  llmRequireConfirm: boolean;

  // 4) Live Preview / HMR
  defaultPreviewMode: PreviewMode;
  hmrTimeout: number;
  autoReloadOnCrash: boolean;
  autoOpenDevServer: boolean;
  devServerPortStart: number;
  devServerPortEnd: number;
  sandboxLevel: SandboxLevel;
  blockThirdPartyIframes: boolean;

  // 5) Run & Execution
  executionBackend: ExecutionBackend;
  cpuLimit: number; // percentage
  memoryLimit: number; // MB
  maxProcessRuntime: number; // seconds
  outputTruncation: number; // bytes
  workingDir: string;
  networkAccess: 'off' | 'internal-only' | 'full';
  fileWriteRestrict: 'tmp-only' | 'workspace-only' | 'unrestricted';

  // 6) CI / Build
  ciProvider: 'local' | 'github-actions' | 'custom';
  ciAutoRetryCount: number;
  ciQuarantineFlaky: boolean;
  cacheEnabled: boolean;
  ciCacheDir: string;
  cacheRemoteUrl: string;
  ciTrigger: 'on-save' | 'on-commit' | 'manual';
  artifactRetentionDays: number;
  artifactEncryption: boolean;

  // 7) Tests
  testRunner: 'jest' | 'vitest' | 'custom';
  testDiscoveryPattern: string;
  testWatchMode: boolean;
  testWatchDebounce: number;
  coverageThreshold: number;
  snapshotUpdatePolicy: 'prompt' | 'never' | 'ci-only';

  // 8) Logs & Console
  logSources: string[];
  logLevels: ('info' | 'warn' | 'error')[];
  logFilterRegex: string;
  logRetainSessions: number;
  logRedactSecrets: boolean;
  logTimestampFormat: 'relative' | 'absolute';
  logAnsiColors: boolean;

  // 9) Security & Privacy
  vpnRequired: boolean;
  firewallEnabled: boolean;
  encryptionEnabled: boolean;
  secretRedaction: boolean;
  commandRiskBanner: boolean;
  panicModeActions: string[];
  airGapMode: boolean;

  // 10) Network & Proxy
  proxyMode: 'system' | 'custom' | 'none';
  proxyUrl: string;
  hostAllowlist: string[];
  hostDenylist: string[];
  telemetryEnabled: boolean;

  // 11) LLM & Automation
  llmProvider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'self-hosted' | 'none';
  llmModel: string;
  llmTokenBudget: number;
  llmStreaming: boolean;
  llmContextMaxFiles: number;
  llmContextMaxLines: number;
  llmExcludeSecrets: boolean;
  llmApplyPolicy: 'require-approval' | 'auto-low-risk' | 'never-auto';
  ollamaUrl?: string;

  // 12) Inspector Panel
  inspectorAutoOpen: string[]; // triggers: 'test-fail', 'hmr-crash', 'error', 'save'
  inspectorPlanStyle: 'terse' | 'verbose';
  inspectorCollapseLLM: boolean;
  inspectorRiskGating: boolean;
  inspectorAuditEnabled: boolean;

  // 13) Snapshots & Time Travel
  snapshotCadence: 'manual' | 'on-save' | 'timed';
  snapshotInterval: number; // minutes
  snapshotMaxCount: number;
  snapshotPruning: 'fifo' | 'lru';

  // 14) Appearance & Layout
  theme: 'dark' | 'light' | 'high-contrast';
  accentColor: string;
  density: 'compact' | 'comfortable';
  codeFont: string;
  codeFontSize: number;
  uiFont: string;
  uiFontSize: number;
  ligatures: boolean;

  // 15) Accessibility
  reduceMotion: boolean;
  disablePulse: boolean;
  screenReaderVerbosity: 'low' | 'medium' | 'high';
  focusRingStyle: 'default' | 'thick' | 'high-contrast';
  minContrast: number;

  // 16) Notifications
  notificationChannels: ('toast' | 'sound' | 'os')[];
  notificationEvents: string[];
  quietHoursStart: string; // HH:MM
  quietHoursEnd: string; // HH:MM

  // 17) Integrations
  vcsDefaultBranch: string;
  vcsSignOff: boolean;
  vcsGpgSigning: boolean;
  issueTrackerUrl: string;
  issueTrackerProject: string;
  webhookUrl: string;

  // 18) Performance
  pollingIntervals: Record<string, number>; // subsystem -> ms
  preloadLanguageServers: boolean;
  cacheTTL: number;
  enableProfiling: boolean;

  // 19) Shortcuts & Input
  commandPaletteHotkey: string;
  customBindings: Record<string, string>;

  // 20) Data & Telemetry
  crashReportsEnabled: boolean;
  usageAnalytics: boolean;

  // 21) Admin & Advanced
  policyLocks: string[]; // locked setting keys
  roleBasedAccess: boolean;
  featureFlags: Record<string, boolean>;
  developerMode: boolean;
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  // 1) Workspace
  projectRoots: [],
  sourceDir: './src',
  buildOutputDir: './dist',
  artifactsDir: './artifacts',
  workspaceCacheDir: './.cache',
  trustedPaths: [],
  safeMode: false,

  // 2) Editor
  formatOnSave: true,
  formatProvider: 'prettier',
  diagnosticsDisplay: 'both',
  diagnosticsSeverity: 'warning',
  autocompleteDebounce: 300,
  maxSuggestions: 10,
  inlayHints: true,
  tabSize: 2,
  softTabs: true,
  trimTrailing: true,
  fileWatcherLimit: 1000,
  fileWatcherDebounce: 500,

  // 3) Languages & Tooling
  languageServers: {},
  typeCheckingStrict: false,
  incrementalBuild: true,
  allowLLMCodeActions: true,
  llmRequireConfirm: true,

  // 4) Live Preview / HMR
  defaultPreviewMode: 'browser',
  hmrTimeout: 1200,
  autoReloadOnCrash: true,
  autoOpenDevServer: false,
  devServerPortStart: 5173,
  devServerPortEnd: 5200,
  sandboxLevel: 'internal-only',
  blockThirdPartyIframes: true,

  // 5) Run & Execution
  executionBackend: 'electron-local',
  cpuLimit: 80,
  memoryLimit: 2048,
  maxProcessRuntime: 60,
  outputTruncation: 1048576, // 1MB
  workingDir: '.',
  networkAccess: 'internal-only',
  fileWriteRestrict: 'workspace-only',

  // 6) CI / Build
  ciProvider: 'local',
  ciAutoRetryCount: 1,
  ciQuarantineFlaky: true,
  cacheEnabled: true,
  ciCacheDir: './.cache/ci',
  cacheRemoteUrl: '',
  ciTrigger: 'manual',
  artifactRetentionDays: 7,
  artifactEncryption: false,

  // 7) Tests
  testRunner: 'jest',
  testDiscoveryPattern: '**/*.{test,spec}.{js,ts,jsx,tsx}',
  testWatchMode: true,
  testWatchDebounce: 1000,
  coverageThreshold: 80,
  snapshotUpdatePolicy: 'prompt',

  // 8) Logs & Console
  logSources: ['dev-server', 'runner', 'system', 'network'],
  logLevels: ['info', 'warn', 'error'],
  logFilterRegex: '',
  logRetainSessions: 10,
  logRedactSecrets: true,
  logTimestampFormat: 'relative',
  logAnsiColors: true,

  // 9) Security & Privacy
  vpnRequired: false,
  firewallEnabled: true,
  encryptionEnabled: true,
  secretRedaction: true,
  commandRiskBanner: true,
  panicModeActions: [],
  airGapMode: false,

  // 10) Network & Proxy
  proxyMode: 'system',
  proxyUrl: '',
  hostAllowlist: [],
  hostDenylist: [],
  telemetryEnabled: false,

  // 11) LLM & Automation
  llmProvider: 'none',
  llmModel: 'gpt-4',
  llmTokenBudget: 10000,
  llmStreaming: true,
  llmContextMaxFiles: 10,
  llmContextMaxLines: 1000,
  llmExcludeSecrets: true,
  llmApplyPolicy: 'require-approval',
  ollamaUrl: 'http://localhost:11434',

  // 12) Inspector Panel
  inspectorAutoOpen: ['test-fail', 'hmr-crash', 'error'],
  inspectorPlanStyle: 'terse',
  inspectorCollapseLLM: true,
  inspectorRiskGating: true,
  inspectorAuditEnabled: true,

  // 13) Snapshots & Time Travel
  snapshotCadence: 'manual',
  snapshotInterval: 15,
  snapshotMaxCount: 50,
  snapshotPruning: 'lru',

  // 14) Appearance & Layout
  theme: 'dark',
  accentColor: '#00d9ff',
  density: 'comfortable',
  codeFont: 'Fira Code, monospace',
  codeFontSize: 14,
  uiFont: 'Inter, system-ui, sans-serif',
  uiFontSize: 14,
  ligatures: true,

  // 15) Accessibility
  reduceMotion: false,
  disablePulse: false,
  screenReaderVerbosity: 'medium',
  focusRingStyle: 'default',
  minContrast: 4.5,

  // 16) Notifications
  notificationChannels: ['toast'],
  notificationEvents: ['ci-fail', 'test-pass', 'preview-crash'],
  quietHoursStart: '',
  quietHoursEnd: '',

  // 17) Integrations
  vcsDefaultBranch: 'main',
  vcsSignOff: false,
  vcsGpgSigning: false,
  issueTrackerUrl: '',
  issueTrackerProject: '',
  webhookUrl: '',

  // 18) Performance
  pollingIntervals: {
    preview: 2000,
    ci: 5000,
    metrics: 3000,
    console: 1000,
  },
  preloadLanguageServers: true,
  cacheTTL: 3600,
  enableProfiling: false,

  // 19) Shortcuts & Input
  commandPaletteHotkey: 'Alt+Space',
  customBindings: {},

  // 20) Data & Telemetry
  crashReportsEnabled: false,
  usageAnalytics: false,

  // 21) Admin & Advanced
  policyLocks: [],
  roleBasedAccess: false,
  featureFlags: {},
  developerMode: false,
};

export const BUILT_IN_PROFILES: SettingsProfile[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Balanced settings for general development',
    settings: DEFAULT_SETTINGS,
    isBuiltIn: true,
  },
  {
    id: 'low-latency',
    name: 'Low-Latency Coding',
    description: 'Optimized for fast feedback and minimal delays',
    settings: {
      ...DEFAULT_SETTINGS,
      hmrTimeout: 800,
      autocompleteDebounce: 150,
      fileWatcherDebounce: 200,
      testWatchDebounce: 500,
      pollingIntervals: {
        preview: 1000,
        ci: 3000,
        metrics: 2000,
        console: 500,
      },
    },
    isBuiltIn: true,
  },
  {
    id: 'heavy-ci',
    name: 'Heavy CI',
    description: 'For projects with intensive CI/CD pipelines',
    settings: {
      ...DEFAULT_SETTINGS,
      ciAutoRetryCount: 2,
      ciQuarantineFlaky: true,
      cacheEnabled: true,
      testWatchMode: false,
      artifactRetentionDays: 30,
      cpuLimit: 90,
      memoryLimit: 4096,
    },
    isBuiltIn: true,
  },
  {
    id: 'air-gapped',
    name: 'Air-Gapped',
    description: 'Maximum security with no external network access',
    settings: {
      ...DEFAULT_SETTINGS,
      airGapMode: true,
      networkAccess: 'off',
      telemetryEnabled: false,
      crashReportsEnabled: false,
      llmProvider: 'none',
      ciProvider: 'local',
      secretRedaction: true,
      vpnRequired: false,
    },
    isBuiltIn: true,
  },
];
