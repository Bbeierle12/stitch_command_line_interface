/**
 * LLM Integration Service
 * Provides AI-powered code analysis, explanations, and suggestions
 */

import { apiClient } from './apiClient';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface LLMContext {
  type: 'ci-failure' | 'security-alert' | 'code-error' | 'optimization' | 'general';
  data: Record<string, unknown>;
  history?: LLMMessage[];
}

export interface LLMResponse {
  explanation: string;
  suggestedActions?: Array<{
    id: string;
    label: string;
    command?: string;
    description?: string;
    risk?: 'low' | 'med' | 'high';
  }>;
  confidence?: number;
  model?: string;
  tokensUsed?: number;
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  context?: string;
  analysisType?: 'security' | 'performance' | 'style' | 'bugs';
}

export interface CodeAnalysisResponse {
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    line?: number;
    column?: number;
    message: string;
    suggestion?: string;
  }>;
  summary: string;
  recommendations: string[];
}

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  context?: string;
  maxTokens?: number;
}

export interface CodeGenerationResponse {
  code: string;
  explanation: string;
  language: string;
}

class LLMIntegrationService {
  private conversationHistory: Map<string, LLMMessage[]> = new Map();
  private maxHistoryLength = 10;
  private provider: 'openai' | 'anthropic' = 'openai';
  private model: string = 'gpt-4-turbo-preview';

  constructor() {
    this.loadConfig();
  }

  /**
   * Load LLM configuration from environment
   */
  private loadConfig(): void {
    if (import.meta.env.VITE_LLM_PROVIDER) {
      this.provider = import.meta.env.VITE_LLM_PROVIDER as 'openai' | 'anthropic';
    }
    if (import.meta.env.VITE_LLM_MODEL) {
      this.model = import.meta.env.VITE_LLM_MODEL;
    }
  }

  /**
   * Get explanation for a given context
   */
  async explain(context: LLMContext): Promise<LLMResponse> {
    try {
      const messages = this.buildMessageChain(context);
      
      const response = await apiClient.post<LLMResponse>('/llm/explain', {
        context: context.type,
        data: context.data,
        messages,
        provider: this.provider,
        model: this.model,
      });

      // Update conversation history
      if (context.type !== 'general') {
        this.addToHistory(context.type, {
          role: 'assistant',
          content: response.explanation,
          timestamp: new Date().toISOString(),
        });
      }

      return response;
    } catch (error) {
      console.error('LLM explanation failed:', error);
      throw new Error('Failed to get AI explanation. Please try again.');
    }
  }

