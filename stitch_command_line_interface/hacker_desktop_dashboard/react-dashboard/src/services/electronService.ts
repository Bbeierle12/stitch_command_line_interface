/**
 * Electron Service
 * Provides safe access to Electron APIs when running in desktop mode
 */

export interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface NetworkInfo {
  hostname: string;
  networkInterfaces: Record<string, any[]>;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

class ElectronService {
  private isElectron: boolean;

  constructor() {
    this.isElectron = this.checkElectronEnvironment();
  }

  private checkElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.electronAPI !== undefined;
  }

  /**
   * Check if running in Electron environment
   */
  isElectronApp(): boolean {
    return this.isElectron;
  }

  /**
   * Get platform information
   */
  getPlatform(): string | null {
    if (!this.isElectron) return null;
    return window.electronAPI.platform;
  }

  /**
   * Get Electron versions
   */
  getVersions(): NodeJS.ProcessVersions | null {
    if (!this.isElectron) return null;
    return window.electronAPI.versions;
  }

  /**
   * Execute a system command
   */
  async executeCommand(command: { label: string; risk: string }): Promise<CommandResult> {
    if (!this.isElectron) {
      return {
        success: false,
        output: '',
        error: 'Not running in Electron environment'
      };
    }

    try {
      const result = await window.electronAPI.executeCommand(command.label);
      return {
        success: true,
        output: result.stdout || '',
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfo | null> {
    if (!this.isElectron) return null;

    try {
      return await window.electronAPI.getSystemInfo();
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo | null> {
    if (!this.isElectron) return null;

    try {
      return await window.electronAPI.getNetworkInfo();
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const electronService = new ElectronService();

// Export utility function
export function isElectron(): boolean {
  return electronService.isElectronApp();
}
