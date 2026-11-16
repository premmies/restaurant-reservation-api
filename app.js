const express = require('express');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 100 }));
app.use(mongoSanitize());
app.use(cookieParser());
app.set('query parser', 'extended');
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/restaurants', require('./routes/restaurants'));
app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'ValidationError' || err.code === 11000 ? 400 : 500);
  res.status(status).json({ success: false, message: status === 500 ? 'Server error' : 'Invalid request' });
});
module.exports = app;
