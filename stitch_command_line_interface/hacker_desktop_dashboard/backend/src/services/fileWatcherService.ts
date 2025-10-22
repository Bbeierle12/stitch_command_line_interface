/**
 * File Watcher Service
 * Watches workspace files for changes and emits WebSocket events
 */

import * as chokidar from 'chokidar';
import { Server as WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import path from 'path';

export class FileWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private wss: WebSocketServer | null = null;
  private isWatching = false;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: Set<string> = new Set();
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /**
   * Initialize file watcher with WebSocket server
   */
  initialize(wss: WebSocketServer): void {
    this.wss = wss;
    this.startWatching();
  }

  /**
   * Start watching files
   */
  private startWatching(): void {
    if (this.isWatching) {
      logger.warn('File watcher is already running');
      return;
    }

    try {
      // Watch source files, ignore node_modules, build artifacts, and hidden files
      this.watcher = chokidar.watch(this.workspacePath, {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/coverage/**',
          '**/*.log',
          '**/.DS_Store',
          '**/workspace/**', // Ignore backend workspace directory
        ],
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
        depth: 10,
      });

      this.watcher
        .on('add', (filePath: string) => this.handleFileChange('add', filePath))
        .on('change', (filePath: string) => this.handleFileChange('change', filePath))
        .on('unlink', (filePath: string) => this.handleFileChange('unlink', filePath))
        .on('error', (error: unknown) => logger.error('File watcher error:', error))
        .on('ready', () => {
          this.isWatching = true;
          logger.info(`File watcher started monitoring: ${this.workspacePath}`);
        });
    } catch (error) {
      logger.error('Failed to start file watcher:', error);
    }
  }

  /**
   * Handle file change event
   */
  private handleFileChange(type: 'add' | 'change' | 'unlink', filePath: string): void {
    const relativePath = path.relative(this.workspacePath, filePath);
    
    // Filter out irrelevant files
    if (this.shouldIgnoreFile(relativePath)) {
      return;
    }

    logger.info(`File ${type}: ${relativePath}`);
    
    // Add to pending changes
    this.pendingChanges.add(relativePath);

    // Debounce to avoid too many events during rapid file changes
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.emitFileChanges(type);
      this.pendingChanges.clear();
    }, 500); // 500ms debounce
  }

  /**
   * Check if file should be ignored
   */
  private shouldIgnoreFile(relativePath: string): boolean {
    // Ignore lock files, temp files, etc.
    const ignorePatterns = [
      /\.lock$/,
      /\.tmp$/,
      /\.swp$/,
      /~$/,
      /^\.#/,
      /\.d\.ts$/,
      /\.map$/,
    ];

    return ignorePatterns.some(pattern => pattern.test(relativePath));
  }

  /**
   * Emit file change events via WebSocket
   */
  private emitFileChanges(changeType: 'add' | 'change' | 'unlink'): void {
    if (!this.wss) {
      return;
    }

    const changes = Array.from(this.pendingChanges);
    const event = {
      type: 'file:change',
      data: {
        changeType,
        files: changes,
        timestamp: new Date().toISOString(),
        count: changes.length,
      },
    };

    this.broadcast(event);
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  private broadcast(message: any): void {
    if (!this.wss) {
      return;
    }

    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Manually trigger a rebuild notification
   */
  emitBuildStart(): void {
    this.broadcast({
      type: 'preview:build-start',
      data: {
        timestamp: new Date().toISOString(),
        status: 'compiling',
      },
    });
  }

  /**
   * Emit build completion
   */
  emitBuildEnd(success: boolean, durationMs: number, url?: string): void {
    this.broadcast({
      type: 'preview:build-end',
      data: {
        timestamp: new Date().toISOString(),
        status: success ? 'ready' : 'error',
        durationMs,
        url,
      },
    });
  }

  /**
   * Emit preview update (e.g., URL change, dev server restart)
   */
  emitPreviewUpdate(url: string, hmr: { lastMs: number; ok: boolean }): void {
    this.broadcast({
      type: 'preview:update',
      data: {
        url,
        hmr,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Stop watching files
   */
  async stop(): Promise<void> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.isWatching = false;
    logger.info('File watcher stopped');
  }

  /**
   * Get watcher status
   */
  getStatus(): { watching: boolean; path: string; pendingChanges: number } {
    return {
      watching: this.isWatching,
      path: this.workspacePath,
      pendingChanges: this.pendingChanges.size,
    };
  }
}

// Singleton instance
let fileWatcherInstance: FileWatcherService | null = null;

export function getFileWatcherService(workspacePath?: string): FileWatcherService {
  const defaultPath = path.join(process.cwd(), 'workspace');
  
  if (!fileWatcherInstance) {
    fileWatcherInstance = new FileWatcherService(workspacePath || defaultPath);
  }
  
  return fileWatcherInstance;
}
