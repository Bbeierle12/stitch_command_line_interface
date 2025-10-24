/**
 * Execution Service - Secure Sandboxed Code Execution
 * Runs user code in isolated environments with resource limits
 */

import ivm from 'isolated-vm';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface ExecutionOptions {
  code: string;
  language: 'javascript' | 'typescript';
  timeout?: number;
  memoryLimit?: number;
  input?: string;
  workingDirectory?: string;
}

export interface ExecutionResult {
  id: string;
  status: 'running' | 'completed' | 'error' | 'timeout' | 'cancelled';
  output: string;
  error?: string;
  exitCode: number;
  runtime: number;
  memoryUsed: number;
  timestamp: Date;
}

export interface ExecutionMetrics {
  id: string;
  startTime: number;
  endTime?: number;
  cpuTime?: number;
  memoryPeak?: number;
  outputSize?: number;
}

/**
 * Execution Manager
 */
export class ExecutionService extends EventEmitter {
  private executions: Map<string, ExecutionResult> = new Map();
  private metrics: Map<string, ExecutionMetrics> = new Map();
  private readonly DEFAULT_TIMEOUT_MS: number;
  private readonly DEFAULT_MEMORY_LIMIT_MB: number;
  private readonly MAX_OUTPUT_SIZE_KB: number;
  private readonly MAX_CONCURRENT_EXECUTIONS: number;
  private activeExecutions: number = 0;

