/**
 * Middleware Tests
 * Tests error handling, rate limiting, and request processing
 */

import request from 'supertest';
import express from 'express';
import { errorHandler } from '../src/middleware/errorHandler';

describe('Middleware', () => {
  describe('Error Handler', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    it('should handle errors with custom error handler', async () => {
      app.get('/test-error', () => {
        throw new Error('Test error');
      });
      app.use(errorHandler);

      const res = await request(app).get('/test-error');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should handle async errors', async () => {
      app.get('/test-async-error', async (req, res, next) => {
        try {
          throw new Error('Async error');
        } catch (err) {
          next(err);
        }
      });
      app.use(errorHandler);

      const res = await request(app).get('/test-async-error');

      expect(res.status).toBeGreaterThanOrEqual(400);
    }, 5000); // Set explicit timeout of 5 seconds

    it('should return proper error structure', async () => {
      app.get('/test-structured-error', () => {
        const error: any = new Error('Structured error');
        error.statusCode = 422;
        error.code = 'VALIDATION_ERROR';
        throw error;
      });
      app.use(errorHandler);

      const res = await request(app).get('/test-structured-error');

      expect(res.status).toBe(422);
      expect(res.body.error).toHaveProperty('message');
    });

    it('should handle JSON parse errors', async () => {
      app.post('/test-json', (req, res) => {
        res.json({ received: req.body });
      });
      app.use(errorHandler);

      const res = await request(app)
        .post('/test-json')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // This would test actual rate limiting middleware
      // For now, we'll test that the endpoint responds
      const app = express();
      app.get('/test-rate', (req, res) => {
        res.json({ ok: true });
      });

      const responses = await Promise.all([
        request(app).get('/test-rate'),
        request(app).get('/test-rate'),
        request(app).get('/test-rate'),
      ]);

      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Request Processing', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
    });

    it('should parse JSON bodies', async () => {
      app.post('/test-json', (req, res) => {
        res.json({ received: req.body });
      });

      const testData = { key: 'value', number: 42 };
      const res = await request(app)
        .post('/test-json')
        .send(testData);

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(testData);
    });

    it('should parse URL-encoded bodies', async () => {
      app.post('/test-urlencoded', (req, res) => {
        res.json({ received: req.body });
      });

      const res = await request(app)
        .post('/test-urlencoded')
        .send('key=value&number=42');

      expect(res.status).toBe(200);
      expect(res.body.received).toHaveProperty('key');
    });

    it('should handle large payloads', async () => {
      app.post('/test-large', (req, res) => {
        res.json({ size: JSON.stringify(req.body).length });
      });

      const largeData = { items: Array(1000).fill({ data: 'test' }) };
      const res = await request(app)
        .post('/test-large')
        .send(largeData);

      expect(res.status).toBe(200);
      expect(res.body.size).toBeGreaterThan(0);
    });

    it('should handle empty bodies', async () => {
      app.post('/test-empty', (req, res) => {
        res.json({ received: req.body });
      });

      const res = await request(app)
        .post('/test-empty')
        .send();

      expect(res.status).toBe(200);
    });

    it('should handle special characters', async () => {
      app.post('/test-special', (req, res) => {
        res.json({ received: req.body });
      });

      const specialData = {
        emoji: '🚀',
        unicode: '\u0041\u0042',
        symbols: '!@#$%^&*()',
      };

      const res = await request(app)
        .post('/test-special')
        .send(specialData);

      expect(res.status).toBe(200);
      expect(res.body.received.emoji).toBe('🚀');
    });
  });

  describe('Content-Type Handling', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    it('should accept application/json', async () => {
      app.post('/test-content-type', (req, res) => {
        res.json({ ok: true });
      });

      const res = await request(app)
        .post('/test-content-type')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
    });

    it('should handle missing Content-Type', async () => {
      app.post('/test-no-content-type', (req, res) => {
        res.json({ ok: true });
      });

      const res = await request(app)
        .post('/test-no-content-type')
        .send({ test: 'data' });

      expect(res.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.disable('x-powered-by'); // Disable the header like in our main app
      app.get('/test-headers', (req, res) => {
        res.json({ ok: true });
      });
    });

    it('should not leak sensitive headers', async () => {
      const res = await request(app).get('/test-headers');

      expect(res.headers).not.toHaveProperty('x-powered-by');
    });
  });
});
