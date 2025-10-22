/**
 * Comprehensive Integration Tests for All Routes
 * Tests all API endpoints with various scenarios
 */

import request from 'supertest';
import app from '../src/app';

describe('Route Integration Tests', () => {
  describe('Health & Status', () => {
    it('GET /health should return ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health should include timestamp', async () => {
      const res = await request(app).get('/health');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('CI/CD Routes', () => {
    it('GET /v1/ci/status should return CI state', async () => {
      const res = await request(app).get('/v1/ci/status');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('build');
      expect(res.body).toHaveProperty('tests');
      expect(res.body).toHaveProperty('logsRef');
    });

    it('GET /v1/ci/status should have valid build status', async () => {
      const res = await request(app).get('/v1/ci/status');
      
      expect(['pass', 'fail', 'running']).toContain(res.body.build.status);
    });

    it('GET /v1/ci/status should have numeric metrics', async () => {
      const res = await request(app).get('/v1/ci/status');
      
      expect(typeof res.body.build.durationMs).toBe('number');
      expect(typeof res.body.build.cacheHitPct).toBe('number');
      expect(typeof res.body.tests.pass).toBe('number');
    });
  });

  describe('Security Routes', () => {
    it('GET /v1/security/status should return security state', async () => {
      const res = await request(app).get('/v1/security/status');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vpn');
      expect(res.body).toHaveProperty('firewall');
      expect(res.body).toHaveProperty('encryption');
    });

    it('GET /v1/security/status should have valid status values', async () => {
      const res = await request(app).get('/v1/security/status');
      
      expect(['on', 'off']).toContain(res.body.vpn);
      expect(['on', 'off']).toContain(res.body.firewall);
    });

    it('GET /v1/security/status should include alerts array', async () => {
      const res = await request(app).get('/v1/security/status');
      
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });
  });

  describe('System Routes', () => {
    it('GET /v1/system/metrics should return metrics', async () => {
      const res = await request(app).get('/v1/system/metrics');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('cpu');
      expect(res.body).toHaveProperty('memory');
      expect(res.body).toHaveProperty('battery');
    });

    it('GET /v1/system/metrics should have nested cpu data', async () => {
      const res = await request(app).get('/v1/system/metrics');
      
      expect(res.body.cpu).toHaveProperty('usage');
      expect(res.body.cpu).toHaveProperty('temperature');
      expect(typeof res.body.cpu.usage).toBe('number');
    });

    it('GET /v1/system/metrics should have memory stats', async () => {
      const res = await request(app).get('/v1/system/metrics');
      
      expect(res.body.memory).toHaveProperty('total');
      expect(res.body.memory).toHaveProperty('used');
      expect(res.body.memory).toHaveProperty('free');
    });

    it('GET /v1/system/metrics should have battery info', async () => {
      const res = await request(app).get('/v1/system/metrics');
      
      expect(res.body.battery).toHaveProperty('percentage');
      expect(res.body.battery).toHaveProperty('charging');
      expect(typeof res.body.battery.charging).toBe('boolean');
    });
  });

  describe('Network Routes', () => {
    it('GET /v1/network/flows should return flows', async () => {
      const res = await request(app).get('/v1/network/flows');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('flows');
      expect(Array.isArray(res.body.flows)).toBe(true);
    });

    it('GET /v1/network/flows should have flow metadata', async () => {
      const res = await request(app).get('/v1/network/flows');
      
      if (res.body.flows.length > 0) {
        const flow = res.body.flows[0];
        expect(flow).toHaveProperty('id');
        expect(flow).toHaveProperty('app');
        expect(flow).toHaveProperty('dest');
        expect(flow).toHaveProperty('status');
      }
    });

    it('GET /v1/network/connections should return active connections', async () => {
      const res = await request(app).get('/v1/network/connections');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('connections');
    });
  });

  describe('Logs Routes', () => {
    it('GET /v1/logs/stream should return logs', async () => {
      const res = await request(app).get('/v1/logs/stream');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('logs');
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it('GET /v1/logs/stream should respect limit parameter', async () => {
      const limit = 5;
      const res = await request(app).get(`/v1/logs/stream?limit=${limit}`);
      
      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeLessThanOrEqual(limit);
    });

    it('GET /v1/logs/stream should have log structure', async () => {
      const res = await request(app).get('/v1/logs/stream?limit=1');
      
      if (res.body.logs.length > 0) {
        const log = res.body.logs[0];
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('tag');
        expect(log).toHaveProperty('message');
        expect(log).toHaveProperty('timestamp');
      }
    });

    it('GET /v1/logs/stream should handle invalid limit', async () => {
      const res = await request(app).get('/v1/logs/stream?limit=invalid');
      
      expect(res.status).toBe(200);
    });

    it('GET /v1/logs/stream should handle negative limit', async () => {
      const res = await request(app).get('/v1/logs/stream?limit=-5');
      
      expect(res.status).toBe(200);
    });
  });

  describe('Preview Routes', () => {
    it('GET /v1/preview/state should return preview state', async () => {
      const res = await request(app).get('/v1/preview/state');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mode');
    });

    it('GET /v1/preview/state should accept mode parameter', async () => {
      const modes = ['browser', 'cli', 'tests', 'docs', 'plots'];
      
      for (const mode of modes) {
        const res = await request(app).get(`/v1/preview/state?mode=${mode}`);
        expect(res.status).toBe(200);
        expect(res.body.mode).toBe(mode);
      }
    });

    it('GET /v1/preview/state should have HMR data', async () => {
      const res = await request(app).get('/v1/preview/state');
      
      expect(res.body).toHaveProperty('hmr');
      expect(res.body.hmr).toHaveProperty('lastMs');
      expect(res.body.hmr).toHaveProperty('ok');
    });
  });

  describe('Editor Routes', () => {
    it('GET /v1/editor/status should return editor state', async () => {
      const res = await request(app).get('/v1/editor/status');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fileCount');
    });

    it('GET /v1/editor/recent should return recent files', async () => {
      const res = await request(app).get('/v1/editor/recent');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('files');
      expect(Array.isArray(res.body.files)).toBe(true);
    });
  });

  describe('Notifications Routes', () => {
    it('GET /v1/notifications should return notifications', async () => {
      const res = await request(app).get('/v1/notifications');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('POST /v1/notifications should create notification', async () => {
      const res = await request(app)
        .post('/v1/notifications')
        .send({
          message: 'Test notification',
          type: 'info',
        });
      
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('LLM Routes', () => {
    it('POST /v1/llm/explain should return explanation', async () => {
      const res = await request(app)
        .post('/v1/llm/explain')
        .send({
          context: 'test',
          data: { test: 'data' },
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('explanation');
    });

    it('POST /v1/llm/analyze-code should analyze code', async () => {
      const res = await request(app)
        .post('/v1/llm/analyze-code')
        .send({
          code: 'function test() { return 42; }',
          analysisType: 'quality',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('analysis');
    });

    it('POST /v1/llm/analyze-code should require code', async () => {
      const res = await request(app)
        .post('/v1/llm/analyze-code')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('POST /v1/llm/generate-code should generate code', async () => {
      const res = await request(app)
        .post('/v1/llm/generate-code')
        .send({
          prompt: 'Create a hello world function',
          language: 'typescript',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('code');
    });

    it('POST /v1/llm/completions should return completions', async () => {
      const res = await request(app)
        .post('/v1/llm/completions')
        .send({
          prefix: 'const result = ',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('completions');
    });

    it('POST /v1/llm/context/clear should clear context', async () => {
      const res = await request(app)
        .post('/v1/llm/context/clear')
        .send({
          sessionId: 'test-session',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
    });

    it('GET /v1/llm/context/summary/:sessionId should return summary', async () => {
      const res = await request(app).get('/v1/llm/context/summary/test-session');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messageCount');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/v1/unknown/route');
      
      expect(res.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/v1/llm/explain')
        .set('Content-Type', 'application/json')
        .send('not valid json{');
      
      expect(res.status).toBe(400);
    });

    it('should return proper error structure', async () => {
      const res = await request(app)
        .post('/v1/llm/analyze-code')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
    });
  });

  describe('CORS & Headers', () => {
    it('should include CORS headers', async () => {
      const res = await request(app).get('/health');
      
      expect(res.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should accept OPTIONS requests', async () => {
      const res = await request(app).options('/v1/ci/status');
      
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });
  });

  describe('Performance', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });
});
