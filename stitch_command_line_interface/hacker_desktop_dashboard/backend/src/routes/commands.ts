import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

const COMMANDS = [
  { id: 'restart-dev', label: 'Restart Dev Server', risk: 'low' },
  { id: 'run-tests', label: 'Run Test Suite', risk: 'med' },
  { id: 'clear-cache', label: 'Clear Build Cache', risk: 'low' },
];

// In-memory command execution status tracker
const commandStatus: Record<string, { status: string; startedAt: string; completedAt?: string; output?: string }> = {};

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

router.get('/status/:commandId', (req, res) => {
  const { commandId } = req.params;
  const status = commandStatus[commandId];
  
  if (!status) {
    // Return a default status for known commands
    const cmd = COMMANDS.find((c) => c.id === commandId);
    if (cmd) {
      res.json({ 
        commandId, 
        status: 'idle', 
        message: 'Command has not been executed yet' 
      });
      return;
    }
    res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: `Command ${commandId} not found` } 
    });
    return;
  }
  
  res.json({ commandId, ...status });
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
  // Track execution status
  commandStatus[commandId] = {
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  
  // Stub execution
  const start = Date.now();
  logger.info('Executing command', { commandId, args });
  const output = `Executed ${commandId} ${args.join(' ')}`.trim();
  const duration = Date.now() - start;
  
  // Update status
  commandStatus[commandId] = {
    status: 'completed',
    startedAt: commandStatus[commandId].startedAt,
    completedAt: new Date().toISOString(),
    output,
  };
  
  res.json({ success: true, output, duration });
});

export default router;
