/**
 * Security Tests - P0 Security Hardening
 * Tests for authentication, authorization, and rate limiting
 */

import request from 'supertest';
import express, { Application } from 'express';
import { authenticateToken, requireAdmin, requireDeveloper, userRateLimit } from '../src/middleware/auth';
import { authService } from '../src/services/authService';
import { rateLimiter } from '../src/middleware/rateLimit';

describe('Security Hardening Tests', () => {
  let app: Application;
  let adminToken: string;
  let developerToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    // Setup test app with security middleware
    app = express();
    app.use(express.json());

    // Public auth routes
    app.post('/auth/login', async (req, res) => {
      try {
        const tokens = await authService.login(req.body.username, req.body.password);
        const payload = authService.verifyToken(tokens.accessToken);
        const user = authService.getUserById(payload.userId);
        res.json({ success: true, ...tokens, user });
      } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    });

    // Protected routes
    app.get('/api/test', authenticateToken, (_req, res) => {
      res.json({ success: true, message: 'Authenticated' });
    });

    app.get('/api/developer', authenticateToken, requireDeveloper, (_req, res) => {
      res.json({ success: true, message: 'Developer access granted' });
    });

    app.get('/api/admin', authenticateToken, requireAdmin, (_req, res) => {
      res.json({ success: true, message: 'Admin access granted' });
    });

    app.post('/api/rate-limited', authenticateToken, userRateLimit(3, 60000), (_req, res) => {
      res.json({ success: true });
    });

    // Create test users and get tokens
    try {
      await authService.registerUser({
        username: 'test-admin',
        email: 'test-admin@test.com',
        password: 'test123',
        role: 'admin',
      });
    } catch (e) {
      // User might already exist
    }

    try {
      await authService.registerUser({
        username: 'test-developer',
        email: 'test-dev@test.com',
        password: 'test123',
        role: 'developer',
      });
    } catch (e) {
      // User might already exist
    }

    try {
      await authService.registerUser({
        username: 'test-viewer',
        email: 'test-viewer@test.com',
        password: 'test123',
        role: 'viewer',
      });
    } catch (e) {
      // User might already exist
    }

    // Get tokens
    const adminLogin = await authService.login('test-admin', 'test123');
    adminToken = adminLogin.accessToken;

    const devLogin = await authService.login('test-developer', 'test123');
    developerToken = devLogin.accessToken;

    const viewerLogin = await authService.login('test-viewer', 'test123');
    viewerToken = viewerLogin.accessToken;
  });

  describe('JWT Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Authenticated');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should allow admin to access developer routes', async () => {
      const response = await request(app)
        .get('/api/developer')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow developer to access developer routes', async () => {
      const response = await request(app)
        .get('/api/developer')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Developer access granted');
    });

    it('should deny developer access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Requires admin role');
    });

    it('should deny viewer access to developer routes', async () => {
      const response = await request(app)
        .get('/api/developer')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Requires developer role');
    });

    it('should deny viewer access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Requires admin role');
    });
  });

  describe('Per-User Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response1 = await request(app)
        .post('/api/rate-limited')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response1.body.success).toBe(true);

      const response2 = await request(app)
        .post('/api/rate-limited')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response2.body.success).toBe(true);
    });

    it('should block requests exceeding rate limit', async () => {
      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/rate-limited')
          .set('Authorization', `Bearer ${developerToken}`)
          .expect(200);
      }

      // 4th request should be blocked
      const response = await request(app)
        .post('/api/rate-limited')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Rate limit exceeded');
      expect(response.body.retryAfter).toBeDefined();
    });

    it('should rate limit per user independently', async () => {
      // viewer token should have independent limit
      const response = await request(app)
        .post('/api/rate-limited')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Login Security', () => {
    it('should return user data on successful login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test-admin', password: 'test123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('test-admin');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.passwordHash).toBeUndefined(); // Should not expose password
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test-admin', password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test-admin' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Payload Security', () => {
    it('should include userId in token payload', () => {
      const payload = authService.verifyToken(adminToken);
      expect(payload.userId).toBeDefined();
      expect(payload.username).toBe('test-admin');
      expect(payload.role).toBe('admin');
    });

    it('should be able to get user from payload userId', () => {
      const payload = authService.verifyToken(adminToken);
      const user = authService.getUserById(payload.userId);
      
      expect(user).toBeDefined();
      expect(user?.username).toBe('test-admin');
      expect(user?.role).toBe('admin');
      expect(user?.passwordHash).toBeUndefined(); // Should not expose password
    });
  });
});
