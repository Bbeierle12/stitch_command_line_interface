/**
 * WebSocket Server Setup
 */

import { Server as WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  subscriptions?: Set<string>;
}

export function setupWebSocket(wss: WebSocketServer) {
  logger.info('Setting up WebSocket server');

  // Handle new connections
  wss.on('connection', (ws: WebSocketClient) => {
    logger.info('New WebSocket connection');
    
    ws.isAlive = true;
    ws.subscriptions = new Set();

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

  // Periodic emitters for subscribed topics
  const emitters = setInterval(() => {
    wss.clients.forEach((ws: WebSocketClient) => {
      if (ws.readyState !== WebSocket.OPEN || !ws.subscriptions) return;

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
  }, 2000);

  wss.on('close', () => {
    clearInterval(emitters);
  });

  return wss;
}

function handleMessage(
  ws: WebSocketClient,
  message: { type: string; data?: unknown },
  wss: WebSocketServer
) {
  const { type, data } = message;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'subscribe':
      if (!ws.subscriptions) ws.subscriptions = new Set();
      if (Array.isArray((data as any)?.topics)) {
        (data as any).topics.forEach((t: string) => ws.subscriptions!.add(t));
      } else if (typeof (data as any)?.topic === 'string') {
        ws.subscriptions.add((data as any).topic);
      }
      logger.info('Client subscriptions:', Array.from(ws.subscriptions));
      ws.send(JSON.stringify({ type: 'subscribed', data: { topics: Array.from(ws.subscriptions) } }));
      break;

    case 'unsubscribe':
      if (ws.subscriptions) {
        if (Array.isArray((data as any)?.topics)) {
          (data as any).topics.forEach((t: string) => ws.subscriptions!.delete(t));
        } else if (typeof (data as any)?.topic === 'string') {
          ws.subscriptions.delete((data as any).topic);
        } else {
          ws.subscriptions.clear();
        }
      }
      logger.info('Client subscriptions after unsubscribe:', Array.from(ws.subscriptions || []));
      ws.send(JSON.stringify({ type: 'unsubscribed', data: { topics: Array.from(ws.subscriptions || []) } }));
      break;

    case 'broadcast-test':
      broadcast(wss, 'test', { echo: data ?? null, at: new Date().toISOString() });
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
