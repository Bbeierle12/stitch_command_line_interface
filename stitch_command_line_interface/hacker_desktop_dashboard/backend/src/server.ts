/**
 * Backend Server Entry Point
 */

import { createServer } from 'http';
import { Server as WebSocketServer } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { setupWebSocket } from './websocket/server';
import { setupIDEWebSocket } from './websocket/ideHandler';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server and attach WebSocket
const server = createServer(app);

// Setup legacy WebSocket for existing dashboard features
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Setup Socket.IO for IDE features
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  path: '/socket.io', // Default socket.io path
});
setupIDEWebSocket(io);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.info(`📡 WebSocket server running at ws://${HOST}:${PORT}/ws`);
  logger.info(`� Socket.IO server running at http://${HOST}:${PORT}/socket.io`);
  logger.info(`�🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
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

