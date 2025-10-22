import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

router.get('/status', (_req, res) => {
  const statuses = ['pass', 'fail', 'running'] as const;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const payload = {
    build: {
      durationMs: Math.floor(Math.random() * 3000) + 2000,
      cacheHitPct: Math.floor(Math.random() * 30) + 70,
      status,
    },
    tests: {
      pass: Math.floor(Math.random() * 50) + 150,
      fail: Math.floor(Math.random() * 5),
      skip: Math.floor(Math.random() * 10),
      flaky: Math.floor(Math.random() * 3),
      lastRunAt: new Date().toISOString(),
    },
    logsRef: `ci/main#${Math.floor(Math.random() * 1000) + 1400}`,
  };
  res.json(payload);
});

router.get('/logs/:ref', (req, res) => {
  const { ref } = req.params;
  const logs = [
    'Initializing pipeline...\n',
    'Installing dependencies...\n',
    'Running build scripts...\n',
    'Build completed successfully.\n',
  ].join('');
  res.json({ ref, logs, artifacts: ['https://cdn.example.com/artifacts/bundle.js'] });
});

router.post('/run', (_req, res) => {
  const runId = `run_${Date.now()}`;
  logger.info('CI run triggered', { runId });
  res.json({ success: true, runId });
});

export default router;

