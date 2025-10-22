import { Router } from 'express';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    currentFile: 'src/components/PreviewCard.tsx',
    branch: 'feature/live-preview',
    diagnostics: { error: 2, warn: 5, info: 12 },
    dirty: Math.random() > 0.5,
    recent: [
      { file: 'src/App.tsx', delta: '2m' },
      { file: 'tailwind.config.js', delta: '12m' },
    ],
  });
});

export default router;

