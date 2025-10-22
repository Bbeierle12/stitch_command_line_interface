/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Determine status code (support both status and statusCode)
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Send error response
  res.status(status).json({
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      details: err.details || {}
    }
  });
};
