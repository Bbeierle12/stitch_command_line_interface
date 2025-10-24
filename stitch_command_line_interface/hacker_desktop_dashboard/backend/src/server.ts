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

// WebSocket configuration from env
const WS_MAX_PAYLOAD = parseInt(process.env.WS_MAX_PAYLOAD || '1048576', 10); // 1MB default
const SOCKET_IO_MAX_BUFFER = parseInt(process.env.SOCKET_IO_MAX_BUFFER || '1048576', 10); // 1MB default

// Setup legacy WebSocket for existing dashboard features
const wss = new WebSocketServer({ 
  server, 
  path: '/ws',
  maxPayload: WS_MAX_PAYLOAD,
});
setupWebSocket(wss);

// Setup Socket.IO for IDE features with authentication and limits
const corsAllowlist = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:5173'];

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || corsAllowlist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  path: '/socket.io',
  maxHttpBufferSize: SOCKET_IO_MAX_BUFFER,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
    
    if (!token) {
      logger.warn(`Socket.IO connection rejected from ${socket.handshake.address}: No token provided`);
      return next(new Error('Authentication required'));
    }

    // Verify token
    const { authService } = await import('./services/authService');
    const payload = authService.verifyToken(token);
    
    // Store user in socket.data for use in handlers
    socket.data.user = payload;
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    socket.data.role = payload.role;
    
    logger.info(`Socket.IO authenticated: ${payload.username} (${payload.role})`);
    next();
  } catch (error) {
    logger.warn(`Socket.IO connection rejected: ${error instanceof Error ? error.message : 'Invalid token'}`);
    next(new Error('Authentication failed'));
  }
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

