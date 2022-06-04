const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');


const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARE
// Set security HTTP headers

app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        'child-src': ['blob:', 'https://js.stripe.com/'],
        'connect-src': ['https://*.mapbox.com', "'self'", 'ws://localhost:8000', 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.27.2/axios.min.js', 'https://js.stripe.com/v3/'],
        'default-src': ["'self'"],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'script-src': ["'self'", 'https://*.mapbox.com', 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.27.2/axios.min.js', 'ws://localhost:8000', 'https://js.stripe.com/v3/'],
        'style-src': ["'self'", 'https://'],
        'worker-src': ['blob:']
      }
    }
}));

// Development Logging
if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
};

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMS: 60 *60 * 1000, 
    message: 'Too many requests from this IP, please try again in an hour'
});

app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});


// ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Resolves all unhandled routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);


module.exports = app;
