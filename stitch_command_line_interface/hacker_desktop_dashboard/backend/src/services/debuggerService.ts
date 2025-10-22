/**
 * Debugger Service
 * Provides debugging capabilities: breakpoints, watch variables, step execution
 * Uses Node.js Inspector protocol for JavaScript debugging
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { workspaceService } from './workspaceService';
import path from 'path';

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: any;
}

export interface DebuggerState {
  running: boolean;
  paused: boolean;
  currentFile?: string;
  currentLine?: number;
  callStack: Array<{
    file: string;
    line: number;
    function: string;
  }>;
  variables: Record<string, any>;
}

export interface StepAction {
  type: 'continue' | 'stepOver' | 'stepInto' | 'stepOut';
}

/**
 * Debugger Service
 */
export class DebuggerService extends EventEmitter {
  private debugProcess?: ChildProcess;
  private inspectorWs?: WebSocket;
  private breakpoints: Map<string, Breakpoint> = new Map();
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private state: DebuggerState = {
    running: false,
    paused: false,
    callStack: [],
    variables: {},
  };
  private nextBreakpointId = 1;
  private nextWatchId = 1;
  private inspectorUrl?: string;

  constructor() {
    super();
  }

  /**
   * Start debugging a file
   */
  async startDebugging(filePath: string, args: string[] = []): Promise<void> {
    try {
      // Validate file exists
      const fullPath = path.join(workspaceService.getWorkspaceRoot(), filePath);
      await workspaceService.readFile(filePath);

      // Stop existing session
      if (this.debugProcess) {
        await this.stopDebugging();
      }

      // Start Node.js with inspector enabled
      this.debugProcess = spawn('node', ['--inspect-brk=0', fullPath, ...args], {
        cwd: workspaceService.getWorkspaceRoot(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Capture output
      this.debugProcess.stdout?.on('data', (data) => {
        this.emit('output', { type: 'stdout', data: data.toString() });
      });

      this.debugProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        
        // Extract inspector WebSocket URL
        const match = output.match(/ws:\/\/[^\s]+/);
        if (match) {
          this.inspectorUrl = match[0];
          this.connectToInspector();
        }
        
        this.emit('output', { type: 'stderr', data: output });
      });

      this.debugProcess.on('exit', (code) => {
        this.emit('exit', code);
        this.cleanup();
      });

      this.state.running = true;
      logger.info(`Debugger started for: ${filePath}`);
      this.emit('started', { file: filePath });
    } catch (error) {
      logger.error('Failed to start debugger:', error);
      throw new Error('Failed to start debugger');
    }
  }

  /**
   * Connect to Node.js Inspector
   */
  private async connectToInspector(): Promise<void> {
    if (!this.inspectorUrl) {
      throw new Error('Inspector URL not available');
    }

    return new Promise((resolve, reject) => {
      this.inspectorWs = new WebSocket(this.inspectorUrl!);

      this.inspectorWs.on('open', () => {
        logger.info('Connected to Node.js Inspector');
        this.enableDebugger();
        resolve();
      });

      this.inspectorWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleInspectorMessage(message);
        } catch (error) {
          logger.error('Failed to parse inspector message:', error);
        }
      });

      this.inspectorWs.on('error', (error) => {
        logger.error('Inspector WebSocket error:', error);
        reject(error);
      });

      this.inspectorWs.on('close', () => {
        logger.info('Inspector connection closed');
        this.cleanup();
      });
    });
  }

  /**
   * Enable debugger and runtime domains
   */
  private enableDebugger(): void {
    this.sendInspectorCommand('Debugger.enable', {});
    this.sendInspectorCommand('Runtime.enable', {});
    
    // Set existing breakpoints
    for (const bp of this.breakpoints.values()) {
      if (bp.enabled) {
        this.setInspectorBreakpoint(bp);
      }
    }
  }

  /**
   * Send command to Inspector
   */
  private sendInspectorCommand(method: string, params: any = {}): void {
    if (!this.inspectorWs || this.inspectorWs.readyState !== WebSocket.OPEN) {
      logger.warn('Inspector WebSocket not connected');
      return;
    }

    const message = {
      id: Date.now(),
      method,
      params,
    };

    this.inspectorWs.send(JSON.stringify(message));
  }

  /**
   * Handle Inspector protocol messages
   */
  private handleInspectorMessage(message: any): void {
    // Handle debugger paused event
    if (message.method === 'Debugger.paused') {
      const callFrames = message.params.callFrames || [];
      
      this.state.paused = true;
      this.state.callStack = callFrames.map((frame: any) => ({
        file: frame.location?.scriptId || 'unknown',
        line: frame.location?.lineNumber || 0,
        function: frame.functionName || '<anonymous>',
      }));

      if (callFrames.length > 0) {
        const topFrame = callFrames[0];
        this.state.currentLine = topFrame.location?.lineNumber;
      }

      // Extract local variables
      this.extractVariables(callFrames);

      this.emit('paused', {
        callStack: this.state.callStack,
        variables: this.state.variables,
      });
    }

    // Handle debugger resumed event
    if (message.method === 'Debugger.resumed') {
      this.state.paused = false;
      this.emit('resumed');
    }

    // Handle script parsed event
    if (message.method === 'Debugger.scriptParsed') {
      this.emit('scriptParsed', {
        scriptId: message.params.scriptId,
        url: message.params.url,
      });
    }
  }

  /**
   * Extract variables from call frames
   */
  private extractVariables(callFrames: any[]): void {
    if (!callFrames || callFrames.length === 0) return;

    const topFrame = callFrames[0];
    const scopeChain = topFrame.scopeChain || [];

    this.state.variables = {};

    for (const scope of scopeChain) {
      if (scope.type === 'local' || scope.type === 'closure') {
        // Request scope variables
        this.sendInspectorCommand('Runtime.getProperties', {
          objectId: scope.object.objectId,
          ownProperties: true,
        });
      }
    }
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(file: string, line: number, condition?: string): Breakpoint {
    const id = `bp-${this.nextBreakpointId++}`;
    const breakpoint: Breakpoint = {
      id,
      file,
      line,
      enabled: true,
      condition,
    };

    this.breakpoints.set(id, breakpoint);

    // Set in inspector if debugging
    if (this.state.running) {
      this.setInspectorBreakpoint(breakpoint);
    }

    logger.info(`Breakpoint added: ${file}:${line}`);
    return breakpoint;
  }

  /**
   * Set breakpoint in Inspector
   */
  private setInspectorBreakpoint(bp: Breakpoint): void {
    this.sendInspectorCommand('Debugger.setBreakpointByUrl', {
      lineNumber: bp.line - 1, // Inspector uses 0-based line numbers
      url: `file://${path.join(workspaceService.getWorkspaceRoot(), bp.file)}`,
      condition: bp.condition,
    });
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(id: string): void {
    const bp = this.breakpoints.get(id);
    if (!bp) return;

    this.breakpoints.delete(id);
    
    // Remove from inspector if debugging
    if (this.state.running) {
      this.sendInspectorCommand('Debugger.removeBreakpoint', {
        breakpointId: id,
      });
    }

    logger.info(`Breakpoint removed: ${id}`);
  }

  /**
   * Toggle breakpoint
   */
  toggleBreakpoint(id: string): void {
    const bp = this.breakpoints.get(id);
    if (!bp) return;

    bp.enabled = !bp.enabled;

    if (this.state.running) {
      if (bp.enabled) {
        this.setInspectorBreakpoint(bp);
      } else {
        this.sendInspectorCommand('Debugger.removeBreakpoint', {
          breakpointId: id,
        });
      }
    }
  }

  /**
   * List all breakpoints
   */
  listBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Add watch expression
   */
  addWatch(expression: string): WatchExpression {
    const id = `watch-${this.nextWatchId++}`;
    const watch: WatchExpression = {
      id,
      expression,
    };

    this.watchExpressions.set(id, watch);
    logger.info(`Watch added: ${expression}`);
    
    // Evaluate if paused
    if (this.state.paused) {
      this.evaluateWatch(watch);
    }

    return watch;
  }

  /**
   * Evaluate watch expression
   */
  private evaluateWatch(watch: WatchExpression): void {
    this.sendInspectorCommand('Runtime.evaluate', {
      expression: watch.expression,
      returnByValue: true,
    });
  }

  /**
   * Remove watch expression
   */
  removeWatch(id: string): void {
    this.watchExpressions.delete(id);
    logger.info(`Watch removed: ${id}`);
  }

  /**
   * List all watch expressions
   */
  listWatches(): WatchExpression[] {
    return Array.from(this.watchExpressions.values());
  }

  /**
   * Continue execution
   */
  continue(): void {
    if (!this.state.paused) return;
    this.sendInspectorCommand('Debugger.resume');
  }

  /**
   * Step over
   */
  stepOver(): void {
    if (!this.state.paused) return;
    this.sendInspectorCommand('Debugger.stepOver');
  }

  /**
   * Step into
   */
  stepInto(): void {
    if (!this.state.paused) return;
    this.sendInspectorCommand('Debugger.stepInto');
  }

  /**
   * Step out
   */
  stepOut(): void {
    if (!this.state.paused) return;
    this.sendInspectorCommand('Debugger.stepOut');
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (!this.state.running || this.state.paused) return;
    this.sendInspectorCommand('Debugger.pause');
  }

  /**
   * Get current state
   */
  getState(): DebuggerState {
    return { ...this.state };
  }

  /**
   * Evaluate expression in current context
   */
  async evaluate(expression: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.state.paused) {
        reject(new Error('Can only evaluate when paused'));
        return;
      }

      const messageId = Date.now();
      const handler = (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.id === messageId) {
            this.inspectorWs?.removeListener('message', handler);
            
            if (message.result) {
              resolve(message.result.result?.value);
            } else {
              reject(new Error('Evaluation failed'));
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      this.inspectorWs?.on('message', handler);

      this.inspectorWs?.send(JSON.stringify({
        id: messageId,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
        },
      }));
    });
  }

  /**
   * Stop debugging
   */
  async stopDebugging(): Promise<void> {
    this.cleanup();
    
    if (this.debugProcess) {
      this.debugProcess.kill();
      this.debugProcess = undefined;
    }

    logger.info('Debugger stopped');
    this.emit('stopped');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.inspectorWs) {
      this.inspectorWs.close();
      this.inspectorWs = undefined;
    }

    this.state = {
      running: false,
      paused: false,
      callStack: [],
      variables: {},
    };
  }
}

// Singleton instance
export const debuggerService = new DebuggerService();
