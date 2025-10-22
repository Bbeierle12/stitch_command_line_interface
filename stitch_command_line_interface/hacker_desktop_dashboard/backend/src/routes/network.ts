import { Router } from 'express';

const router = Router();

router.get('/flows', (_req, res) => {
  const apps = ['node', 'docker', 'chrome', 'vscode', 'curl'];
  const dests = ['api.internal', 'registry.hub', 'cdn.jsdelivr.net', 'github.com', 'unknown-host'];
  const statuses = ['allow', 'watch', 'block'] as const;

  const flows = Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    app: apps[i % apps.length],
    dest: dests[i % dests.length],
    status: statuses[i % statuses.length],
    bytesTotal: Math.floor(Math.random() * 10_000_000),
    startedAt: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString(),
  }));
  res.json({ flows });
});

router.get('/connections', (_req, res) => {
  const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'WebSocket'];
  const states = ['ESTABLISHED', 'LISTEN', 'TIME_WAIT', 'CLOSE_WAIT'];
  
  const connections = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    protocol: protocols[i % protocols.length],
    localAddress: `127.0.0.1:${3000 + i}`,
    remoteAddress: `${192 + (i % 2)}.168.1.${100 + i}:${8000 + i}`,
    state: states[i % states.length],
    pid: 1000 + i * 100,
    process: i % 2 === 0 ? 'node' : 'chrome',
  }));
  
  res.json({ connections });
});

router.post('/flows/:id/block', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, flowId: id, blockedAt: new Date().toISOString() });
});

export default router;

