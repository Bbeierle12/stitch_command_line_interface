import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

const COMMANDS = [
  { id: 'restart-dev', label: 'Restart Dev Server', risk: 'low' },
  { id: 'run-tests', label: 'Run Test Suite', risk: 'med' },
  { id: 'clear-cache', label: 'Clear Build Cache', risk: 'low' },
];

router.get('/list', (_req, res) => {
  res.json({ commands: COMMANDS });
});

router.post('/validate', (req, res) => {
  const { commandId, args } = req.body || {};
  const exists = COMMANDS.some((c) => c.id === commandId);
  if (!exists) {
    res.status(400).json({
      error: { code: 'INVALID_COMMAND', message: `Unknown command: ${commandId}` },
    });
    return;
  }
  res.json({ valid: true, commandId, args: args || [] });
});

router.post('/execute', (req, res) => {
  const { commandId, args = [], dryRun = false } = req.body || {};
  const cmd = COMMANDS.find((c) => c.id === commandId);
  if (!cmd) {
    res.status(400).json({ error: { code: 'INVALID_COMMAND', message: `Unknown command: ${commandId}` } });
    return;
  }
  if (dryRun) {
    res.json({ preview: `${commandId} ${args.join(' ')}`.trim(), risk: cmd.risk, estimatedDuration: 2000 });
    return;
  }
  // Stub execution
  const start = Date.now();
  logger.info('Executing command', { commandId, args });
  const output = `Executed ${commandId} ${args.join(' ')}`.trim();
  const duration = Date.now() - start;
  res.json({ success: true, output, duration });
});

export default router;
