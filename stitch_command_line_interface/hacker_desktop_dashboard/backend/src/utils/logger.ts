/**
 * Logger Utility
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    }),
    // File transport (if LOG_FILE is set)
    ...(process.env.LOG_FILE ? [
      new winston.transports.File({
        filename: process.env.LOG_FILE,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 7
      })
    ] : [])
  ]
});
