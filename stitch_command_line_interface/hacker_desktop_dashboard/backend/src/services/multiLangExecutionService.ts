/**
 * Multi-Language Execution Service
 * Executes code in Python, Java, C++, and other languages using Docker containers
 */

import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export type SupportedLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'c' | 'go' | 'rust';

export interface MultiLangExecutionOptions {
  code: string;
  language: SupportedLanguage;
  timeout?: number;
  memoryLimit?: number;
  input?: string;
}

export interface MultiLangExecutionResult {
  id: string;
  status: 'running' | 'completed' | 'error' | 'timeout' | 'cancelled';
  output: string;
  error?: string;
  exitCode: number;
  runtime: number;
  memoryUsed: number;
  language: SupportedLanguage;
  timestamp: Date;
}

/**
 * Language configurations
 */
const LANGUAGE_CONFIG: Record<SupportedLanguage, {
  image: string;
  extension: string;
  compileCommand?: string;
  runCommand: string;
}> = {
  javascript: {
    image: 'node:18-alpine',
    extension: '.js',
    runCommand: 'node /code/main.js',
  },
  python: {
    image: 'python:3.11-alpine',
    extension: '.py',
    runCommand: 'python /code/main.py',
  },
  java: {
    image: 'openjdk:17-alpine',
    extension: '.java',
    compileCommand: 'javac /code/Main.java',
    runCommand: 'java -cp /code Main',
  },
  cpp: {
    image: 'gcc:latest',
    extension: '.cpp',
    compileCommand: 'g++ -o /code/main /code/main.cpp -std=c++17',
    runCommand: '/code/main',
  },
  c: {
    image: 'gcc:latest',
    extension: '.c',
    compileCommand: 'gcc -o /code/main /code/main.c',
    runCommand: '/code/main',
  },
  go: {
    image: 'golang:1.21-alpine',
    extension: '.go',
    runCommand: 'go run /code/main.go',
  },
  rust: {
    image: 'rust:alpine',
    extension: '.rs',
    compileCommand: 'rustc -o /code/main /code/main.rs',
    runCommand: '/code/main',
  },
};

/**
 * Multi-Language Execution Service
 */
export class MultiLangExecutionService extends EventEmitter {
  private docker: Docker;
  private executions: Map<string, MultiLangExecutionResult> = new Map();
  private readonly DEFAULT_TIMEOUT_MS: number;
  private readonly DEFAULT_MEMORY_LIMIT_MB: number;
  private readonly MAX_OUTPUT_SIZE: number;
  private tempDir: string;

  constructor() {
    super();
    this.docker = new Docker();
    this.DEFAULT_TIMEOUT_MS = parseInt(process.env.MAX_EXECUTION_TIME_MS || '30000', 10);
    this.DEFAULT_MEMORY_LIMIT_MB = parseInt(process.env.MAX_MEMORY_MB || '512', 10);
    this.MAX_OUTPUT_SIZE = parseInt(process.env.MAX_OUTPUT_SIZE_KB || '1024', 10) * 1024;
    this.tempDir = path.join(os.tmpdir(), 'secureide');

    // Create temp directory
    fs.mkdir(this.tempDir, { recursive: true }).catch(() => {});

    logger.info('Multi-language execution service initialized');
  }

  /**
   * Execute code in specified language
   */
  async executeCode(options: MultiLangExecutionOptions): Promise<string> {
    const id = this.generateExecutionId(options.code);
    const startTime = Date.now();

    const result: MultiLangExecutionResult = {
      id,
      status: 'running',
      output: '',
      exitCode: 0,
      runtime: 0,
      memoryUsed: 0,
      language: options.language,
      timestamp: new Date(),
    };

    this.executions.set(id, result);
    this.emit('execution:start', { id, options });

    try {
      // Check if Docker is available
      await this.checkDocker();

      // Execute based on language
      await this.executeInDocker(id, options);

      result.status = 'completed';
    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : 'Execution failed';
      result.exitCode = 1;
      logger.error(`Execution ${id} failed:`, error);
    } finally {
      const endTime = Date.now();
      result.runtime = endTime - startTime;
      this.emit('execution:complete', result);
    }

    return id;
  }

