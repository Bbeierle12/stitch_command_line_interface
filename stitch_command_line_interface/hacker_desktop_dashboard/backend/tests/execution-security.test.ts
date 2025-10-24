/**
 * Execution Service Security Tests
 * Tests for concurrency limits and resource constraints
 */

import { executionService } from '../src/services/executionService';

describe('Execution Service Security Tests', () => {
  beforeAll(() => {
    // Clear any existing executions
    executionService.clearOldExecutions(0);
  });

  describe('Concurrency Limits', () => {
    it('should enforce maximum concurrent executions', async () => {
      const maxConcurrent = 5; // Default value from executionService
      const executions: Promise<string>[] = [];

      // Start max concurrent executions
      for (let i = 0; i < maxConcurrent; i++) {
        executions.push(
          executionService.executeCode({
            code: `console.log("Test ${i}"); await new Promise(r => setTimeout(r, 1000));`,
            language: 'javascript',
            timeout: 5000,
          })
        );
      }

      // Wait a bit for executions to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Next execution should fail due to concurrency limit
      await expect(
        executionService.executeCode({
          code: 'console.log("Should fail");',
          language: 'javascript',
        })
      ).rejects.toThrow('Concurrent execution limit reached');

      // Wait for executions to complete
      await Promise.all(executions);
    }, 10000);

    it('should allow new executions after previous ones complete', async () => {
      // Execute and wait for completion
      const id1 = await executionService.executeCode({
        code: 'console.log("First");',
        language: 'javascript',
        timeout: 1000,
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Second execution should succeed
      const id2 = await executionService.executeCode({
        code: 'console.log("Second");',
        language: 'javascript',
        timeout: 1000,
      });

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Resource Limits', () => {
    it('should timeout long-running executions', async () => {
      const id = await executionService.executeCode({
        code: 'while(true) { }', // Infinite loop
        language: 'javascript',
        timeout: 1000, // 1 second timeout
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      expect(result?.status).toBe('timeout');
      expect(result?.error).toContain('timeout');
    }, 5000);

    it('should enforce memory limits', async () => {
      const id = await executionService.executeCode({
        code: `
          const arr = [];
          for (let i = 0; i < 1000000000; i++) {
            arr.push(new Array(1000).fill('x'));
          }
        `,
        language: 'javascript',
        memoryLimit: 128, // 128MB limit
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      // Should fail due to memory limit or timeout
      expect(['error', 'timeout']).toContain(result?.status);
    }, 7000);

    it('should limit output size', async () => {
      const id = await executionService.executeCode({
        code: `
          for (let i = 0; i < 100000; i++) {
            console.log('x'.repeat(1000));
          }
        `,
        language: 'javascript',
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      
      // Should either complete with limited output or fail with output size error
      if (result?.status === 'error') {
        expect(result.error).toContain('Output size limit exceeded');
      }
    }, 7000);
  });

  describe('Code Isolation', () => {
    it('should execute code in isolated context', async () => {
      // First execution sets a variable
      const id1 = await executionService.executeCode({
        code: 'const secret = "password123"; console.log("First");',
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Second execution should not access the variable
      const id2 = await executionService.executeCode({
        code: 'try { console.log(secret); } catch(e) { console.log("Isolated"); }',
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const result1 = executionService.getResult(id1);
      const result2 = executionService.getResult(id2);

      expect(result1?.status).toBe('completed');
      expect(result2?.status).toBe('completed');
      expect(result2?.output).toContain('Isolated');
    });

    it('should not allow access to process or require', async () => {
      const id = await executionService.executeCode({
        code: `
          try {
            const fs = require('fs');
            console.log("BAD: require worked");
          } catch (e) {
            console.log("GOOD: require blocked");
          }
        `,
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      expect(result?.output).toContain('GOOD: require blocked');
    });
  });

  describe('Execution Stats', () => {
    it('should track active executions count', async () => {
      const statsBefore = executionService.getStats();
      
      const execution = executionService.executeCode({
        code: 'await new Promise(r => setTimeout(r, 500)); console.log("Done");',
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const statsDuring = executionService.getStats();
      expect(statsDuring.activeExecutions).toBeGreaterThan(statsBefore.activeExecutions);

      await execution;
      await new Promise(resolve => setTimeout(resolve, 100));

      const statsAfter = executionService.getStats();
      expect(statsAfter.activeExecutions).toBeLessThanOrEqual(statsDuring.activeExecutions);
    }, 5000);

    it('should include max concurrent limit in stats', () => {
      const stats = executionService.getStats();
      expect(stats.maxConcurrent).toBeDefined();
      expect(stats.maxConcurrent).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const id = await executionService.executeCode({
        code: 'this is not valid javascript syntax {{{',
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      expect(result?.status).toBe('error');
      expect(result?.error).toBeDefined();
    });

    it('should handle runtime errors gracefully', async () => {
      const id = await executionService.executeCode({
        code: 'throw new Error("Test error");',
        language: 'javascript',
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const result = executionService.getResult(id);
      expect(result).toBeDefined();
      expect(result?.status).toBe('error');
      expect(result?.output).toContain('Test error');
    });

    it('should reject unsupported languages', async () => {
      await expect(
        executionService.executeCode({
          code: 'print("hello")',
          language: 'python' as any, // TypeScript currently not supported
        })
      ).rejects.toThrow();
    });
  });
});
