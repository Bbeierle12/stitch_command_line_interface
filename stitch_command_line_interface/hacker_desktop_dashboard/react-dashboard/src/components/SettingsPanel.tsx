import { useState } from 'react';
import { X, Save, RotateCcw, Download, Upload, Shield, Zap, Code2, Play, TestTube, Terminal, Lock, Wifi, Bot, Eye, Camera, Palette, Accessibility, Bell, GitBranch, Gauge, Keyboard, BarChart3, Archive, Wrench } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const SETTING_CATEGORIES = [
  { id: 'workspace', label: 'Workspace', icon: Code2, color: 'cyan' },
  { id: 'editor', label: 'Editor', icon: Code2, color: 'cyan' },
  { id: 'languages', label: 'Languages & Tooling', icon: Wrench, color: 'purple' },
  { id: 'preview', label: 'Live Preview / HMR', icon: Play, color: 'ops-green' },
  { id: 'execution', label: 'Run & Execution', icon: Zap, color: 'warn' },
  { id: 'ci', label: 'CI / Build', icon: GitBranch, color: 'blue' },
  { id: 'tests', label: 'Tests', icon: TestTube, color: 'green' },
  { id: 'logs', label: 'Logs & Console', icon: Terminal, color: 'gray' },
  { id: 'security', label: 'Security & Privacy', icon: Shield, color: 'danger' },
  { id: 'network', label: 'Network & Proxy', icon: Wifi, color: 'blue' },
  { id: 'llm', label: 'LLM & Automation', icon: Bot, color: 'purple' },
  { id: 'inspector', label: 'Inspector Panel', icon: Eye, color: 'cyan' },
  { id: 'snapshots', label: 'Snapshots & Time Travel', icon: Camera, color: 'blue' },
  { id: 'appearance', label: 'Appearance & Layout', icon: Palette, color: 'pink' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, color: 'green' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'yellow' },
  { id: 'integrations', label: 'Integrations', icon: GitBranch, color: 'blue' },
  { id: 'performance', label: 'Performance', icon: Gauge, color: 'orange' },
  { id: 'shortcuts', label: 'Shortcuts & Input', icon: Keyboard, color: 'gray' },
  { id: 'data', label: 'Data & Telemetry', icon: BarChart3, color: 'cyan' },
  { id: 'backup', label: 'Backup & Export', icon: Archive, color: 'blue' },
  { id: 'advanced', label: 'Admin & Advanced', icon: Wrench, color: 'danger' },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, activeProfile, profiles, updateSetting, resetSettings, switchProfile, exportSettings, importSettings } = useSettings();
  const [activeCategory, setActiveCategory] = useState('workspace');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            importSettings(json);
          } catch (error) {
            alert('Failed to import settings: ' + error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-[90vw] h-[85vh] max-w-7xl bg-ink border border-hairline rounded-lg shadow-depth flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-xs text-white/60 mt-1">Configure your workspace, editor, and system behavior</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile Selector */}
            <select
              value={activeProfile}
              onChange={(e) => switchProfile(e.target.value)}
              className="px-3 py-1.5 bg-panel border border-hairline rounded text-sm text-white outline-none focus:border-cyan"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-panel hover:bg-hairline border border-hairline rounded text-sm text-white/80 transition flex items-center gap-2"
              title="Export Settings"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-1.5 bg-panel hover:bg-hairline border border-hairline rounded text-sm text-white/80 transition flex items-center gap-2"
              title="Import Settings"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => resetSettings()}
              className="px-3 py-1.5 bg-panel hover:bg-hairline border border-hairline rounded text-sm text-white/80 transition flex items-center gap-2"
              title="Reset to Defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-hairline rounded transition"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-hairline bg-panel/40 overflow-y-auto scrollbar-thin">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded text-sm text-white outline-none focus:border-cyan"
              />
            </div>
            <nav className="px-2 pb-4">
              {SETTING_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                      activeCategory === category.id
                        ? 'bg-cyan/10 text-cyan border-l-2 border-cyan'
                        : 'text-white/70 hover:bg-hairline/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{category.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {activeCategory === 'workspace' && <WorkspaceSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'editor' && <EditorSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'languages' && <LanguagesSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'preview' && <PreviewSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'execution' && <ExecutionSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'ci' && <CISettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'tests' && <TestsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'logs' && <LogsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'security' && <SecuritySettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'network' && <NetworkSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'llm' && <LLMSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'inspector' && <InspectorSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'snapshots' && <SnapshotsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'appearance' && <AppearanceSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'accessibility' && <AccessibilitySettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'notifications' && <NotificationsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'integrations' && <IntegrationsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'performance' && <PerformanceSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'shortcuts' && <ShortcutsSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'data' && <DataSettings settings={settings} updateSetting={updateSetting} />}
            {activeCategory === 'backup' && <BackupSettings settings={settings} updateSetting={updateSetting} exportSettings={exportSettings} importSettings={importSettings} />}
            {activeCategory === 'advanced' && <AdvancedSettings settings={settings} updateSetting={updateSetting} />}
          </main>
        </div>
      </div>
    </div>
  );
}