  /**
   * Execute code in Docker container
   */
  private async executeInDocker(id: string, options: MultiLangExecutionOptions): Promise<void> {
    const result = this.executions.get(id);
    if (!result) throw new Error('Execution not found');

    const config = LANGUAGE_CONFIG[options.language];
    const timeout = options.timeout || this.DEFAULT_TIMEOUT_MS;
    const memoryLimit = (options.memoryLimit || this.DEFAULT_MEMORY_LIMIT_MB) * 1024 * 1024;

    // Create temporary directory for this execution
    const execDir = path.join(this.tempDir, id);
    await fs.mkdir(execDir, { recursive: true });

    try {
      // Write code to file
      const filename = this.getMainFileName(options.language);
      const filepath = path.join(execDir, filename);
      await fs.writeFile(filepath, options.code, 'utf8');

      // Pull image if not exists
      await this.ensureImage(config.image);

      // Create container
      const container = await this.docker.createContainer({
        Image: config.image,
        Cmd: ['/bin/sh', '-c', this.buildExecutionCommand(options.language)],
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: '/code',
        HostConfig: {
          Binds: [`${execDir}:/code:ro`], // Read-only mount
          Memory: memoryLimit,
          NanoCpus: 1000000000, // 1 CPU
          NetworkMode: 'none', // No network access
          AutoRemove: true,
        },
        Tty: false,
      });

      // Start container
      await container.start();

      // Collect output
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
      });

      let output = '';
      const outputPromise = new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          // Docker multiplexes stdout/stderr - skip 8-byte header
          const data = chunk.slice(8).toString();
          output += data;
          
          if (output.length > this.MAX_OUTPUT_SIZE) {
            container.stop().catch(() => {});
            reject(new Error('Output size limit exceeded'));
          }
        });

        stream.on('end', () => resolve());
        stream.on('error', (err: Error) => reject(err));
      });

      // Wait with timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          container.stop().catch(() => {});
          reject(new Error(`Execution timeout after ${timeout}ms`));
        }, timeout);
      });

      await Promise.race([outputPromise, timeoutPromise]);

      // Get container info
      const containerInfo = await container.inspect();
      result.exitCode = containerInfo.State.ExitCode || 0;
      result.output = output.trim();

      // Estimate memory used
      if (containerInfo.HostConfig.Memory) {
        result.memoryUsed = containerInfo.HostConfig.Memory;
      }

      this.emit('execution:output', { id, output: result.output });

    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        result.status = 'timeout';
        result.error = error.message;
      } else {
        result.error = error instanceof Error ? error.message : 'Docker execution failed';
      }
      throw error;
    } finally {
      // Cleanup
      await fs.rm(execDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Build execution command for language
   */
  private buildExecutionCommand(language: SupportedLanguage): string {
    const config = LANGUAGE_CONFIG[language];
    
    if (config.compileCommand) {
      return `${config.compileCommand} && ${config.runCommand}`;
    }
    
    return config.runCommand;
  }

  /**
   * Get main file name for language
   */
  private getMainFileName(language: SupportedLanguage): string {
    const config = LANGUAGE_CONFIG[language];
    
    if (language === 'java') {
      return 'Main.java'; // Java requires class name to match file name
    }
    
    return `main${config.extension}`;
  }

  /**
   * Check if Docker is available
   */
  private async checkDocker(): Promise<void> {
    try {
      await this.docker.ping();
    } catch (error) {
      throw new Error('Docker is not available. Please ensure Docker is installed and running.');
    }
  }

  /**
   * Ensure Docker image exists
   */
  private async ensureImage(imageName: string): Promise<void> {
    try {
      await this.docker.getImage(imageName).inspect();
    } catch (error) {
      // Image doesn't exist, pull it
      logger.info(`Pulling Docker image: ${imageName}`);
      
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) {
            reject(err);
            return;
          }

          this.docker.modem.followProgress(stream, (pullErr: Error | null) => {
            if (pullErr) {
              reject(pullErr);
            } else {
              logger.info(`Successfully pulled image: ${imageName}`);
              resolve();
            }
          });
        });
      });
    }
  }

  /**
   * Get execution result
   */
  getResult(id: string): MultiLangExecutionResult | undefined {
    return this.executions.get(id);
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
    }
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
    return `mlexec_${timestamp}_${hash}`;
  }

  /**
   * List supported languages
   */
  getSupportedLanguages(): Array<{ language: SupportedLanguage; image: string }> {
    return Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => ({
      language: lang as SupportedLanguage,
      image: config.image,
    }));
  }

  /**
   * List all executions
   */
  listExecutions(): MultiLangExecutionResult[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear old executions
   */
  clearOldExecutions(maxAge: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, result] of this.executions.entries()) {
      if (now - result.timestamp.getTime() > maxAge) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.executions.delete(id);
    }

    if (toDelete.length > 0) {
      logger.info(`Cleared ${toDelete.length} old multi-lang execution(s)`);
    }
  }
}

// Singleton instance
export const multiLangExecutionService = new MultiLangExecutionService();

// Auto-cleanup old executions every hour
setInterval(() => {
  multiLangExecutionService.clearOldExecutions();
}, 3600000);
