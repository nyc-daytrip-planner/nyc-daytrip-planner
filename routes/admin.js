import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  res.render('admin', { title: 'Admin' });
});

export default router;