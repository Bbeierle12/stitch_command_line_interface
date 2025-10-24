/**
 * WebSocket Server Setup
 */

import { Server as WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { getFileWatcherService } from '../services/fileWatcherService';
import { getDevServerService } from '../services/devServerService';
import path from 'path';

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  subscriptions?: Set<string>;
  authenticated?: boolean;
  username?: string;
}

const MAX_SUBSCRIPTIONS_PER_CLIENT = parseInt(process.env.WS_MAX_SUBSCRIPTIONS || '10', 10);
const EMIT_THROTTLE_MS = parseInt(process.env.WS_EMIT_THROTTLE_MS || '2000', 10);

export function setupWebSocket(wss: WebSocketServer) {
  logger.info('Setting up WebSocket server');

  // Initialize file watcher service
  const workspacePath = path.join(process.cwd(), 'workspace');
  const fileWatcher = getFileWatcherService(workspacePath);
  fileWatcher.initialize(wss);

  logger.info('File watcher and dev server services initialized');

  // Handle new connections
  wss.on('connection', (ws: WebSocketClient, req) => {
    logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);
    
    ws.isAlive = true;
    ws.subscriptions = new Set();
    ws.authenticated = false;

    // Require authentication - send auth challenge
    ws.send(JSON.stringify({
      type: 'auth:required',
      data: { message: 'Please authenticate with a valid JWT token' }
    }));

    // Set authentication timeout (30 seconds)
    const authTimeout = setTimeout(() => {
      if (!ws.authenticated) {
        logger.warn('WebSocket connection closed: Authentication timeout');
        ws.close(1008, 'Authentication timeout');
      }
    }, 30000);

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message, wss);
      } catch (error) {
        logger.error('Failed to parse WebSocket message:', error);
      }
    });

    // Handle close
    ws.on('close', () => {
      clearTimeout(authTimeout);
      logger.info('WebSocket connection closed');
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'Connected to CyberOps Dashboard' }
    }));
  });

  // Heartbeat check every 30 seconds
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Periodic emitters for subscribed topics (throttled)
  const emitters = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      // Only emit to authenticated clients
      if (ws.readyState !== WebSocket.OPEN || !ws.subscriptions || !ws.authenticated) return;

      if (ws.subscriptions.has('logs')) {
        const logMsg = {
          type: 'log',
          data: {
            id: Date.now(),
            tag: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
            message: ['Dev server ready', 'HMR update', 'Test flaked', 'VPN retrying'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString()
          }
        };
        ws.send(JSON.stringify(logMsg));
      }

      if (ws.subscriptions.has('metrics')) {
        const metricMsg = {
          type: 'metric',
          data: {
            cpu: Math.floor(20 + Math.random() * 60),
            memory: Math.floor(40 + Math.random() * 50),
            temp: Math.floor(45 + Math.random() * 25)
          }
        };
        ws.send(JSON.stringify(metricMsg));
      }

      if (ws.subscriptions.has('alerts') && Math.random() < 0.1) {
        const severities = ['low', 'med', 'high'] as const;
        const alertMsg = {
          type: 'alert',
          data: {
            id: `alert-${Math.random().toString(36).slice(2, 7)}`,
            sev: severities[Math.floor(Math.random() * severities.length)],
            title: 'Random security event',
            ageSec: Math.floor(Math.random() * 600),
            timestamp: new Date().toISOString()
          }
        };
        ws.send(JSON.stringify(alertMsg));
      }

      if (ws.subscriptions.has('flows') && Math.random() < 0.2) {
        const statuses = ['allow', 'watch', 'block'] as const;
        const flowMsg = {
          type: 'flow',
          data: {
            id: `${Math.floor(Math.random() * 10000)}`,
            app: ['node', 'docker', 'chrome', 'vscode'][Math.floor(Math.random() * 4)],
            dest: ['api.internal', 'github.com', 'registry.hub'][Math.floor(Math.random() * 3)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            bytesTotal: Math.floor(Math.random() * 10_000_000),
            startedAt: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString()
          }
        } as const;
        ws.send(JSON.stringify(flowMsg));
      }
    });
  }, EMIT_THROTTLE_MS); // Use throttled interval from env

  wss.on('close', () => {
    clearInterval(emitters);
  });

  return wss;
}

function handleMessage(
  ws: WebSocketClient,
  message: { type: string; data?: any },
  wss: WebSocketServer
) {
  const { type, data } = message;

  // Handle authentication first
  if (type === 'auth') {
    const token = data?.token;
    if (!token) {
      ws.send(JSON.stringify({ type: 'auth:failed', data: { error: 'Token required' } }));
      return;
    }

    // Verify token
    import('../services/authService').then(({ authService }) => {
      try {
        const payload = authService.verifyToken(token);
        ws.authenticated = true;
        ws.userId = payload.userId;
        ws.username = payload.username;
        logger.info(`WebSocket authenticated: ${payload.username}`);
        ws.send(JSON.stringify({ 
          type: 'auth:success', 
          data: { username: payload.username, role: payload.role }
        }));
      } catch (error) {
        logger.warn('WebSocket auth failed:', error);
        ws.send(JSON.stringify({ type: 'auth:failed', data: { error: 'Invalid token' } }));
        ws.close(1008, 'Authentication failed');
      }
    });
    return;
  }

  // All other messages require authentication
  if (!ws.authenticated) {
    ws.send(JSON.stringify({ type: 'error', data: { error: 'Not authenticated' } }));
    return;
  }

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'subscribe':
      if (!ws.subscriptions) ws.subscriptions = new Set();
      
      const topicsToAdd = Array.isArray(data?.topics) ? data.topics : 
                         data?.topic ? [data.topic] : [];
      
      // Check subscription limit
      if (ws.subscriptions.size + topicsToAdd.length > MAX_SUBSCRIPTIONS_PER_CLIENT) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          data: { error: `Subscription limit exceeded (max: ${MAX_SUBSCRIPTIONS_PER_CLIENT})` }
        }));
        return;
      }
      
      topicsToAdd.forEach((t: string) => ws.subscriptions!.add(t));
      logger.info(`Client ${ws.username} subscriptions:`, Array.from(ws.subscriptions));
      ws.send(JSON.stringify({ type: 'subscribed', data: { topics: Array.from(ws.subscriptions) } }));
      break;

    case 'unsubscribe':
      if (ws.subscriptions) {
        if (Array.isArray(data?.topics)) {
          data.topics.forEach((t: string) => ws.subscriptions!.delete(t));
        } else if (typeof data?.topic === 'string') {
          ws.subscriptions.delete(data.topic);
        } else {
          ws.subscriptions.clear();
        }
      }
      logger.info(`Client ${ws.username} subscriptions after unsubscribe:`, Array.from(ws.subscriptions || []));
      ws.send(JSON.stringify({ type: 'unsubscribed', data: { topics: Array.from(ws.subscriptions || []) } }));
      break;

    case 'broadcast-test':
      broadcast(wss, 'test', { echo: data ?? null, at: new Date().toISOString() });
      break;

    case 'trigger-rebuild':
      // Manually trigger a rebuild (for testing)
      const devServer = getDevServerService();
      devServer.simulateRebuild().catch(err => {
        logger.error('Failed to trigger rebuild:', err);
      });
      ws.send(JSON.stringify({ type: 'rebuild-triggered', data: { timestamp: new Date().toISOString() } }));
      break;

    default:
      logger.warn('Unknown message type:', type);
  }
}

export function broadcast(wss: WebSocketServer, type: string, data: unknown) {
  const message = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
