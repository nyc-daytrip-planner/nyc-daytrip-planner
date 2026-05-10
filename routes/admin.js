import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAllReviewsForAdmin } from '../data/reviews.js';
import { getAllCommentsForAdmin } from '../data/comments.js';
import { getPendingLocations } from '../data/locations.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const allReviews = await getAllReviewsForAdmin();
    const allComments = await getAllCommentsForAdmin();
    const pendingLocations = await getPendingLocations();

    return res.render('admin', {
      title: 'Admin',
      allReviews,
      allComments,
      pendingLocations
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

export default router;
