import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { locations } from '../config/mongoCollections.js';
import {
  createReview,
  getReviewById,
  updateReview,
  deleteReview
} from '../data/reviews.js';

const router = Router();

function mapError(res, e) {
  if (typeof e !== 'string') {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
  let status = 400;
  if (/own review/i.test(e)) status = 403;
  else if (/no review found|no location found/i.test(e)) status = 404;
  return res.status(status).json({ ok: false, error: e });
}

async function readAggregates(locationId) {
  const locsCol = await locations();
  const loc = await locsCol.findOne({ _id: new ObjectId(locationId) });
  if (!loc) return null;
  return { averageRating: loc.averageRating, totalReviews: loc.totalReviews };
}

// AJAX: create review
router.post('/', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const body = req.body || {};
    const review = await createReview({
      locationId: body.locationId,
      userId: req.session.user._id,
      rating: body.rating,
      reviewText: body.reviewText
    });
    review.authorFirstName = req.session.user.firstName;
    const aggregates = await readAggregates(review.locationId);
    return res.json({ ok: true, review, aggregates });
  } catch (e) {
    return mapError(res, e);
  }
});

// AJAX: edit own review
router.put('/:id', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const body = req.body || {};
    const review = await updateReview(req.params.id, req.session.user._id, {
      rating: body.rating,
      reviewText: body.reviewText
    });
    review.authorFirstName = req.session.user.firstName;
    const aggregates = await readAggregates(review.locationId);
    return res.json({ ok: true, review, aggregates });
  } catch (e) {
    return mapError(res, e);
  }
});

// AJAX: delete own review (or admin can delete any)
router.delete('/:id', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const existing = await getReviewById(req.params.id);
    const locationId = existing.locationId;
    const result = await deleteReview(req.params.id, req.session.user);
    const aggregates = await readAggregates(locationId);
    return res.json({ ok: true, ...result, aggregates });
  } catch (e) {
    return mapError(res, e);
  }
});

export default router;
