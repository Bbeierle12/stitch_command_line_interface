import { createServer } from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import request from 'supertest';
import app from '../src/app';
import { setupWebSocket } from '../src/websocket/server';

describe('WebSocket server', () => {
  let httpServer: ReturnType<typeof createServer>;
  let wss: WebSocketServer;
  let address: { port: number };

  beforeAll((done) => {
    httpServer = createServer(app);
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    setupWebSocket(wss);
    httpServer.listen(0, () => {
      // @ts-ignore Node returns address object
      address = httpServer.address();
      done();
    });
  });

  afterAll((done) => {
    wss.close(() => {
      httpServer.close(done);
    });
  });

  it('exposes health and ws endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('accepts ws connection and responds to ping', async () => {
    const url = `ws://127.0.0.1:${address.port}/ws`;
    const client = new WebSocket(url);
    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
      client.on('open', () => {
        client.send(JSON.stringify({ type: 'ping' }));
      });
      client.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        if (msg.type === 'pong') {
          clearTimeout(timeout);
          client.close();
          resolve();
        }
      });
      client.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    expect(messages.some((m) => m.type === 'connected')).toBe(true);
    expect(messages.some((m) => m.type === 'pong')).toBe(true);
  });
});
