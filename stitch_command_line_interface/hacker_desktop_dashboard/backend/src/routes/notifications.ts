import { Router } from 'express';

const router = Router();

const makeNotifs = () => ([
  { id: 'notif-001', bucket: 'CI', text: 'Pipeline main failed on lint stage', severity: 'high', timestamp: new Date().toISOString(), read: false },
  { id: 'notif-002', bucket: 'OS', text: 'Patch Tuesday bundle ready', severity: 'med', timestamp: new Date().toISOString(), read: false },
]);

router.get('/', (_req, res) => {
  res.json({ notifications: makeNotifs() });
});

router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, id });
});

export default router;

