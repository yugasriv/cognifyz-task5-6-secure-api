const rateLimit = require('express-rate-limit');

// General API limiter — generous, just to stop abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // adds RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again after 15 minutes.' },
});

// Stricter limiter for auth routes — slows down brute-force login/register attempts
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again after 10 minutes.' },
});

module.exports = { generalLimiter, authLimiter };
