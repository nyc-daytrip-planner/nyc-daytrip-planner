const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access Denied',
      error: 'You do not have permission to view this page'
    });
  }
  next();
};

const requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/explore');
  }
  next();
};

export { requireLogin, requireAdmin, requireGuest };