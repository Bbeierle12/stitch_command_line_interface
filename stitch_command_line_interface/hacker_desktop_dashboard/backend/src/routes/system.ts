import { Router } from 'express';

const router = Router();

router.get('/metrics', (_req, res) => {
  const cpuUsage = Math.floor(20 + Math.random() * 60);
  const cpuTemp = Math.floor(45 + Math.random() * 25);
  const memTotal = 16 * 1024; // MB
  const memUsed = Math.floor(6 * 1024 + Math.random() * 6 * 1024);
  const charging = Math.random() > 0.5;
  const batteryPct = Math.floor(40 + Math.random() * 60);
  const rx = Math.floor(Math.random() * 10_000);
  const tx = Math.floor(Math.random() * 10_000);

  res.json({
    cpu: { usage: cpuUsage, cores: 8, temperature: cpuTemp },
    memory: { used: memUsed, total: memTotal, unit: 'MB' },
    battery: { charging, percentage: batteryPct, timeRemaining: charging ? null : Math.floor(Math.random() * 180) },
    network: { rx, tx, unit: 'KB/s' },
  });
});

export default router;

