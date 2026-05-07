import { Router } from 'express';
import xss from 'xss';
import {
  browseLocations,
  getLocationById,
  createLocation,
  getPendingLocations,
  approveLocation,
  rejectLocation,
  toggleFavoriteLocation,
  isFavoritedByUser,
  ALLOWED_TYPES
} from '../data/locations.js';
import { getReviewsForLocation } from '../data/reviews.js';
import { getCommentsForLocation } from '../data/comments.js';
import { requireLogin, requireAdmin } from '../middleware/auth.js';
// requireLogin/requireAdmin redirect or render HTML on failure — fine for
// page navigations but not AJAX. The /admin/:id/approve, /admin/:id/reject,
// and /:id/favorite endpoints below check auth inline and respond with JSON
// instead, matching the pattern in routes/reviews.js + routes/comments.js.
import { checkId } from '../helpers.js';

const router = Router();

function jsonError(res, e) {
  if (typeof e !== 'string') {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
  let status = 400;
  if (/no location found|no user found/i.test(e)) status = 404;
  return res.status(status).json({ ok: false, error: e });
}

function priceLabel(n) {
  if (!n) return '';
  return '$'.repeat(n);
}

function decorateForCard(loc) {
  return { ...loc, priceLabel: priceLabel(loc.priceCategory) };
}

// GET /explore — browse list with filters
router.get('/', async function(req, res) {
  const filters = {};
  if (req.query.type) filters.type = xss(String(req.query.type));
  if (req.query.priceCategory) filters.priceCategory = xss(String(req.query.priceCategory));
  if (req.query.minRating) filters.minRating = xss(String(req.query.minRating));
  if (req.query.search) filters.search = xss(String(req.query.search));
  if (req.query.sort) filters.sort = xss(String(req.query.sort));

  try {
    const list = (await browseLocations(filters)).map(decorateForCard);
    return res.render('explore', {
      title: 'Explore',
      locations: list,
      types: ALLOWED_TYPES,
      activeType: filters.type || '',
      activePrice: filters.priceCategory || '',
      activeMinRating: filters.minRating || '',
      activeSearch: filters.search || '',
      activeSort: filters.sort || 'name',
      empty: list.length === 0
    });
  } catch (e) {
    return res.status(400).render('explore', {
      title: 'Explore',
      error: typeof e === 'string' ? e : 'Server error',
      locations: [],
      types: ALLOWED_TYPES,
      activeType: filters.type || '',
      activePrice: filters.priceCategory || '',
      activeMinRating: filters.minRating || '',
      activeSearch: filters.search || '',
      activeSort: filters.sort || 'name',
      empty: true
    });
  }
});

// GET /explore/add — submit-a-location form
router.get('/add', requireLogin, async function(req, res) {
  res.render('addLocation', { title: 'Suggest a Location', types: ALLOWED_TYPES });
});

// POST /explore — create a new location (user submission or admin add)
router.post('/', requireLogin, async function(req, res) {
  const body = req.body || {};
  const input = {
    name: xss(body.name || ''),
    type: xss(body.type || ''),
    address: xss(body.address || ''),
    zipCode: xss(body.zipCode || ''),
    latitude: xss(String(body.latitude ?? '')),
    longitude: xss(String(body.longitude ?? '')),
    phone: xss(body.phone || ''),
    website: xss(body.website || ''),
    priceCategory: xss(String(body.priceCategory ?? ''))
  };

  try {
    const isAdmin = req.session.user.role === 'admin';
    const created = await createLocation(input, req.session.user._id, isAdmin);
    if (created.approved) {
      return res.redirect('/explore/' + created._id);
    }
    return res.render('addLocation', {
      title: 'Suggest a Location',
      types: ALLOWED_TYPES,
      success: 'Thanks! Your location was submitted and is awaiting admin approval.'
    });
  } catch (e) {
    return res.status(400).render('addLocation', {
      title: 'Suggest a Location',
      types: ALLOWED_TYPES,
      error: typeof e === 'string' ? e : 'Could not create location',
      ...input
    });
  }
});

// GET /explore/admin/pending — admin-only pending approvals page
router.get('/admin/pending', requireAdmin, async function(req, res) {
  try {
    const pending = await getPendingLocations();
    return res.render('adminLocationsHost', {
      title: 'Pending Locations',
      pending
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

function requireAdminJson(req, res) {
  if (!req.session.user) {
    res.status(401).json({ ok: false, error: 'You must be logged in' });
    return false;
  }
  if (req.session.user.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'Admin only' });
    return false;
  }
  return true;
}

// POST /explore/admin/:id/approve — approve pending location
router.post('/admin/:id/approve', async function(req, res) {
  if (!requireAdminJson(req, res)) return;
  try {
    const result = await approveLocation(req.params.id);
    return res.json({ ok: true, ...result });
  } catch (e) {
    return jsonError(res, e);
  }
});

// POST /explore/admin/:id/reject — reject (delete) pending location
router.post('/admin/:id/reject', async function(req, res) {
  if (!requireAdminJson(req, res)) return;
  try {
    const result = await rejectLocation(req.params.id);
    return res.json({ ok: true, ...result });
  } catch (e) {
    return jsonError(res, e);
  }
});

// POST /explore/:id/favorite — toggle favorite (login required)
router.post('/:id/favorite', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const result = await toggleFavoriteLocation(req.session.user._id, req.params.id);
    return res.json({ ok: true, ...result });
  } catch (e) {
    return jsonError(res, e);
  }
});

// GET /explore/:id — location detail page (with reviews + comments)
router.get('/:id', async function(req, res) {
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
    const isAdmin = !!(req.session.user && req.session.user.role === 'admin');
    const location = await getLocationById(locationId, { requireApproved: !isAdmin });
    location.priceLabel = priceLabel(location.priceCategory);

    const reviewsList = await getReviewsForLocation(locationId);
    const commentsList = await getCommentsForLocation(locationId);
    const userReview = req.session.user
      ? reviewsList.find((r) => r.userId === req.session.user._id) || null
      : null;
    let isFavorited = false;
    if (req.session.user) {
      isFavorited = await isFavoritedByUser(req.session.user._id, locationId);
    }

    return res.render('locationDetail', {
      title: location.name,
      location,
      reviewsList,
      commentsList,
      userReview,
      isFavorited,
      isPending: !location.approved
    });
  } catch (e) {
    if (typeof e === 'string' && /no location found/i.test(e)) {
      return res.status(404).render('error', {
        title: 'Not Found',
        error: 'Location not found'
      });
    }
    return res.status(500).render('error', {
      title: 'Server Error',
      error: typeof e === 'string' ? e : 'Server error'
    });
  }
});

export default router;
