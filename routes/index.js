import usersRouter from './users.js';
import locationsRouter from './locations.js';
import plansRouter from './plans.js';
import reviewsRouter from './reviews.js';
import adminRouter from './admin.js';

const constructorMethod = (app) => {
  app.use('/', usersRouter);
  app.use('/explore', locationsRouter);
  app.use('/plans', plansRouter);
  app.use('/reviews', reviewsRouter);
  app.use('/admin', adminRouter);

  app.get('/', (req, res) => {
    if (req.session.user) {
      return res.redirect('/explore');
    }
    return res.redirect('/login');
  });

  app.use('/', (req, res) => {
    res.status(404).render('error', {
      title: 'Page Not Found',
      error: 'Page not found'
    });
  });
};

export default constructorMethod;
