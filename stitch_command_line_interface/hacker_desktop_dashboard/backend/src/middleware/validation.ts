/**
 * Input Validation Middleware
 * Provides validation rules for API endpoints using express-validator
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', { path: req.path, errors: errors.array() });
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
    return;
  }
  
  next();
};

/**
 * LLM Endpoint Validations
 */
export const validateLLMExplain = [
  body('context')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Context must be a string with max 500 characters'),
  
  body('data')
    .exists()
    .withMessage('Data is required')
    .custom((value) => {
      const stringified = JSON.stringify(value);
      if (stringified.length > 50000) {
        throw new Error('Data payload too large (max 50KB)');
      }
      return true;
    }),
  
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic'])
    .withMessage('Provider must be either openai or anthropic'),
  
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model name too long'),
  
  body('sessionId')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

export const validateLLMAnalyzeCode = [
  body('code')
    .exists()
    .withMessage('Code is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100000 })
    .withMessage('Code must be between 1 and 100,000 characters'),
  
  body('analysisType')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Analysis type too long'),
  
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic'])
    .withMessage('Provider must be either openai or anthropic'),
  
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model name too long'),
  
  body('sessionId')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

export const validateLLMGenerateCode = [
  body('prompt')
    .exists()
    .withMessage('Prompt is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Prompt must be between 1 and 10,000 characters'),
  
  body('language')
    .exists()
    .withMessage('Language is required')
    .isString()
    .isIn(['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c'])
    .withMessage('Unsupported language'),
  
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic'])
    .withMessage('Provider must be either openai or anthropic'),
  
  body('model')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Model name too long'),
  
  body('sessionId')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

export const validateLLMCompletions = [
  body('prefix')
    .exists()
    .withMessage('Prefix is required')
    .isString()
    .isLength({ max: 5000 })
    .withMessage('Prefix too long (max 5000 characters)'),
  
  body('context')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Context too long (max 1000 characters)'),
  
  body('provider')
    .optional()
    .isIn(['openai', 'anthropic'])
    .withMessage('Provider must be either openai or anthropic'),
  
  body('sessionId')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

export const validateLLMClearContext = [
  body('sessionId')
    .exists()
    .withMessage('Session ID is required')
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

export const validateLLMOptimizeContext = [
  body('sessionId')
    .exists()
    .withMessage('Session ID is required')
    .isString()
    .isLength({ max: 200 })
    .withMessage('Session ID too long'),
  
  handleValidationErrors,
];

/**
 * Workspace Endpoint Validations
 */
export const validateWorkspaceFileRead = [
  param('path')
    .exists()
    .withMessage('File path is required')
    .isString()
    .custom((value) => {
      // Prevent path traversal
      if (value.includes('..') || value.includes('~')) {
        throw new Error('Invalid file path: path traversal detected');
      }
      return true;
    })
    .isLength({ max: 500 })
    .withMessage('File path too long'),
  
  handleValidationErrors,
];

export const validateWorkspaceFileWrite = [
  body('path')
    .exists()
    .withMessage('File path is required')
    .isString()
    .custom((value) => {
      if (value.includes('..') || value.includes('~')) {
        throw new Error('Invalid file path: path traversal detected');
      }
      return true;
    })
    .isLength({ max: 500 })
    .withMessage('File path too long'),
  
  body('content')
    .exists()
    .withMessage('File content is required')
    .isString()
    .custom((value) => {
      const sizeInBytes = Buffer.byteLength(value, 'utf8');
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (sizeInBytes > maxSize) {
        throw new Error('File content too large (max 10MB)');
      }
      return true;
    }),
  
  handleValidationErrors,
];

export const validateWorkspaceFileDelete = [
  param('path')
    .exists()
    .withMessage('File path is required')
    .isString()
    .custom((value) => {
      if (value.includes('..') || value.includes('~')) {
        throw new Error('Invalid file path: path traversal detected');
      }
      // Prevent deletion of critical files
      const criticalPatterns = ['.git', 'node_modules', 'package.json', 'package-lock.json'];
      if (criticalPatterns.some(pattern => value.includes(pattern))) {
        throw new Error('Cannot delete critical system files');
      }
      return true;
    })
    .isLength({ max: 500 })
    .withMessage('File path too long'),
  
  handleValidationErrors,
];

export const validateWorkspaceSearch = [
  query('q')
    .exists()
    .withMessage('Search query is required')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Query must be between 1 and 500 characters'),
  
  query('path')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Path too long'),
  
  handleValidationErrors,
];

export const validateCodeExecution = [
  body('code')
    .exists()
    .withMessage('Code is required')
    .isString()
    .isLength({ min: 1, max: 100000 })
    .withMessage('Code must be between 1 and 100,000 characters'),
  
  body('language')
    .exists()
    .withMessage('Language is required')
    .isIn(['javascript', 'typescript'])
    .withMessage('Language must be javascript or typescript'),
  
  body('timeout')
    .optional()
    .isInt({ min: 100, max: 60000 })
    .withMessage('Timeout must be between 100ms and 60s'),
  
  body('memoryLimit')
    .optional()
    .isInt({ min: 64, max: 2048 })
    .withMessage('Memory limit must be between 64MB and 2GB'),
  
  handleValidationErrors,
];

/**
 * Command Endpoint Validations
 */
export const validateCommandValidate = [
  body('commandId')
    .exists()
    .withMessage('Command ID is required')
    .isString()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Command ID must contain only lowercase letters, numbers, and hyphens')
    .isLength({ max: 100 })
    .withMessage('Command ID too long'),
  
  body('args')
    .optional()
    .isArray()
    .withMessage('Args must be an array'),
  
  body('args.*')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Argument too long'),
  
  handleValidationErrors,
];

export const validateCommandExecute = [
  body('commandId')
    .exists()
    .withMessage('Command ID is required')
    .isString()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Command ID must contain only lowercase letters, numbers, and hyphens')
    .isLength({ max: 100 })
    .withMessage('Command ID too long'),
  
  body('args')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Too many arguments (max 20)'),
  
  body('args.*')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Argument too long'),
  
  body('dryRun')
    .optional()
    .isBoolean()
    .withMessage('dryRun must be boolean'),
  
  handleValidationErrors,
];

export const validateCommandStatus = [
  param('commandId')
    .exists()
    .withMessage('Command ID is required')
    .isString()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Command ID must contain only lowercase letters, numbers, and hyphens')
    .isLength({ max: 100 })
    .withMessage('Command ID too long'),
  
  handleValidationErrors,
];
