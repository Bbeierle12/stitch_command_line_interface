/**
 * Backend API Service
 * Real implementation of data fetching from backend APIs
 */

import { apiClient } from './apiClient';
import type { PreviewMode, PreviewState, CiState, SecState } from '../types';

export interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface LogLine {
  id: number;
  tag: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
}

export interface NetworkFlow {
  id: string;
  app: string;
  dest: string;
  status: 'allow' | 'watch' | 'block';
  bytesTotal: number;
  startedAt: string;
}

export interface Notification {
  id: string;
  bucket: string;
  text: string;
  severity: 'low' | 'med' | 'high';
  timestamp: string;
  read: boolean;
}

export interface EditorState {
  currentFile: string;
  branch: string;
  diagnostics: {
    error: number;
    warn: number;
    info: number;
  };
  dirty: boolean;
  recent: Array<{ file: string; delta: string }>;
}

export interface Snapshot {
  id: string;
  timestamp: string | null;
  label: string;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  preview?: string;
  risk?: string;
  estimatedDuration?: number;
  duration?: number;
}

class BackendApiService {
  /**
   * Get preview state for specified mode
   */
  async getPreviewState(mode: PreviewMode): Promise<PreviewState> {
    return await apiClient.get<PreviewState>(`/preview/${mode}`);
  }

  /**
   * Get CI/CD status
   */
  async getCiState(): Promise<CiState> {
    return await apiClient.get<CiState>('/ci/status');
  }

  /**
   * Get CI logs for a specific ref
   */
  async getCiLogs(ref: string): Promise<{ ref: string; logs: string; artifacts: string[] }> {
    return await apiClient.get(`/ci/logs/${ref}`);
  }

  /**
   * Trigger CI pipeline run
   */
  async triggerCiRun(): Promise<{ success: boolean; runId: string }> {
    return await apiClient.post('/ci/run');
  }

  /**
   * Get security state
   */
  async getSecState(): Promise<SecState> {
    return await apiClient.get<SecState>('/security/status');
  }

  /**
   * Execute panic/emergency lockdown
   */
  async executePanic(reason: string): Promise<{ success: boolean; actions: string[] }> {
    return await apiClient.post('/security/panic', { confirm: true, reason });
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<{
    cpu: { usage: number; cores: number; temperature: number };
    memory: { used: number; total: number; unit: string };
    battery: { charging: boolean; percentage: number; timeRemaining: number | null };
    network: { rx: number; tx: number; unit: string };
  }> {
    return await apiClient.get('/system/metrics');
  }

  /**
   * Get network flows
   */
  async getNetworkFlows(): Promise<{ flows: NetworkFlow[] }> {
    return await apiClient.get('/network/flows');
  }

  /**
   * Block a specific network flow
   */
  async blockNetworkFlow(flowId: string): Promise<{ success: boolean; flowId: string; blockedAt: string }> {
    return await apiClient.post(`/network/flows/${flowId}/block`);
  }

  /**
   * Get console logs
   */
  async getConsoleLogs(limit = 100, since?: string): Promise<{ logs: LogLine[] }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (since) {
      params.append('since', since);
    }
    return await apiClient.get(`/logs/stream?${params.toString()}`);
  }

  /**
   * Get editor status
   */
  async getEditorStatus(): Promise<EditorState> {
    return await apiClient.get<EditorState>('/editor/status');
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<{ notifications: Notification[] }> {
    return await apiClient.get('/notifications');
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return await apiClient.post(`/notifications/${notificationId}/read`);
  }

  /**
   * Execute command
   */
  async executeCommand(cmd: { id: string; label: string; risk?: string }, dryRun = false): Promise<CommandResult> {
    return await apiClient.post('/commands/execute', { 
      commandId: cmd.id, 
    args: [], 
      dryRun 
    });
  }

  /**
   * Get LLM explanation for context
   */
  async getLlmExplanation(
    context: string,
    data: Record<string, unknown>
  ): Promise<{
    explanation: string;
    suggestedActions: Array<{ id: string; label: string; command: string }>;
  }> {
    return await apiClient.post('/llm/explain', { context, data });
  }

  /**
   * Get available snapshots
   */
  async getSnapshots(): Promise<{ snapshots: Snapshot[] }> {
    return await apiClient.get('/snapshots');
  }

  /**
   * Get snapshot data by ID
   */
  async getSnapshotData(snapshotId: string): Promise<{
    ci: CiState;
    security: SecState;
    system: unknown;
    network: { flows: NetworkFlow[] };
    logs: { logs: LogLine[] };
  }> {
    return await apiClient.get(`/snapshots/${snapshotId}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    return await apiClient.get('/health');
  }
}

export const backendApiService = new BackendApiService();
