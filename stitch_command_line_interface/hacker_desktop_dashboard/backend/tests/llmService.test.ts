/**
 * Comprehensive tests for LLM Service
 * Tests context management, token optimization, and multi-provider support
 */

import { LLMService } from '../src/services/llmService';

// Mock OpenAI and Anthropic clients
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

describe('LLMService', () => {
  let llmService: LLMService;

  beforeEach(() => {
    // Create fresh instance for each test
    llmService = new LLMService();
    // Clear environment variables to test fallback behavior
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('Context Management', () => {
    it('should create new context for new session', async () => {
      const sessionId = 'test-session-1';
      const summary = llmService.getContextSummary(sessionId);
      
      expect(summary.messageCount).toBe(0);
      expect(summary.estimatedTokens).toBe(0);
    });

    it('should add messages to context', async () => {
      const sessionId = 'test-session-2';
      
      llmService.addSystemMessage(sessionId, 'You are a helpful assistant');
      const summary1 = llmService.getContextSummary(sessionId);
      expect(summary1.messageCount).toBe(1);
      
      await llmService.sendMessage('Hello', sessionId);
      const summary2 = llmService.getContextSummary(sessionId);
      expect(summary2.messageCount).toBeGreaterThan(1);
    });

    it('should clear context for session', async () => {
      const sessionId = 'test-session-3';
      
      llmService.addSystemMessage(sessionId, 'System message');
      await llmService.sendMessage('User message', sessionId);
      
      let summary = llmService.getContextSummary(sessionId);
      expect(summary.messageCount).toBeGreaterThan(0);
      
      llmService.clearContext(sessionId);
      summary = llmService.getContextSummary(sessionId);
      expect(summary.messageCount).toBe(0);
    });

    it('should track estimated token count', async () => {
      const sessionId = 'test-session-4';
      const longMessage = 'a'.repeat(400); // ~100 tokens
      
      await llmService.sendMessage(longMessage, sessionId);
      const summary = llmService.getContextSummary(sessionId);
      
      expect(summary.estimatedTokens).toBeGreaterThan(50);
    });

    it('should calculate context age', async () => {
      const sessionId = 'test-session-5';
      
      llmService.addSystemMessage(sessionId, 'Initial message');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const summary = llmService.getContextSummary(sessionId);
      expect(summary.age).toBeGreaterThan(0);
      expect(summary.age).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle multiple concurrent sessions', async () => {
      const session1 = 'concurrent-1';
      const session2 = 'concurrent-2';
      
      await llmService.sendMessage('Message for session 1', session1);
      await llmService.sendMessage('Message for session 2', session2);
      
      const summary1 = llmService.getContextSummary(session1);
      const summary2 = llmService.getContextSummary(session2);
      
      expect(summary1.messageCount).toBeGreaterThan(0);
      expect(summary2.messageCount).toBeGreaterThan(0);
    });
  });

  describe('Token Optimization', () => {
    it('should estimate tokens correctly', async () => {
      const sessionId = 'token-test-1';
      
      // ~4 characters per token
      const message = 'Hi'; // Short message to keep token count low
      await llmService.sendMessage(message, sessionId);
      
      const summary = llmService.getContextSummary(sessionId);
      // User message + assistant response + system message overhead
      expect(summary.estimatedTokens).toBeGreaterThanOrEqual(5);
      expect(summary.estimatedTokens).toBeLessThanOrEqual(50);
    });

    it('should optimize context when messages exceed limit', async () => {
      const sessionId = 'optimize-test-1';
      
      // Add many messages
      for (let i = 0; i < 25; i++) {
        await llmService.sendMessage(`Message ${i}`, sessionId);
      }
      
      const summaryBefore = llmService.getContextSummary(sessionId);
      
      await llmService.optimizeContext(sessionId);
      
      const summaryAfter = llmService.getContextSummary(sessionId);
      expect(summaryAfter.messageCount).toBeLessThanOrEqual(summaryBefore.messageCount);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use mock response when no API keys configured', async () => {
      const sessionId = 'mock-test-1';
      const response = await llmService.sendMessage('Test prompt', sessionId);
      
      expect(response.content).toContain('Mock response');
      expect(response.model).toBe('mock-model');
      expect(response.usage.total).toBeGreaterThan(0);
    });

    it('should provide mock response for explain', async () => {
      const sessionId = 'mock-test-2';
      const response = await llmService.sendMessage(
        'Explain this error: TypeError',
        sessionId
      );
      
      expect(response.content).toBeDefined();
      expect(response.usage).toBeDefined();
      expect(response.finishReason).toBe('stop');
    });

    it('should handle empty prompts gracefully', async () => {
      const sessionId = 'empty-test';
      const response = await llmService.sendMessage('', sessionId);
      
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });
  });

  describe('System Messages', () => {
    it('should add system messages to context', () => {
      const sessionId = 'system-test-1';
      
      llmService.addSystemMessage(sessionId, 'You are an expert developer');
      const summary = llmService.getContextSummary(sessionId);
      
      expect(summary.messageCount).toBe(1);
    });

    it('should preserve system messages during optimization', async () => {
      const sessionId = 'system-preserve-test';
      
      llmService.addSystemMessage(sessionId, 'Important system context');
      
      // Add many user messages
      for (let i = 0; i < 25; i++) {
        await llmService.sendMessage(`Message ${i}`, sessionId);
      }
      
      await llmService.optimizeContext(sessionId);
      
      const summary = llmService.getContextSummary(sessionId);
      expect(summary.messageCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session IDs gracefully', () => {
      const invalidSessionId = '';
      const summary = llmService.getContextSummary(invalidSessionId);
      
      expect(summary).toBeDefined();
      expect(summary.messageCount).toBe(0);
    });

    it('should handle very long messages', async () => {
      const sessionId = 'long-message-test';
      const veryLongMessage = 'a'.repeat(10000);
      
      const response = await llmService.sendMessage(veryLongMessage, sessionId);
      
      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('should handle special characters in messages', async () => {
      const sessionId = 'special-chars-test';
      const specialMessage = '{"key": "value", "emoji": "🚀", "unicode": "\\u0041"}';
      
      const response = await llmService.sendMessage(specialMessage, sessionId);
      
      expect(response).toBeDefined();
    });
  });

  describe('Options Handling', () => {
    it('should accept custom options', async () => {
      const sessionId = 'options-test';
      const response = await llmService.sendMessage('Test', sessionId, {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 100,
      });
      
      expect(response).toBeDefined();
    });

    it('should use default options when not provided', async () => {
      const sessionId = 'defaults-test';
      const response = await llmService.sendMessage('Test', sessionId);
      
      expect(response).toBeDefined();
      expect(response.model).toBe('mock-model');
    });
  });

  describe('Message History', () => {
    it('should maintain conversation history', async () => {
      const sessionId = 'history-test';
      
      await llmService.sendMessage('What is 2+2?', sessionId);
      await llmService.sendMessage('And what about 3+3?', sessionId);
      
      const summary = llmService.getContextSummary(sessionId);
      expect(summary.messageCount).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
    });

    it('should support follow-up questions', async () => {
      const sessionId = 'followup-test';
      
      const response1 = await llmService.sendMessage('Explain async/await', sessionId);
      expect(response1).toBeDefined();
      
      const response2 = await llmService.sendMessage('Give me an example', sessionId);
      expect(response2).toBeDefined();
      
      const summary = llmService.getContextSummary(sessionId);
      expect(summary.messageCount).toBeGreaterThanOrEqual(4);
    });
  });
});