// Individual setting section components
function WorkspaceSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Workspace</h3>
        <p className="text-sm text-white/60 mb-6">Configure project structure and trusted paths</p>
      </div>

      <SettingGroup label="Project Structure">
        <SettingInput
          label="Source Directory"
          value={settings.sourceDir}
          onChange={(v) => updateSetting('sourceDir', v)}
          description="Primary source code location"
        />
        <SettingInput
          label="Build Output Directory"
          value={settings.buildOutputDir}
          onChange={(v) => updateSetting('buildOutputDir', v)}
          description="Where compiled/built files are placed"
        />
        <SettingInput
          label="Artifacts Directory"
          value={settings.artifactsDir}
          onChange={(v) => updateSetting('artifactsDir', v)}
          description="Test artifacts, screenshots, reports"
        />
        <SettingInput
          label="Cache Directory"
          value={settings.workspaceCacheDir}
          onChange={(v) => updateSetting('workspaceCacheDir', v)}
          description="Local cache for dependencies and builds"
        />
      </SettingGroup>

      <SettingGroup label="Security">
        <SettingToggle
          label="Safe Mode"
          checked={settings.safeMode}
          onChange={(v) => updateSetting('safeMode', v)}
          description="Force read-only operations (useful for demos)"
          risk="med"
        />
      </SettingGroup>
    </div>
  );
}

function EditorSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Editor</h3>
        <p className="text-sm text-white/60 mb-6">Customize code editing behavior and formatting</p>
      </div>

      <SettingGroup label="Formatting">
        <SettingToggle
          label="Format on Save"
          checked={settings.formatOnSave}
          onChange={(v) => updateSetting('formatOnSave', v)}
          description="Automatically format code when saving"
        />
        <SettingSelect
          label="Format Provider"
          value={settings.formatProvider}
          options={[
            { value: 'prettier', label: 'Prettier' },
            { value: 'eslint', label: 'ESLint' },
            { value: 'none', label: 'None' },
          ]}
          onChange={(v) => updateSetting('formatProvider', v)}
        />
      </SettingGroup>

      <SettingGroup label="Diagnostics">
        <SettingSelect
          label="Display Mode"
          value={settings.diagnosticsDisplay}
          options={[
            { value: 'inline', label: 'Inline Only' },
            { value: 'panel', label: 'Panel Only' },
            { value: 'both', label: 'Both' },
          ]}
          onChange={(v) => updateSetting('diagnosticsDisplay', v)}
        />
        <SettingSelect
          label="Minimum Severity"
          value={settings.diagnosticsSeverity}
          options={[
            { value: 'error', label: 'Errors Only' },
            { value: 'warning', label: 'Warnings+' },
            { value: 'info', label: 'All (Info+)' },
          ]}
          onChange={(v) => updateSetting('diagnosticsSeverity', v)}
        />
      </SettingGroup>

      <SettingGroup label="Tabs & Whitespace">
        <SettingInput
          label="Tab Size"
          type="number"
          value={settings.tabSize}
          onChange={(v) => updateSetting('tabSize', parseInt(v))}
          min={1}
          max={8}
        />
        <SettingToggle
          label="Soft Tabs (Spaces)"
          checked={settings.softTabs}
          onChange={(v) => updateSetting('softTabs', v)}
        />
        <SettingToggle
          label="Trim Trailing Whitespace"
          checked={settings.trimTrailing}
          onChange={(v) => updateSetting('trimTrailing', v)}
        />
      </SettingGroup>
    </div>
  );
}

