import express from 'express';
import session from 'express-session';
import { engine } from 'express-handlebars';
import configRoutes from './routes/index.js';

const app = express();

// view engine setup
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: './views/layouts',
  partialsDir: './views/partials',
  helpers: {
    eq: (a, b) => a === b
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// middleware
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

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});