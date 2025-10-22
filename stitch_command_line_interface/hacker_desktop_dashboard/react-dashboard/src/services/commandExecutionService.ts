/**
 * Command Execution Service
 * Handles secure command execution via Electron IPC and backend API
 */

import { apiClient } from './apiClient';
import { isElectron } from './electronService';

export interface Command {
  id: string;
  label: string;
  verb: string;
  risk: 'low' | 'med' | 'high';
  preview: string;
  description?: string;
  category?: string;
  requiresConfirmation?: boolean;
}

export interface CommandExecutionOptions {
  dryRun?: boolean;
  args?: string[];
  timeout?: number;
  captureOutput?: boolean;
}

export interface CommandExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  duration: number;
  timestamp: string;
}

export interface CommandValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  estimatedDuration?: number;
  riskscore?: number;
}

class CommandExecutionService {
  private executionHistory: CommandExecutionResult[] = [];
  private maxHistorySize = 100;

  /**
   * Get available commands
   */
  async getCommands(): Promise<Command[]> {
    try {
      const response = await apiClient.get<{ commands: Command[] }>('/commands/list');
      return response.commands;
    } catch (error) {
      console.error('Failed to fetch commands:', error);
      return this.getDefaultCommands();
    }
  }

  /**
   * Validate command before execution
   */
  async validateCommand(commandId: string, args: string[] = []): Promise<CommandValidationResult> {
    try {
      return await apiClient.post<CommandValidationResult>('/commands/validate', {
        commandId,
        args,
      });
    } catch (error) {
      console.error('Command validation failed:', error);
      return {
        valid: false,
        errors: ['Validation service unavailable'],
      };
    }
  }

  /**
   * Execute command with given options
   */
  async executeCommand(
    commandId: string,
    options: CommandExecutionOptions = {}
  ): Promise<CommandExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate command first unless it's a dry run
      if (!options.dryRun) {
        const validation = await this.validateCommand(commandId, options.args);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.errors?.join(', ') || 'Command validation failed',
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Execute via Electron IPC if available (for local commands)
      if (isElectron() && this.isLocalCommand(commandId)) {
        return await this.executeViaElectron(commandId, options);
      }

      // Otherwise execute via backend API
      return await this.executeViaBackend(commandId, options);
    } catch (error) {
      const result: CommandExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(result);
      return result;
    }
  }

  /**
   * Execute command via backend API
   */
  private async executeViaBackend(
    commandId: string,
    options: CommandExecutionOptions
  ): Promise<CommandExecutionResult> {
    const startTime = Date.now();

    try {
      const response = await apiClient.post<{
        success: boolean;
        output?: string;
        preview?: string;
        exitCode?: number;
        error?: string;
      }>('/commands/execute', {
        commandId,
        args: options.args || [],
        dryRun: options.dryRun || false,
        captureOutput: options.captureOutput ?? true,
      });

      const result: CommandExecutionResult = {
        success: response.success,
        output: response.output || response.preview,
        error: response.error,
        exitCode: response.exitCode,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(result);
      return result;
    } catch (error) {
      throw new Error(`Backend execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute command via Electron IPC
   */
  private async executeViaElectron(
    commandId: string,
    options: CommandExecutionOptions
  ): Promise<CommandExecutionResult> {
    const startTime = Date.now();

    try {
      const response = await window.electronAPI.executeCommand({
        commandId,
        args: options.args || [],
        dryRun: options.dryRun || false,
        timeout: options.timeout,
      });

      const result: CommandExecutionResult = {
        success: response.success,
        output: response.stdout || response.stderr,
        error: response.error,
        exitCode: response.exitCode,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(result);
      return result;
    } catch (error) {
      throw new Error(`Electron IPC execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream command output in real-time
   */
  async streamCommandOutput(
    commandId: string,
    onData: (chunk: string) => void,
    options: CommandExecutionOptions = {}
  ): Promise<CommandExecutionResult> {
    if (isElectron()) {
      return await this.streamViaElectron(commandId, onData, options);
    }

    // For web, fall back to regular execution
    const result = await this.executeCommand(commandId, options);
    if (result.output) {
      onData(result.output);
    }
    return result;
  }

  /**
   * Stream command output via Electron
   */
  private async streamViaElectron(
    commandId: string,
    onData: (chunk: string) => void,
    options: CommandExecutionOptions
  ): Promise<CommandExecutionResult> {
    const startTime = Date.now();

    try {
      const response = await window.electronAPI.streamCommand({
        commandId,
        args: options.args || [],
        timeout: options.timeout,
      }, onData);

      const result: CommandExecutionResult = {
        success: response.success,
        exitCode: response.exitCode,
        error: response.error,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.addToHistory(result);
      return result;
    } catch (error) {
      throw new Error(`Stream execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get command execution history
   */
  getHistory(limit?: number): CommandExecutionResult[] {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Check if command should be executed locally
   */
  private isLocalCommand(commandId: string): boolean {
    const localCommands = [
      'restart-dev',
      'run-tests',
      'build',
      'lint',
      'format',
      'git-status',
      'git-commit',
    ];
    return localCommands.includes(commandId);
  }

  /**
   * Add result to history
   */
  private addToHistory(result: CommandExecutionResult): void {
    this.executionHistory.push(result);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Get default commands (fallback)
   */
  private getDefaultCommands(): Command[] {
    return [
      {
        id: 'restart-dev',
        label: 'Restart Dev Server',
        verb: 'restart',
        risk: 'low',
        preview: 'npm run dev',
        description: 'Restart the development server',
        category: 'development',
      },
      {
        id: 'run-tests',
        label: 'Run Tests',
        verb: 'test',
        risk: 'low',
        preview: 'npm test',
        description: 'Run all test suites',
        category: 'testing',
      },
      {
        id: 'build',
        label: 'Build Production',
        verb: 'build',
        risk: 'med',
        preview: 'npm run build',
        description: 'Create production build',
        category: 'build',
      },
      {
        id: 'security-scan',
        label: 'Security Scan',
        verb: 'scan',
        risk: 'low',
        preview: 'npm audit',
        description: 'Run security vulnerability scan',
        category: 'security',
      },
      {
        id: 'clear-cache',
        label: 'Clear Cache',
        verb: 'clear',
        risk: 'med',
        preview: 'rm -rf node_modules/.cache',
        description: 'Clear build and dependency cache',
        category: 'maintenance',
      },
    ];
  }
}

export const commandExecutionService = new CommandExecutionService();
