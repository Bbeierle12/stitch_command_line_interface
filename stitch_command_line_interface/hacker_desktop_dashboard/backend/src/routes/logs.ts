import { Router } from 'express';

const router = Router();

router.get('/stream', (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
  const since = req.query.since as string | undefined;
  const baseId = Date.now();
  const tags: Array<'INFO' | 'WARN' | 'ERROR' | 'DEBUG'> = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const messages = [
    'Dev server ready on http://localhost:5173',
    'HMR update detected, reloading',
    'Three slow tests detected (>= 1200 ms)',
    'VPN heartbeat stalled, retrying',
    'File watcher limit reached, consider increasing',
    'Build completed successfully',
  ];

  const logs = Array.from({ length: limit }, (_, i) => ({
    id: baseId - i,
    tag: tags[Math.floor(Math.random() * tags.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: new Date(Date.now() - i * 2000).toISOString(),
  }));

  res.json({ logs, since: since || null });
});

export default router;

