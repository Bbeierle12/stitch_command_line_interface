/**
 * Dev Server Service
 * Manages development server lifecycle and tracks build status
 */

import { logger } from '../utils/logger';
import { getFileWatcherService } from './fileWatcherService';

export type BuildStatus = 'idle' | 'compiling' | 'ready' | 'error';

export interface DevServerState {
  url: string;
  status: BuildStatus;
  lastBuildMs: number;
  lastBuildTime?: Date;
  error?: string;
}

export class DevServerService {
  private state: DevServerState;
  private buildStartTime: number = 0;

  constructor() {
    // Default state - assumes Vite dev server on port 5173
    this.state = {
      url: process.env.DEV_SERVER_URL || 'http://localhost:5173',
      status: 'ready',
      lastBuildMs: 0,
    };
  }

  /**
   * Get current dev server state
   */
  getState(): DevServerState {
    return { ...this.state };
  }

  /**
   * Start a build
   */
  startBuild(): void {
    this.buildStartTime = Date.now();
    this.state.status = 'compiling';
    
    logger.info('Dev server build started');
    
    // Emit build-start event via file watcher service
    const fileWatcher = getFileWatcherService();
    fileWatcher.emitBuildStart();
  }

  /**
   * Complete a build
   */
  completeBuild(success: boolean = true, error?: string): void {
    const durationMs = Date.now() - this.buildStartTime;
    
    this.state.status = success ? 'ready' : 'error';
    this.state.lastBuildMs = durationMs;
    this.state.lastBuildTime = new Date();
    this.state.error = error;

    logger.info(`Dev server build ${success ? 'completed' : 'failed'} in ${durationMs}ms`);

    // Emit build-end event via file watcher service
    const fileWatcher = getFileWatcherService();
    fileWatcher.emitBuildEnd(success, durationMs, this.state.url);
  }

  /**
   * Update dev server URL (e.g., when restarting on a different port)
   */
  updateUrl(url: string): void {
    this.state.url = url;
    
    logger.info(`Dev server URL updated to: ${url}`);
    
    // Emit preview update
    const fileWatcher = getFileWatcherService();
    fileWatcher.emitPreviewUpdate(url, {
      lastMs: this.state.lastBuildMs,
      ok: this.state.status === 'ready',
    });
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.state.status = 'idle';
    this.state.error = undefined;
    logger.info('Dev server state reset');
  }

  /**
   * Simulate a rebuild (for demo/testing purposes)
   * In production, this would be triggered by actual file changes
   */
  simulateRebuild(delayMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      this.startBuild();
      
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        this.completeBuild(success, success ? undefined : 'Simulated build error');
        resolve();
      }, delayMs);
    });
  }

  /**
   * Get HMR status object
   */
  getHmrStatus(): { lastMs: number; ok: boolean } {
    return {
      lastMs: this.state.lastBuildMs,
      ok: this.state.status === 'ready',
    };
  }

  /**
   * Check if dev server is healthy
   */
  isHealthy(): boolean {
    return this.state.status === 'ready' || this.state.status === 'idle';
  }
}

// Singleton instance
let devServerInstance: DevServerService | null = null;

export function getDevServerService(): DevServerService {
  if (!devServerInstance) {
    devServerInstance = new DevServerService();
  }
  return devServerInstance;
}
