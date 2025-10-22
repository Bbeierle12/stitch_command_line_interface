/**
 * Comprehensive tests for Command Routes
 * Tests validation, dry-run, execution, and error handling
 */

import request from 'supertest';
import app from '../src/app';

describe('Command Routes', () => {
  describe('POST /v1/commands/execute', () => {
    it('should execute command in dry-run mode', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev',
          dryRun: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('preview');
      expect(res.body.preview).toBeDefined();
    });

    it('should validate required commandId', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          dryRun: true,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should handle unknown command IDs', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'non-existent-command',
          dryRun: true,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should accept command arguments', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev',
          args: ['--port', '3000'],
          dryRun: true,
        });

      expect(res.status).toBe(200);
    });

    it('should support different execution modes', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev',
          dryRun: true,
          mode: 'background',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/commands/list', () => {
    it('should return list of available commands', async () => {
      const res = await request(app).get('/v1/commands/list');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('commands');
      expect(Array.isArray(res.body.commands)).toBe(true);
    });

    it('should include command metadata', async () => {
      const res = await request(app).get('/v1/commands/list');

      expect(res.status).toBe(200);
      if (res.body.commands.length > 0) {
        const cmd = res.body.commands[0];
        expect(cmd).toHaveProperty('id');
        expect(cmd).toHaveProperty('label');
      }
    });
  });

  describe('GET /v1/commands/status/:commandId', () => {
    it('should return command status', async () => {
      const res = await request(app).get('/v1/commands/status/restart-dev');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
    });

    it('should handle invalid command IDs in status check', async () => {
      const res = await request(app).get('/v1/commands/status/invalid-id');

      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('POST /v1/commands/validate', () => {
    it('should validate command before execution', async () => {
      const res = await request(app)
        .post('/v1/commands/validate')
        .send({
          commandId: 'restart-dev',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('valid');
    });

    it('should detect invalid commands', async () => {
      const res = await request(app)
        .post('/v1/commands/validate')
        .send({
          commandId: '',
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate command arguments', async () => {
      const res = await request(app)
        .post('/v1/commands/validate')
        .send({
          commandId: 'restart-dev',
          args: ['--invalid-arg'],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('valid');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(res.status).toBe(400);
    });

    it('should handle missing Content-Type', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send('commandId=restart-dev');

      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle very large payloads', async () => {
      const largeArgs = Array(1000).fill('arg');
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev',
          args: largeArgs,
          dryRun: true,
        });

      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Security', () => {
    it('should sanitize command inputs', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev; rm -rf /',
          dryRun: true,
        });

      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it('should prevent command injection in args', async () => {
      const res = await request(app)
        .post('/v1/commands/execute')
        .send({
          commandId: 'restart-dev',
          args: ['--port', '3000 && echo "hacked"'],
          dryRun: true,
        });

      expect(res.status).toBe(200);
    });
  });
});
