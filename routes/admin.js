import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    return res.render('admin', {
      title: 'Admin'
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

export default router;