// Placeholder implementations for other categories
function LanguagesSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Languages & Tooling" description="Language server and tooling configuration" />;
}

function PreviewSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Live Preview / HMR</h3>
        <p className="text-sm text-white/60 mb-6">Configure preview modes and hot module replacement</p>
      </div>

      <SettingGroup label="Preview Behavior">
        <SettingSelect
          label="Default Preview Mode"
          value={settings.defaultPreviewMode}
          options={[
            { value: 'browser', label: 'Browser' },
            { value: 'cli', label: 'CLI' },
            { value: 'plots', label: 'Plots' },
            { value: 'tests', label: 'Tests' },
            { value: 'docs', label: 'Docs' },
          ]}
          onChange={(v) => updateSetting('defaultPreviewMode', v)}
        />
        <SettingInput
          label="HMR Timeout (ms)"
          type="number"
          value={settings.hmrTimeout}
          onChange={(v) => updateSetting('hmrTimeout', parseInt(v))}
          description="Max rebuild time before fallback refresh"
        />
        <SettingToggle
          label="Auto-reload on Crash"
          checked={settings.autoReloadOnCrash}
          onChange={(v) => updateSetting('autoReloadOnCrash', v)}
        />
      </SettingGroup>

      <SettingGroup label="Sandbox">
        <SettingSelect
          label="Sandbox Level"
          value={settings.sandboxLevel}
          options={[
            { value: 'strict', label: 'Strict (Maximum Security)' },
            { value: 'internal-only', label: 'Internal Only' },
            { value: 'full', label: 'Full Access' },
          ]}
          onChange={(v) => updateSetting('sandboxLevel', v)}
        />
        <SettingToggle
          label="Block Third-Party Iframes"
          checked={settings.blockThirdPartyIframes}
          onChange={(v) => updateSetting('blockThirdPartyIframes', v)}
        />
      </SettingGroup>
    </div>
  );
}

function ExecutionSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Run & Execution (Sandbox)</h3>
        <p className="text-sm text-white/60 mb-6">Control code execution environment and resource limits</p>
      </div>

      <SettingGroup label="Execution Backend">
        <SettingSelect
          label="Backend"
          value={settings.executionBackend}
          options={[
            { value: 'electron-local', label: 'Electron Local Shell' },
            { value: 'container', label: 'Container' },
            { value: 'remote', label: 'Remote Runner' },
          ]}
          onChange={(v) => updateSetting('executionBackend', v)}
        />
      </SettingGroup>

      <SettingGroup label="Resource Limits">
        <SettingInput
          label="CPU Limit (%)"
          type="number"
          value={settings.cpuLimit}
          onChange={(v) => updateSetting('cpuLimit', parseInt(v))}
          min={10}
          max={100}
        />
        <SettingInput
          label="Memory Limit (MB)"
          type="number"
          value={settings.memoryLimit}
          onChange={(v) => updateSetting('memoryLimit', parseInt(v))}
          min={256}
          max={16384}
        />
        <SettingInput
          label="Max Process Runtime (seconds)"
          type="number"
          value={settings.maxProcessRuntime}
          onChange={(v) => updateSetting('maxProcessRuntime', parseInt(v))}
          min={1}
          max={3600}
        />
      </SettingGroup>

      <SettingGroup label="Permissions">
        <SettingSelect
          label="Network Access"
          value={settings.networkAccess}
          options={[
            { value: 'off', label: 'Disabled' },
            { value: 'internal-only', label: 'Internal Only' },
            { value: 'full', label: 'Full Access' },
          ]}
          onChange={(v) => updateSetting('networkAccess', v)}
          risk="high"
        />
        <SettingSelect
          label="File Write Permissions"
          value={settings.fileWriteRestrict}
          options={[
            { value: 'tmp-only', label: '/tmp Only' },
            { value: 'workspace-only', label: 'Workspace Only' },
            { value: 'unrestricted', label: 'Unrestricted' },
          ]}
          onChange={(v) => updateSetting('fileWriteRestrict', v)}
          risk="high"
        />
      </SettingGroup>
    </div>
  );
}

function CISettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="CI / Build" description="Continuous integration and build pipeline settings" />;
}

function TestsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Tests" description="Test runner configuration and coverage settings" />;
}

function LogsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Logs & Console" description="Log streaming, filtering, and persistence" />;
}

function SecuritySettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Security & Privacy</h3>
        <p className="text-sm text-white/60 mb-6">Protect your data and control security features</p>
      </div>

      <SettingGroup label="Network Security">
        <SettingToggle
          label="Firewall Enabled"
          checked={settings.firewallEnabled}
          onChange={(v) => updateSetting('firewallEnabled', v)}
        />
        <SettingToggle
          label="Encryption Enabled"
          checked={settings.encryptionEnabled}
          onChange={(v) => updateSetting('encryptionEnabled', v)}
        />
      </SettingGroup>

      <SettingGroup label="Data Protection">
        <SettingToggle
          label="Redact Secrets in Logs"
          checked={settings.secretRedaction}
          onChange={(v) => updateSetting('secretRedaction', v)}
          description="Automatically redact common token patterns"
        />
        <SettingToggle
          label="Show Command Risk Banners"
          checked={settings.commandRiskBanner}
          onChange={(v) => updateSetting('commandRiskBanner', v)}
          description="Display risk warnings before execution"
        />
        <SettingToggle
          label="Air-Gap Mode"
          checked={settings.airGapMode}
          onChange={(v) => updateSetting('airGapMode', v)}
          description="Block all outbound requests except allowlist"
          risk="high"
        />
      </SettingGroup>
    </div>
  );
}

function NetworkSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Network & Proxy" description="Proxy configuration and network policies" />;
}

