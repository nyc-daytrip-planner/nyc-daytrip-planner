import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  res.render('explore', { title: 'Explore' });
});

export default router;