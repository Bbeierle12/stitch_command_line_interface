/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload, User } from '../services/authService';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authenticate JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(403).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    });
  }
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }

  next();
};

/**
 * Require specific role
 */
export const requireRole = (role: User['role']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
      return;
    }

    if (!authService.hasRole(req.user, role)) {
      res.status(403).json({ 
        success: false, 
        error: `Requires ${role} role or higher` 
      });
      return;
    }

    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Require developer role or higher
 */
export const requireDeveloper = requireRole('developer');

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();

    const userLimit = requestCounts.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      requestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

/**
 * Audit log middleware
 */
export const auditLog = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      username: req.user?.username,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};
