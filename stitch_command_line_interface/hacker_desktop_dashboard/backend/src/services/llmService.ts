/**
 * LLM Service with Context Management
 * Handles AI interactions with intelligent context building and token optimization
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface LLMContext {
  messages: LLMMessage[];
  metadata?: Record<string, unknown>;
  tokenCount?: number;
}

export interface LLMOptions {
  provider?: 'openai' | 'anthropic';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
}

// Context Management
class ContextManager {
  private conversations: Map<string, LLMContext> = new Map();
  private readonly MAX_CONTEXT_AGE_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_MESSAGES_PER_CONTEXT = 20;

  /**
   * Get or create conversation context
   */
  getContext(sessionId: string): LLMContext {
    const existing = this.conversations.get(sessionId);
    
    if (existing) {
      // Clean up old messages
      const now = new Date();
      existing.messages = existing.messages.filter(msg => {
        if (!msg.timestamp) return true;
        return now.getTime() - msg.timestamp.getTime() < this.MAX_CONTEXT_AGE_MS;
      });
      
      // Limit message count (keep system messages + recent history)
      if (existing.messages.length > this.MAX_MESSAGES_PER_CONTEXT) {
        const systemMessages = existing.messages.filter(m => m.role === 'system');
        const otherMessages = existing.messages
          .filter(m => m.role !== 'system')
          .slice(-this.MAX_MESSAGES_PER_CONTEXT + systemMessages.length);
        existing.messages = [...systemMessages, ...otherMessages];
      }
      
      return existing;
    }

    const newContext: LLMContext = {
      messages: [],
      metadata: {},
      tokenCount: 0,
    };
    
    this.conversations.set(sessionId, newContext);
    return newContext;
  }

  /**
   * Add message to context
   */
  addMessage(sessionId: string, role: LLMMessage['role'], content: string): void {
    const context = this.getContext(sessionId);
    context.messages.push({
      role,
      content,
      timestamp: new Date(),
    });
    
    // Estimate token count (rough approximation: ~4 chars per token)
    const estimatedTokens = Math.ceil(content.length / 4);
    context.tokenCount = (context.tokenCount || 0) + estimatedTokens;
  }

  /**
   * Clear context for session
   */
  clearContext(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get context summary
   */
  getContextSummary(sessionId: string): {
    messageCount: number;
    estimatedTokens: number;
    age: number;
  } {
    const context = this.getContext(sessionId);
    const oldestMessage = context.messages[0];
    const age = oldestMessage?.timestamp 
      ? Date.now() - oldestMessage.timestamp.getTime()
      : 0;

    return {
      messageCount: context.messages.length,
      estimatedTokens: context.tokenCount || 0,
      age,
    };
  }

  /**
   * Optimize context by summarizing old messages
   */
  async optimizeContext(sessionId: string, summarizer: (messages: LLMMessage[]) => Promise<string>): Promise<void> {
    const context = this.getContext(sessionId);
    
    if (context.messages.length <= this.MAX_MESSAGES_PER_CONTEXT) {
      return;
    }

    // Keep system messages and recent messages
    const systemMessages = context.messages.filter(m => m.role === 'system');
    const recentMessages = context.messages.slice(-10);
    const oldMessages = context.messages.slice(systemMessages.length, -10);

    if (oldMessages.length === 0) {
      return;
    }

    try {
      // Summarize old messages
      const summary = await summarizer(oldMessages);
      
      // Replace old messages with summary
      context.messages = [
        ...systemMessages,
        {
          role: 'system',
          content: `Previous conversation summary: ${summary}`,
          timestamp: new Date(),
        },
        ...recentMessages,
      ];

      // Recalculate token count
      const totalContent = context.messages.map(m => m.content).join('');
      context.tokenCount = Math.ceil(totalContent.length / 4);

      logger.info(`Optimized context for session ${sessionId}: ${oldMessages.length} messages summarized`);
    } catch (error) {
      logger.error('Failed to optimize context:', error);
    }
  }
}

/**
 * LLM Service
 */
