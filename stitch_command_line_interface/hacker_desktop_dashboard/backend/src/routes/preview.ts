import { Router } from 'express';
import { getDevServerService } from '../services/devServerService';

const router = Router();

// GET /state with optional mode query parameter
router.get('/state', (req, res) => {
  const mode = (req.query.mode as string) || 'browser';
  const devServer = getDevServerService();
  const state = devServer.getState();
  const hmr = devServer.getHmrStatus();
  
  const base = { 
    hmr,
    buildStatus: state.status,
    lastBuildTime: state.lastBuildTime?.toISOString(),
  };

  switch (mode) {
    case 'browser':
      return res.json({ 
        mode, 
        url: state.url,
        ...base 
      });
    case 'cli':
      return res.json({
        mode,
        tail: {
          lines: [
            '> npm run dev',
            state.status === 'compiling' ? '⏳ Compiling modules...' : '✅ Build complete',
            `Ready on ${state.url} [${new Date().toLocaleTimeString()}]`,
            hmr.ok ? 'HMR connected' : 'HMR degraded',
            state.error ? `❌ Error: ${state.error}` : ''
          ].filter(Boolean),
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
      return res.json({ mode: 'browser', url: state.url, ...base });
  }
});

// Backward compatibility: GET /:mode
router.get('/:mode', (req, res) => {
  const { mode } = req.params as { mode: 'browser' | 'cli' | 'plots' | 'tests' | 'docs' };
  const devServer = getDevServerService();
  const state = devServer.getState();
  const hmr = devServer.getHmrStatus();
  
  const base = { 
    hmr,
    buildStatus: state.status,
    lastBuildTime: state.lastBuildTime?.toISOString(),
  };

  switch (mode) {
    case 'browser':
      return res.json({ mode, url: state.url, ...base });
    case 'cli':
      return res.json({
        mode,
        tail: {
          lines: [
            '> npm run dev',
            state.status === 'compiling' ? '⏳ Compiling modules...' : '✅ Build complete',
            `Ready on ${state.url} [${new Date().toLocaleTimeString()}]`,
            hmr.ok ? 'HMR connected' : 'HMR degraded',
            state.error ? `❌ Error: ${state.error}` : ''
          ].filter(Boolean),
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

// POST /rebuild - Trigger a manual rebuild (for testing)
router.post('/rebuild', async (_req, res) => {
  const devServer = getDevServerService();
  
  try {
    await devServer.simulateRebuild();
    res.json({ success: true, state: devServer.getState() });
  } catch (error) {
    res.status(500).json({ error: { code: 'REBUILD_FAILED', message: 'Failed to trigger rebuild' } });
  }
});

export default router;