  /**
   * Analyze code for issues and improvements
   */
  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    try {
      return await apiClient.post<CodeAnalysisResponse>('/llm/analyze-code', {
        ...request,
        provider: this.provider,
        model: this.model,
      });
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new Error('Failed to analyze code. Please try again.');
    }
  }

  /**
   * Generate code from prompt
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      return await apiClient.post<CodeGenerationResponse>('/llm/generate-code', {
        ...request,
        provider: this.provider,
        model: this.model,
      });
    } catch (error) {
      console.error('Code generation failed:', error);
      throw new Error('Failed to generate code. Please try again.');
    }
  }

  /**
   * Get code completion suggestions
   */
  async getCompletions(
    code: string,
    cursorPosition: number,
    language: string
  ): Promise<string[]> {
    try {
      const response = await apiClient.post<{ completions: string[] }>('/llm/completions', {
        code,
        cursorPosition,
        language,
        provider: this.provider,
        model: this.model,
      });
      return response.completions;
    } catch (error) {
      console.error('Completions failed:', error);
      return [];
    }
  }

  /**
   * Explain CI/CD failure
   */
  async explainCiFailure(logsRef: string, failedTests: string[]): Promise<LLMResponse> {
    return await this.explain({
      type: 'ci-failure',
      data: {
        logsRef,
        failedTests,
      },
    });
  }

  /**
   * Explain security alert
   */
  async explainSecurityAlert(alertId: string, alertDetails: Record<string, unknown>): Promise<LLMResponse> {
    return await this.explain({
      type: 'security-alert',
      data: {
        alertId,
        ...alertDetails,
      },
    });
  }

  /**
   * Suggest fix for code error
   */
  async suggestErrorFix(
    error: string,
    code: string,
    stackTrace?: string
  ): Promise<LLMResponse> {
    return await this.explain({
      type: 'code-error',
      data: {
        error,
        code,
        stackTrace,
      },
    });
  }

  /**
   * Get optimization suggestions
   */
  async getOptimizationSuggestions(
    code: string,
    metrics: Record<string, unknown>
  ): Promise<LLMResponse> {
    return await this.explain({
      type: 'optimization',
      data: {
        code,
        metrics,
      },
    });
  }

  /**
   * Chat with LLM (general conversation)
   */
  async chat(
    message: string,
    conversationId = 'default'
  ): Promise<LLMResponse> {
    const history = this.getHistory(conversationId);
    
    // Add user message to history
    this.addToHistory(conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    const response = await this.explain({
      type: 'general',
      data: { message },
      history,
    });

    // Add assistant response to history
    this.addToHistory(conversationId, {
      role: 'assistant',
      content: response.explanation,
      timestamp: new Date().toISOString(),
    });

    return response;
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId?: string): void {
    if (conversationId) {
      this.conversationHistory.delete(conversationId);
    } else {
      this.conversationHistory.clear();
    }
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string): LLMMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Build message chain with history
   */
  private buildMessageChain(context: LLMContext): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // Add system message based on context type
    messages.push({
      role: 'system',
      content: this.getSystemPrompt(context.type),
    });

    // Add conversation history if provided
    if (context.history && context.history.length > 0) {
      messages.push(...context.history.slice(-this.maxHistoryLength));
    }

    // Add current context as user message
    messages.push({
      role: 'user',
      content: this.formatContextData(context.type, context.data),
    });

    return messages;
  }

  /**
   * Get system prompt for context type
   */
  private getSystemPrompt(type: LLMContext['type']): string {
    const prompts = {
      'ci-failure': 'You are a DevOps expert helping debug CI/CD failures. Provide concise explanations and actionable fixes.',
      'security-alert': 'You are a security analyst helping investigate and respond to security alerts. Prioritize safety and compliance.',
      'code-error': 'You are a senior software engineer helping debug code errors. Provide clear explanations and suggest fixes.',
      'optimization': 'You are a performance optimization expert. Suggest improvements for code efficiency and resource usage.',
      'general': 'You are a helpful coding assistant. Provide accurate, concise, and actionable advice.',
    };
    return prompts[type];
  }

  /**
   * Format context data for LLM
   */
  private formatContextData(type: LLMContext['type'], data: Record<string, unknown>): string {
    switch (type) {
      case 'ci-failure':
        return `CI/CD pipeline failed. Logs: ${data.logsRef}, Failed tests: ${JSON.stringify(data.failedTests)}`;
      case 'security-alert':
        return `Security alert detected: ${JSON.stringify(data)}`;
      case 'code-error':
        return `Error: ${data.error}\n\nCode:\n${data.code}\n\nStack trace: ${data.stackTrace || 'N/A'}`;
      case 'optimization':
        return `Optimize the following code:\n${data.code}\n\nCurrent metrics: ${JSON.stringify(data.metrics)}`;
      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Add message to conversation history
   */
  private addToHistory(conversationId: string, message: LLMMessage): void {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }

    const history = this.conversationHistory.get(conversationId)!;
    history.push(message);

    // Trim history if it exceeds max length
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  /**
   * Get token count estimate (rough approximation)
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Optimize prompt to fit token budget
   */
  optimizePrompt(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Truncate to fit budget (leaving some buffer)
    const targetChars = (maxTokens * 4) * 0.9;
    return text.substring(0, targetChars) + '... [truncated]';
  }
}

export const llmService = new LLMIntegrationService();
