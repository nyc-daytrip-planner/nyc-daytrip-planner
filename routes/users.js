import { Router } from 'express';
import { createUser, loginUser, getUserById } from '../data/users.js';
import { requireLogin, requireGuest, requireAdmin } from '../middleware/auth.js';
import xss from 'xss';

const router = Router();

// GET /login
router.get('/login', requireGuest, async function(req, res) {
  res.render('login', { title: 'Login' });
});

// POST /login
router.post('/login', requireGuest, async function(req, res) {
  let body = req.body;
  if (!body) body = {};

  try {
    let email    = xss(body.email);
    let password = xss(body.password);

    const user = await loginUser(email, password);
    req.session.user = user;

    if (user.role === 'admin') {
      return res.redirect('/admin');
    } else {
      return res.redirect('/explore');
    }
  } catch (e) {
    return res.status(400).render('login', {
      title: 'Login',
      error: e,
      email: body.email
    });
  }
});

// GET /signup
router.get('/signup', requireGuest, async function(req, res) {
  res.render('signup', { title: 'Sign Up' });
});

// POST /signup
router.post('/signup', requireGuest, async function(req, res) {
  let body = req.body;
  if (!body) body = {};

  try {
    let firstName       = xss(body.firstName);
    let lastName        = xss(body.lastName);
    let email           = xss(body.email);
    let password        = xss(body.password);
    let confirmPassword = xss(body.confirmPassword);

    if (password !== confirmPassword) {
      throw 'Passwords do not match';
    }

    const result = await createUser(firstName, lastName, email, password);

    if (result.signupCompleted === true) {
      return res.redirect('/login');
    }

    return res.status(500).render('error', {
      title: 'Internal Server Error',
      error: 'Internal Server Error'
    });
  } catch (e) {
    const errorMessage = typeof e === 'string' ? e : 'Unable to create account';
    const isDuplicateEmail =
      errorMessage.toLowerCase().includes('email') &&
      (errorMessage.toLowerCase().includes('already') ||
       errorMessage.toLowerCase().includes('used'));

    return res.status(400).render('signup', {
      title: 'Sign Up',
      error: errorMessage,
      emailError: isDuplicateEmail ? 'An account with this email already exists' : '',
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email
    });
  }
});

// GET /profile
router.get('/profile', requireLogin, async function(req, res) {
  try {
    const user = await getUserById(req.session.user._id);

    res.render('profile', {
      title: 'Profile',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      favoriteLocations: user.favoriteLocations,
      friends: user.friends,
      createdAt: user.createdAt
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: e
    });
  }
});

// POST /logout
router.post('/logout', requireLogin, async function(req, res) {
  req.session.destroy(function() {
    res.clearCookie('DayOutNYC');
    res.redirect('/login');
  });
});

export default router;
