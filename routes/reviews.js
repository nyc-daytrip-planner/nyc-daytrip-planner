import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { locations } from '../config/mongoCollections.js';
import {
  createReview,
  getReviewById,
  getReviewsForLocation,
  updateReview,
  deleteReview,
  getAllReviewsForAdmin
} from '../data/reviews.js';
import { getCommentsForLocation, getAllCommentsForAdmin } from '../data/comments.js';
import { checkId } from '../helpers.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function mapError(res, e) {
  const msg = typeof e === 'string' ? e : 'Server error';
  let status = 400;
  if (/own review/i.test(msg)) status = 403;
  else if (/no review found|no location found/i.test(msg)) status = 404;
  return res.status(status).json({ ok: false, error: msg });
}

async function readAggregates(locationId) {
  const locsCol = await locations();
  const loc = await locsCol.findOne({ _id: new ObjectId(locationId) });
  if (!loc) return null;
  return { averageRating: loc.averageRating, totalReviews: loc.totalReviews };
}

// Temporary admin moderation host. Lets review developer test the moderation flow
// before signin/signup developer ships /admin's real dashboard. Once that lands, this route
// and views/adminModerationHost.handlebars can both be deleted; signin/signup developer just
// includes the two admin* partials inside their dashboard view.
router.get('/admin-mod-host', requireAdmin, async function(req, res) {
  try {
    const allReviews = await getAllReviewsForAdmin();
    const allComments = await getAllCommentsForAdmin();
    return res.render('adminModerationHost', {
      title: 'Admin Moderation',
      allReviews,
      allComments
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

// Temporary host page for testing the reviews partial.
// explore developer will eventually render the same partial inside /explore/:id.
router.get('/location/:id', async function(req, res) {
  let locationId;
  try {
    locationId = checkId(req.params.id);
  } catch (e) {
    return res.status(400).render('error', {
      title: 'Bad Request',
      error: typeof e === 'string' ? e : 'Invalid id'
    });
  }

  try {
    const locsCol = await locations();
    const location = await locsCol.findOne({ _id: new ObjectId(locationId) });
    if (!location) {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: 'Location not found'
      });
    }
    location._id = location._id.toString();

    const reviewsList = await getReviewsForLocation(locationId);
    const commentsList = await getCommentsForLocation(locationId);
    const userReview = req.session.user
      ? reviewsList.find((r) => r.userId === req.session.user._id) || null
      : null;

    return res.render('reviewsHost', {
      title: location.name,
      location,
      reviewsList,
      commentsList,
      userReview
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

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
