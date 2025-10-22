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

router.post('/flows/:id/block', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, flowId: id, blockedAt: new Date().toISOString() });
});

export default router;

