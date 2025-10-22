import { Router } from 'express';

const router = Router();

router.get('/:mode', (req, res) => {
  const { mode } = req.params as { mode: 'browser' | 'cli' | 'plots' | 'tests' | 'docs' };
  const base = { hmr: { lastMs: Math.floor(Math.random() * 300) + 100, ok: Math.random() > 0.1 } };

  switch (mode) {
    case 'browser':
      return res.json({ mode, url: 'http://localhost:5173', ...base });
    case 'cli':
      return res.json({
        mode,
        tail: {
          lines: ['> npm run dev', 'Compiling...', `Ready on http://localhost:5173 [${new Date().toLocaleTimeString()}]`, 'HMR connected'],
          since: new Date().toISOString(),
        },
        ...base,
      });
    case 'plots':
      return res.json({ mode, artifacts: ['artifact://latency-p99'], ...base });
    case 'tests':
      return res.json({ mode, ...base });
    case 'docs':
      return res.json({ mode, artifacts: ['docs://api-reference'], ...base });
    default:
      return res.status(400).json({ error: { code: 'INVALID_MODE', message: `Unknown preview mode: ${mode}` } });
  }
});

export default router;

