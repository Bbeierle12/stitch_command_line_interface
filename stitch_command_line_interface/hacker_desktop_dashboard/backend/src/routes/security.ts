import { Router } from 'express';

const router = Router();

router.get('/status', (_req, res) => {
  const alerts = [
    { id: 'vpn', sev: 'low' as const, title: 'VPN reconnected successfully', ageSec: 120 },
    { id: 'startup', sev: 'med' as const, title: 'New launch agent detected', ageSec: 450 },
    { id: 'quarantine', sev: 'high' as const, title: 'Suspicious binary quarantined', ageSec: 60 },
  ];
  res.json({
    vpn: Math.random() > 0.1 ? 'on' : 'off',
    firewall: 'on',
    encryption: 'on',
    alerts: alerts.filter(() => Math.random() > 0.3),
    startupDiff: Math.random() > 0.7 ? { added: ['com.unknown.agent'], removed: [] } : undefined,
  });
});

router.post('/panic', (req, res) => {
  const { reason } = req.body || {};
  // Stubbed panic actions
  res.json({ success: true, actions: ['disable-network', 'lock-sessions', 'notify-admins'], reason: reason || null });
});

export default router;