  constructor() {
    super();
    this.DEFAULT_TIMEOUT_MS = parseInt(process.env.MAX_EXECUTION_TIME_MS || '30000', 10);
    this.DEFAULT_MEMORY_LIMIT_MB = parseInt(process.env.MAX_MEMORY_MB || '512', 10);
    this.MAX_OUTPUT_SIZE_KB = parseInt(process.env.MAX_OUTPUT_SIZE_KB || '1024', 10);
    this.MAX_CONCURRENT_EXECUTIONS = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10);
  }

  /**
   * Execute code in sandbox
   */
  async executeCode(options: ExecutionOptions): Promise<string> {
    // Check concurrency limit
    if (this.activeExecutions >= this.MAX_CONCURRENT_EXECUTIONS) {
      throw new Error(`Concurrent execution limit reached (${this.MAX_CONCURRENT_EXECUTIONS}). Please wait for other executions to complete.`);
    }

    const id = this.generateExecutionId(options.code);
    const startTime = Date.now();

    // Initialize execution result
    const result: ExecutionResult = {
      id,
      status: 'running',
      output: '',
      exitCode: 0,
      runtime: 0,
      memoryUsed: 0,
      timestamp: new Date(),
    };

    this.executions.set(id, result);
    this.metrics.set(id, {
      id,
      startTime,
    });

    // Increment active execution counter
    this.activeExecutions++;

    this.emit('execution:start', { id, options });
    logger.info(`Starting execution ${id} (${this.activeExecutions}/${this.MAX_CONCURRENT_EXECUTIONS} active)`);

    try {
      // Execute based on language
      if (options.language === 'javascript') {
        await this.executeJavaScript(id, options);
      } else if (options.language === 'typescript') {
        // TypeScript needs transpilation first
        await this.executeTypeScript(id, options);
      } else {
        throw new Error(`Unsupported language: ${options.language}`);
      }

      result.status = 'completed';
      result.exitCode = 0;
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      result.exitCode = 1;
      logger.error(`Execution ${id} failed:`, error);
    } finally {
      const endTime = Date.now();
      result.runtime = endTime - startTime;
      
      const metrics = this.metrics.get(id);
      if (metrics) {
        metrics.endTime = endTime;
      }

      // Decrement active execution counter
      this.activeExecutions--;

      this.emit('execution:complete', result);
      logger.info(`Execution ${id} completed in ${result.runtime}ms (${this.activeExecutions}/${this.MAX_CONCURRENT_EXECUTIONS} active)`);
    }

    return id;
  }

  /**
   * Execute JavaScript code
   */
  private async executeJavaScript(id: string, options: ExecutionOptions): Promise<void> {
    const result = this.executions.get(id);
    if (!result) throw new Error('Execution not found');

    const timeout = options.timeout || this.DEFAULT_TIMEOUT_MS;
    const memoryLimit = (options.memoryLimit || this.DEFAULT_MEMORY_LIMIT_MB) * 1024 * 1024;

    // Create isolated VM
    const isolate = new ivm.Isolate({ memoryLimit: memoryLimit / 1024 / 1024 });
    const context = await isolate.createContext();

    // Create output buffer
    const outputLines: string[] = [];
    const maxOutputSize = this.MAX_OUTPUT_SIZE_KB * 1024;

    // Setup console.log capture
    const logFunction = new ivm.Reference(function(...args: unknown[]) {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      outputLines.push(message);
      
      // Check output size limit
      const currentSize = outputLines.join('\n').length;
      if (currentSize > maxOutputSize) {
        throw new Error('Output size limit exceeded');
      }
    });

    await context.global.set('log', logFunction);

    // Setup console object
    const consoleObject = await context.eval(`
      (function(log) {
        return {
          log: function(...args) { return log.applySync(undefined, args); },
          info: function(...args) { return log.applySync(undefined, ['[INFO]', ...args]); },
          warn: function(...args) { return log.applySync(undefined, ['[WARN]', ...args]); },
          error: function(...args) { return log.applySync(undefined, ['[ERROR]', ...args]); },
        };
      })
    `);
    await consoleObject.apply(undefined, [logFunction]);
    await context.global.set('console', consoleObject);

    // Prepare code
    const wrappedCode = `
      (async function() {
        try {
          ${options.code}
        } catch (error) {
          console.error('Runtime error:', error.message);
          throw error;
        }
      })();
    `;

    try {
      // Compile script
      const script = await isolate.compileScript(wrappedCode);

      // Run with timeout
      await script.run(context, { timeout, promise: true });

      // Collect output
      result.output = outputLines.join('\n');
      
      // Get memory usage
      const heapStats = isolate.getHeapStatisticsSync();
      result.memoryUsed = heapStats.used_heap_size;

      const metrics = this.metrics.get(id);
      if (metrics) {
        metrics.memoryPeak = heapStats.used_heap_size;
        metrics.outputSize = result.output.length;
      }

      this.emit('execution:output', { id, output: result.output });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          result.status = 'timeout';
          result.error = `Execution timeout after ${timeout}ms`;
        } else {
          result.error = error.message;
        }
        result.output = outputLines.join('\n');
      }
      throw error;
    } finally {
      // Cleanup
      logFunction.release();
      context.release();
      isolate.dispose();
    }
  }

  /**
   * Execute TypeScript code
   * For now, we'll just throw an error and recommend JavaScript
   */
  private async executeTypeScript(_id: string, _options: ExecutionOptions): Promise<void> {
    // In a real implementation, you would:
    // 1. Use @typescript-eslint/typescript-estree to parse TS
    // 2. Use ts.transpileModule to convert to JS
    // 3. Run the resulting JS through executeJavaScript
    
    throw new Error(
      'TypeScript execution requires transpilation. ' +
      'Please transpile your TypeScript code to JavaScript first, ' +
      'or use the built-in TypeScript compiler.'
    );
  }

  /**
   * Get execution result
   */
  getResult(id: string): ExecutionResult | undefined {
    return this.executions.get(id);
  }

  /**
   * Get execution metrics
   */
  getMetrics(id: string): ExecutionMetrics | undefined {
    return this.metrics.get(id);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(id: string): Promise<void> {
    const result = this.executions.get(id);
    if (!result) {
      throw new Error('Execution not found');
    }

    if (result.status === 'running') {
      result.status = 'cancelled';
      result.error = 'Execution cancelled by user';
      this.emit('execution:cancelled', { id });
      logger.info(`Execution ${id} cancelled`);
    }
  }

  /**
   * Clear old executions
   */
  clearOldExecutions(maxAge: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, metrics] of this.metrics.entries()) {
      if (metrics.endTime && now - metrics.endTime > maxAge) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.executions.delete(id);
      this.metrics.delete(id);
    }

    if (toDelete.length > 0) {
      logger.info(`Cleared ${toDelete.length} old execution(s)`);
    }
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    avgRuntime: number;
    activeExecutions: number;
    maxConcurrent: number;
  } {
    const results = Array.from(this.executions.values());
    
    return {
      total: results.length,
      running: results.filter(r => r.status === 'running').length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'error').length,
      avgRuntime: results.length > 0
        ? results.reduce((sum, r) => sum + r.runtime, 0) / results.length
        : 0,
      activeExecutions: this.activeExecutions,
      maxConcurrent: this.MAX_CONCURRENT_EXECUTIONS,
    };
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(code: string): string {
    const timestamp = Date.now().toString();
    const hash = createHash('sha256')
      .update(code + timestamp)
      .digest('hex')
      .substring(0, 8);
    return `exec_${timestamp}_${hash}`;
  }

  /**
   * List all executions
   */
  listExecutions(): ExecutionResult[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Singleton instance
export const executionService = new ExecutionService();

// Auto-cleanup old executions every hour
setInterval(() => {
  executionService.clearOldExecutions();
}, 3600000);
