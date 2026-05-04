import { Router } from 'express';
import { createComment, deleteComment } from '../data/comments.js';

const router = Router();

function mapError(res, e) {
  const msg = typeof e === 'string' ? e : 'Server error';
  let status = 400;
  if (/own comment/i.test(msg)) status = 403;
  else if (/no comment found|no location found/i.test(msg)) status = 404;
  return res.status(status).json({ ok: false, error: msg });
}

// AJAX: post a new comment
router.post('/', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const body = req.body || {};
    const comment = await createComment({
      locationId: body.locationId,
      userId: req.session.user._id,
      text: body.text
    });
    comment.authorFirstName = req.session.user.firstName;
    return res.json({ ok: true, comment });
  } catch (e) {
    return mapError(res, e);
  }
});

// AJAX: delete own comment (or admin can delete any)
router.delete('/:id', async function(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'You must be logged in' });
  }
  try {
    const result = await deleteComment(req.params.id, req.session.user);
    return res.json({ ok: true, ...result });
  } catch (e) {
    return mapError(res, e);
  }
});

export default router;
