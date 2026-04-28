import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  res.render('planner', { title: 'Planner' });
});

export default router;