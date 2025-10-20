// Type definitions for Electron APIs exposed to the renderer process

export interface ElectronAPI {
  executeCommand: (command: string) => Promise<{ stdout: string; stderr: string }>;
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