function LLMSettings({ settings, updateSetting }: any) {
  // Model options based on provider
  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4 (8K)' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (128K)' },
          { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview (128K)' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (16K)' },
          { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' },
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-opus', label: 'Claude 3 Opus (200K)' },
          { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (200K)' },
          { value: 'claude-3-haiku', label: 'Claude 3 Haiku (200K)' },
          { value: 'claude-2.1', label: 'Claude 2.1 (200K)' },
          { value: 'claude-2', label: 'Claude 2 (100K)' },
        ];
      case 'google':
        return [
          { value: 'gemini-pro', label: 'Gemini Pro (32K)' },
          { value: 'gemini-pro-vision', label: 'Gemini Pro Vision (32K)' },
          { value: 'gemini-ultra', label: 'Gemini Ultra (32K)' },
        ];
      case 'ollama':
        return [
          { value: 'llama2:latest', label: 'Llama 2 Latest' },
          { value: 'llama2:7b', label: 'Llama 2 7B' },
          { value: 'llama2:13b', label: 'Llama 2 13B' },
          { value: 'llama2:70b', label: 'Llama 2 70B' },
          { value: 'codellama:latest', label: 'Code Llama Latest' },
          { value: 'codellama:7b', label: 'Code Llama 7B' },
          { value: 'codellama:13b', label: 'Code Llama 13B' },
          { value: 'codellama:34b', label: 'Code Llama 34B' },
          { value: 'mistral:latest', label: 'Mistral Latest' },
          { value: 'mixtral:latest', label: 'Mixtral Latest' },
          { value: 'phi:latest', label: 'Phi Latest' },
          { value: 'neural-chat:latest', label: 'Neural Chat Latest' },
        ];
      case 'self-hosted':
        return [
          { value: 'custom', label: 'Custom Model' },
        ];
      default:
        return [];
    }
  };

  const modelOptions = getModelOptions(settings.llmProvider);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">LLM & Automation</h3>
        <p className="text-sm text-white/60 mb-6">Configure AI-powered code assistance and automation</p>
      </div>

      <SettingGroup label="Provider">
        <SettingSelect
          label="LLM Provider"
          value={settings.llmProvider}
          options={[
            { value: 'none', label: 'Disabled' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic (Claude)' },
            { value: 'google', label: 'Google (Gemini)' },
            { value: 'ollama', label: 'Ollama (Local)' },
            { value: 'self-hosted', label: 'Self-Hosted' },
          ]}
          onChange={(v) => updateSetting('llmProvider', v)}
        />
        {settings.llmProvider !== 'none' && modelOptions.length > 0 && (
          <SettingSelect
            label="Model"
            value={settings.llmModel}
            options={modelOptions}
            onChange={(v) => updateSetting('llmModel', v)}
          />
        )}
        {settings.llmProvider === 'self-hosted' && (
          <SettingInput
            label="Custom Model Name"
            value={settings.llmModel}
            onChange={(v) => updateSetting('llmModel', v)}
            placeholder="e.g., my-custom-model"
          />
        )}
        {settings.llmProvider === 'ollama' && (
          <SettingInput
            label="Ollama Server URL"
            value={settings.ollamaUrl || 'http://localhost:11434'}
            onChange={(v) => updateSetting('ollamaUrl', v)}
            placeholder="http://localhost:11434"
          />
        )}
      </SettingGroup>

      <SettingGroup label="Behavior">
        <SettingInput
          label="Token Budget"
          type="number"
          value={settings.llmTokenBudget}
          onChange={(v) => updateSetting('llmTokenBudget', parseInt(v))}
          description="Hard cap per session"
        />
        <SettingToggle
          label="Streaming"
          checked={settings.llmStreaming}
          onChange={(v) => updateSetting('llmStreaming', v)}
        />
        <SettingToggle
          label="Exclude Secrets from Context"
          checked={settings.llmExcludeSecrets}
          onChange={(v) => updateSetting('llmExcludeSecrets', v)}
        />
        <SettingSelect
          label="Apply Changes Policy"
          value={settings.llmApplyPolicy}
          options={[
            { value: 'require-approval', label: 'Require Approval' },
            { value: 'auto-low-risk', label: 'Auto-apply Low Risk' },
            { value: 'never-auto', label: 'Never Auto-apply' },
          ]}
          onChange={(v) => updateSetting('llmApplyPolicy', v)}
        />
      </SettingGroup>
    </div>
  );
}

function InspectorSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Inspector Panel" description="Inspector behavior and auto-open triggers" />;
}

function SnapshotsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Snapshots & Time Travel" description="Snapshot cadence and retention policy" />;
}

function AppearanceSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Appearance & Layout</h3>
        <p className="text-sm text-white/60 mb-6">Customize theme, fonts, and visual style</p>
      </div>

      <SettingGroup label="Theme">
        <SettingSelect
          label="Color Theme"
          value={settings.theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'high-contrast', label: 'High Contrast' },
          ]}
          onChange={(v) => updateSetting('theme', v)}
        />
        <SettingInput
          label="Accent Color"
          type="color"
          value={settings.accentColor}
          onChange={(v) => updateSetting('accentColor', v)}
        />
      </SettingGroup>

      <SettingGroup label="Density">
        <SettingSelect
          label="UI Density"
          value={settings.density}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
          ]}
          onChange={(v) => updateSetting('density', v)}
        />
      </SettingGroup>

      <SettingGroup label="Fonts">
        <SettingInput
          label="Code Font"
          value={settings.codeFont}
          onChange={(v) => updateSetting('codeFont', v)}
        />
        <SettingInput
          label="Code Font Size"
          type="number"
          value={settings.codeFontSize}
          onChange={(v) => updateSetting('codeFontSize', parseInt(v))}
          min={10}
          max={24}
        />
        <SettingToggle
          label="Enable Ligatures"
          checked={settings.ligatures}
          onChange={(v) => updateSetting('ligatures', v)}
        />
      </SettingGroup>
    </div>
  );
}

function AccessibilitySettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Accessibility" description="Motion, screen reader, and contrast settings" />;
}

function NotificationsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Notifications" description="Toast, sound, and notification preferences" />;
}

function IntegrationsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Integrations" description="VCS, issue tracker, and webhook integrations" />;
}

function PerformanceSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Performance" description="Polling intervals and caching configuration" />;
}

function ShortcutsSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Shortcuts & Input" description="Keyboard shortcuts and custom bindings" />;
}

function DataSettings({ settings, updateSetting }: any) {
  return <CategoryPlaceholder title="Data & Telemetry" description="Crash reports and analytics opt-in" />;
}

function BackupSettings({ settings, updateSetting, exportSettings, importSettings }: any) {
  return <CategoryPlaceholder title="Backup & Export" description="Export and import workspace configurations" />;
}

function AdvancedSettings({ settings, updateSetting }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Admin & Advanced</h3>
        <p className="text-sm text-white/60 mb-6">Developer tools and advanced configuration</p>
      </div>

      <SettingGroup label="Developer Tools">
        <SettingToggle
          label="Developer Mode"
          checked={settings.developerMode}
          onChange={(v) => updateSetting('developerMode', v)}
          description="Show internal IDs, raw payloads, verbose logging"
        />
      </SettingGroup>
    </div>
  );
}

// Helper components
function CategoryPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <p className="text-sm text-white/60 mb-6">{description}</p>
      </div>
      <div className="p-6 bg-panel/40 border border-hairline rounded-lg text-center">
        <p className="text-white/60">Settings for this category will be implemented soon.</p>
      </div>
    </div>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-cyan/30 pl-4">
      <h4 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">{label}</h4>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingToggle({ label, checked, onChange, description, risk }: any) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <label className="text-sm text-white cursor-pointer">{label}</label>
          {risk && <RiskBadge level={risk} />}
        </div>
        {description && <p className="text-xs text-white/50 mt-1">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-cyan cursor-pointer"
      />
    </div>
  );
}

function SettingInput({ label, value, onChange, description, type = 'text', min, max, placeholder }: any) {
  return (
    <div className="py-2">
      <label className="text-sm text-white mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 bg-panel border border-hairline rounded text-sm text-white outline-none focus:border-cyan"
      />
      {description && <p className="text-xs text-white/50 mt-1">{description}</p>}
    </div>
  );
}

function SettingSelect({ label, value, options, onChange, risk }: any) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-white">{label}</label>
        {risk && <RiskBadge level={risk} />}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 bg-panel border border-hairline rounded text-sm text-white outline-none focus:border-cyan"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'med' | 'high' }) {
  const colors = {
    low: 'bg-ops-green/20 text-ops-green border-ops-green',
    med: 'bg-warn/20 text-warn border-warn',
    high: 'bg-danger/20 text-danger border-danger',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${colors[level]}`}>
      {level} risk
    </span>
  );
}
