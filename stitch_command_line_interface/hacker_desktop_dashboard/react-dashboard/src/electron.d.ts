// Type definitions for Electron APIs exposed to the renderer process

export interface CommandExecutionOptions {
  commandId: string;
  args?: string[];
  dryRun?: boolean;
  timeout?: number;
}

export interface CommandExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

export interface ElectronAPI {
  executeCommand: (options: CommandExecutionOptions) => Promise<CommandExecutionResult>;
  streamCommand: (
    options: CommandExecutionOptions,
    onData: (chunk: string) => void
  ) => Promise<CommandExecutionResult>;
  getSystemInfo: () => Promise<{
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
  }>;
  getNetworkInfo: () => Promise<{
    hostname: string;
    networkInterfaces: Record<string, any[]>;
  }>;
  platform: NodeJS.Platform;
  versions: NodeJS.ProcessVersions;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
