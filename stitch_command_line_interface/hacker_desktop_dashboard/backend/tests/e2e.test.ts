/**
 * End-to-End Test Suite
 * Tests complete workflows and feature integration
 */

import request from 'supertest';
import app from '../src/app';

describe('End-to-End Tests', () => {
  describe('Complete CI/CD Workflow', () => {
    it('should fetch CI status, logs, and trigger actions', async () => {
      // Step 1: Get CI status
      const ciRes = await request(app).get('/v1/ci/status');
      expect(ciRes.status).toBe(200);
      expect(ciRes.body).toHaveProperty('build');
      
      const logsRef = ciRes.body.logsRef;
      
      // Step 2: Get related logs
      const logsRes = await request(app).get('/v1/logs/stream?limit=10');
      expect(logsRes.status).toBe(200);
      expect(logsRes.body).toHaveProperty('logs');
      
      // Step 3: If build failed, get explanation from LLM
      if (ciRes.body.build.status === 'fail') {
        const explainRes = await request(app)
          .post('/v1/llm/explain')
          .send({
            context: 'ci-failure',
            data: { logsRef, build: ciRes.body.build },
          });
        
        expect(explainRes.status).toBe(200);
        expect(explainRes.body).toHaveProperty('explanation');
      }
    });
  });

  describe('Security Monitoring Workflow', () => {
    it('should monitor security, detect alerts, and analyze', async () => {
      // Step 1: Get security status
      const secRes = await request(app).get('/v1/security/status');
      expect(secRes.status).toBe(200);
      expect(secRes.body).toHaveProperty('alerts');
      
      // Step 2: Check network flows for suspicious activity
      const flowsRes = await request(app).get('/v1/network/flows');
      expect(flowsRes.status).toBe(200);
      
      const blockedFlows = flowsRes.body.flows.filter(
        (f: any) => f.status === 'block'
      );
      
      // Step 3: If there are blocked flows, get insights
      if (blockedFlows.length > 0) {
        const explainRes = await request(app)
          .post('/v1/llm/explain')
          .send({
            context: 'security-incident',
            data: { blockedFlows },
          });
        
        expect(explainRes.status).toBe(200);
      }
    });
  });

  describe('Development Workflow', () => {
    it('should check editor status, preview, and system metrics', async () => {
      // Step 1: Get editor status
      const editorRes = await request(app).get('/v1/editor/status');
      expect(editorRes.status).toBe(200);
      
      // Step 2: Get preview state
      const previewRes = await request(app).get('/v1/preview/state?mode=browser');
      expect(previewRes.status).toBe(200);
      expect(previewRes.body.mode).toBe('browser');
      
      // Step 3: Check system resources
      const metricsRes = await request(app).get('/v1/system/metrics');
      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body).toHaveProperty('cpu');
      expect(metricsRes.body).toHaveProperty('memory');
      
      // Step 4: If CPU is high, get optimization suggestions
      if (metricsRes.body.cpu.usage > 80) {
        const analyzeRes = await request(app)
          .post('/v1/llm/explain')
          .send({
            context: 'high-cpu',
            data: { metrics: metricsRes.body },
          });
        
        expect(analyzeRes.status).toBe(200);
      }
    });
  });

  describe('Code Analysis Workflow', () => {
    it('should analyze code, get suggestions, and generate improvements', async () => {
      const sampleCode = `
        function processData(data) {
          var result = [];
          for (var i = 0; i < data.length; i++) {
            result.push(data[i] * 2);
          }
          return result;
        }
      `;
      
      // Step 1: Analyze code
      const analyzeRes = await request(app)
        .post('/v1/llm/analyze-code')
        .send({
          code: sampleCode,
          analysisType: 'quality',
        });
      
      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body).toHaveProperty('analysis');
      
      // Step 2: Generate improved version
      const generateRes = await request(app)
        .post('/v1/llm/generate-code')
        .send({
          prompt: 'Improve the processData function using modern JavaScript',
          language: 'javascript',
        });
      
      expect(generateRes.status).toBe(200);
      expect(generateRes.body).toHaveProperty('code');
    });
  });

  describe('Command Execution Workflow', () => {
    it('should validate, preview, and execute commands', async () => {
      const commandId = 'restart-dev';
      
      // Step 1: Validate command
      const validateRes = await request(app)
        .post('/v1/commands/validate')
        .send({ commandId });
      
      expect(validateRes.status).toBe(200);
      
      // Step 2: Preview execution (dry run)
      const previewRes = await request(app)
        .post('/v1/commands/execute')
        .send({ commandId, dryRun: true });
      
      expect(previewRes.status).toBe(200);
      expect(previewRes.body).toHaveProperty('preview');
      
      // Step 3: Check command status
      const statusRes = await request(app)
        .get(`/v1/commands/status/${commandId}`);
      
      expect(statusRes.status).toBe(200);
    });
  });

  describe('Multi-Step LLM Interaction', () => {
    it('should maintain context across multiple interactions', async () => {
      const sessionId = 'e2e-test-session';
      
      // Step 1: First question
      const res1 = await request(app)
        .post('/v1/llm/explain')
        .send({
          context: 'general',
          data: { question: 'What is async/await?' },
          sessionId,
        });
      
      expect(res1.status).toBe(200);
      
      // Step 2: Follow-up question
      const res2 = await request(app)
        .post('/v1/llm/explain')
        .send({
          context: 'general',
          data: { question: 'Give me an example' },
          sessionId,
        });
      
      expect(res2.status).toBe(200);
      
      // Step 3: Check context summary
      const summaryRes = await request(app)
        .get(`/v1/llm/context/summary/${sessionId}`);
      
      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body).toHaveProperty('messageCount');
      expect(summaryRes.body.messageCount).toBeGreaterThan(0);
      
      // Step 4: Clear context
      const clearRes = await request(app)
        .post('/v1/llm/context/clear')
        .send({ sessionId });
      
      expect(clearRes.status).toBe(200);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle errors gracefully and provide recovery options', async () => {
      // Step 1: Trigger an error
      const errorRes = await request(app)
        .post('/v1/llm/analyze-code')
        .send({}); // Missing required field
      
      expect(errorRes.status).toBe(400);
      expect(errorRes.body).toHaveProperty('error');
      
      // Step 2: Verify error structure
      expect(errorRes.body.error).toHaveProperty('code');
      expect(errorRes.body.error).toHaveProperty('message');
      
      // Step 3: Make valid request
      const validRes = await request(app)
        .post('/v1/llm/analyze-code')
        .send({
          code: 'function test() { return 42; }',
        });
      
      expect(validRes.status).toBe(200);
    });
  });

  describe('Data Consistency', () => {
    it('should return consistent data structure across requests', async () => {
      // Make multiple requests to the same endpoint
      const responses = await Promise.all([
        request(app).get('/v1/ci/status'),
        request(app).get('/v1/ci/status'),
        request(app).get('/v1/ci/status'),
      ]);
      
      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('build');
        expect(res.body).toHaveProperty('tests');
        expect(res.body).toHaveProperty('logsRef');
      });
      
      // Structure should be consistent
      const structures = responses.map(r => Object.keys(r.body).sort());
      expect(structures[0]).toEqual(structures[1]);
      expect(structures[1]).toEqual(structures[2]);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Create 20 concurrent requests
      const promises = Array(20).fill(null).map((_, i) => {
        if (i % 4 === 0) return request(app).get('/v1/ci/status');
        if (i % 4 === 1) return request(app).get('/v1/system/metrics');
        if (i % 4 === 2) return request(app).get('/v1/security/status');
        return request(app).get('/v1/network/flows');
      });
      
      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
      
      // Should complete in reasonable time (< 5 seconds for 20 requests)
      expect(duration).toBeLessThan(5000);
    });
  });
});