export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private contextManager: ContextManager;
  private readonly DEFAULT_MODEL_OPENAI = 'gpt-4-turbo-preview';
  private readonly DEFAULT_MODEL_ANTHROPIC = 'claude-3-sonnet-20240229';

  constructor() {
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic client
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    this.contextManager = new ContextManager();

    if (!this.openai && !this.anthropic) {
      logger.warn('No LLM API keys configured. LLM features will use fallback responses.');
    }
  }

  /**
   * Send a message with context management
   */
  async sendMessage(
    prompt: string,
    sessionId: string,
    options: LLMOptions = {}
  ): Promise<LLMResponse> {
    const provider = options.provider || 'openai';
    const context = this.contextManager.getContext(sessionId);

    // Add user message to context
    this.contextManager.addMessage(sessionId, 'user', prompt);

    try {
      let response: LLMResponse;

      if (provider === 'openai' && this.openai) {
        response = await this.sendToOpenAI(context, options);
      } else if (provider === 'anthropic' && this.anthropic) {
        response = await this.sendToAnthropic(context, options);
      } else {
        // Fallback mock response
        response = this.getMockResponse(prompt);
      }

      // Add assistant response to context
      this.contextManager.addMessage(sessionId, 'assistant', response.content);

      return response;
    } catch (error) {
      logger.error('LLM request failed:', error);
      throw error;
    }
  }

  /**
   * Send to OpenAI
   */
  private async sendToOpenAI(context: LLMContext, options: LLMOptions): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const completion = await this.openai.chat.completions.create({
      model: options.model || this.DEFAULT_MODEL_OPENAI,
      messages: context.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: false, // Ensure we get a non-streaming response
    });

    // Type guard to ensure we have a ChatCompletion
    if ('choices' in completion) {
      const choice = completion.choices[0];
      
      return {
        content: choice.message.content || '',
        usage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
        model: completion.model,
        finishReason: choice.finish_reason,
      };
    }

    throw new Error('Unexpected response type from OpenAI');
  }

  /**
   * Send to Anthropic
   */
  private async sendToAnthropic(context: LLMContext, options: LLMOptions): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    // Anthropic requires system messages to be separate
    const systemMessages = context.messages.filter(m => m.role === 'system');
    const otherMessages = context.messages.filter(m => m.role !== 'system');

    const message = await this.anthropic.messages.create({
      model: options.model || this.DEFAULT_MODEL_ANTHROPIC,
      max_tokens: options.maxTokens ?? 1000,
      temperature: options.temperature ?? 0.7,
      system: systemMessages.map(m => m.content).join('\n\n'),
      messages: otherMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
    });

    const content = message.content[0];
    
    return {
      content: content.type === 'text' ? content.text : '',
      usage: {
        prompt: message.usage.input_tokens,
        completion: message.usage.output_tokens,
        total: message.usage.input_tokens + message.usage.output_tokens,
      },
      model: message.model,
      finishReason: message.stop_reason || undefined,
    };
  }

  /**
   * Get mock response (fallback when no API key)
   */
  private getMockResponse(prompt: string): LLMResponse {
    return {
      content: `Mock response to: "${prompt}". This is a fallback response because no LLM API key is configured.`,
      usage: {
        prompt: Math.ceil(prompt.length / 4),
        completion: 50,
        total: Math.ceil(prompt.length / 4) + 50,
      },
      model: 'mock-model',
      finishReason: 'stop',
    };
  }

  /**
   * Add system message to context
   */
  addSystemMessage(sessionId: string, content: string): void {
    this.contextManager.addMessage(sessionId, 'system', content);
  }

  /**
   * Get context summary
   */
  getContextSummary(sessionId: string) {
    return this.contextManager.getContextSummary(sessionId);
  }

  /**
   * Clear context
   */
  clearContext(sessionId: string): void {
    this.contextManager.clearContext(sessionId);
  }

  /**
   * Optimize context by summarizing old messages
   */
  async optimizeContext(sessionId: string): Promise<void> {
    await this.contextManager.optimizeContext(sessionId, async (messages) => {
      const combined = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
      const summary = await this.sendMessage(
        `Summarize the following conversation concisely:\n\n${combined}`,
        `${sessionId}-summarizer`,
        { maxTokens: 200 }
      );
      return summary.content;
    });
  }
}

// Singleton instance
export const llmService = new LLMService();
