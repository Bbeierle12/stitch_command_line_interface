/**
 * Backend Server Entry Point
 */

import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import app from './app';
import { setupWebSocket } from './websocket/server';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server and attach WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.info(`📡 WebSocket server running at ws://${HOST}:${PORT}/ws`);
  logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;

