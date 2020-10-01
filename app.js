const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const AppError = require('./utilis/AppError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
// const { expressCspHeader, INLINE, NONE, SELF } = require('express-csp-header');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true
  })
);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.use(helmet());

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

const Limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many request from this ip.Please try again in an hour'
});

app.use('/api', Limiter);

//for cookie in localhost
// app.use(cookieParser());
// app.use(
//   session({
//     secret: 'yoursecret',
//     cookie: {
//       path: '/',
//       domain: 'http://localhost:3000/',
//       maxAge: 1000 * 60 * 24 // 24 hours
//     }
//   })
// );
// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Origin', req.headers.origin);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
//   );
//   next();
// });

//routes
app.use(function(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    // "default-src * 'unsafe-inline'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com https://fonts.googleapis.com/"
    "script-src 'self' cdnjs.cloudflare.com"
  );
  // console.log(req.cookies);
  return next();
});
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// app.use(
//   expressCspHeader({
//     directives: {
//       'default-src': [SELF],
//       'script-src': [SELF, INLINE, 'cdnjs.cloudflare.com'],
//       'style-src': [SELF, 'mystyles.net'],
//       'img-src': ['data:', 'images.com'],
//       'worker-src': [NONE],
//       'block-all-mixed-content': true
//     }
//   })
// );

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} in this server`
  // });

  // const err = new Error(`can't find ${req.originalUrl} in this server`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
