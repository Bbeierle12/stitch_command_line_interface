/**
 * Authentication Routes
 */

import { Router } from 'express';
import { authService } from '../services/authService';
import { authenticateToken, requireAdmin, auditLog } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply audit logging to all auth routes
router.use(auditLog);

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const user = await authService.registerUser({ username, email, password, role });
    return res.json({ success: true, user });
  } catch (error) {
    logger.error('Registration failed:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

/**
 * Login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing username or password',
      });
    }

    // Authenticate and get tokens
    const tokens = await authService.login(username, password);
    
    // Get the token payload which contains user info
    const payload = authService.verifyToken(tokens.accessToken);
    
    // Get full user details
    const user = authService.getUserById(payload.userId);

    return res.json({
      success: true,
      ...tokens,
      user,
    });
  } catch (error) {
    logger.error('Login failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }
});

/**
 * Logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    await authService.logout(req.user.userId);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
      });
    }

    const tokens = await authService.refreshAccessToken(refreshToken);
    return res.json({ success: true, ...tokens });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
    });
  }
});

/**
 * Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const user = authService.getUserById(req.user.userId);
  return res.json({ success: true, user });
});

/**
 * List all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, (_req, res) => {
  const users = authService.listUsers();
  return res.json({ success: true, users });
});

/**
 * Update user role (admin only)
 */
router.put('/users/:userId/role', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'developer', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    const user = authService.updateUserRole(userId, role);
    return res.json({ success: true, user });
  } catch (error) {
    logger.error('Role update failed:', error);
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    });
  }
});

/**
 * Delete user (admin only)
 */
router.delete('/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user?.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    authService.deleteUser(userId);
    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    logger.error('User deletion failed:', error);
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deletion failed',
    });
  }
});

export default router;
