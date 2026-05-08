import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import configRoutes from './routes/index.js';

const app = express();

// view engine setup
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: './views/layouts',
  partialsDir: './views/partials',
  helpers: {
    eq: (a, b) => a === b,
    priceLabel: (n) => (Number.isInteger(n) && n > 0 ? '$'.repeat(n) : '')
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// session
app.use(session({
  name: 'DayOutNYC',
  secret: "This is a secret.. shhh don't tell anyone",
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 60000 * 60 * 24 }
}));

// makes session user available in every handlebars template
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

let totalRequests = 0;
app.use((req, res, next) => {
  totalRequests++;

  console.log('The request has all the following cookies:');
  console.log(req.cookies);

  if (req.cookies.lastAccessed) {
    console.log('This user last accessed the site at ' + req.cookies.lastAccessed);
  } else {
    console.log('This user has never accessed the site before');
  }

  if (totalRequests % 5 === 0) {
    const anHourAgo = new Date();
    anHourAgo.setHours(anHourAgo.getHours() - 1);
    res.cookie('lastAccessed', '', { expires: anHourAgo, httpOnly: true });
    res.clearCookie('lastAccessed');
    return next();
  }

  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  res.cookie('lastAccessed', now.toString(), {
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'lax'
  });

  next();
});

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});