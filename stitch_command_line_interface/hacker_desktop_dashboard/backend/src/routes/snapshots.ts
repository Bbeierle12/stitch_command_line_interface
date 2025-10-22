import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    snapshots: [
      { id: 'snap-001', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), label: '13:02' },
      { id: 'live', timestamp: null, label: 'Live' },
    ],
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  // For simplicity return a synthetic snapshot bundle
  const ci = {
    build: { durationMs: 4210, cacheHitPct: 82, status: 'running' },
    tests: { pass: 162, fail: 3, skip: 4, flaky: 1, lastRunAt: new Date().toISOString() },
    logsRef: 'ci/main#1426',
  };
  const security = {
    vpn: 'on',
    firewall: 'on',
    encryption: 'on',
    alerts: [{ id: 'vpn', sev: 'low' as const, title: 'VPN handshake retried', ageSec: 110 }],
    startupDiff: { added: ['agent-helper'], removed: [] },
  };
  const network = {
    flows: [
      { id: '1', app: 'node', dest: 'api.internal', status: 'allow', bytesTotal: 123456, startedAt: new Date().toISOString() },
    ],
  };
  const logs = {
    logs: [
      { id: Date.now(), tag: 'INFO', message: 'Snapshot restored', timestamp: new Date().toISOString() },
    ],
  };
  res.json({ id, ci, security, system: {}, network, logs });
});

export default router;

