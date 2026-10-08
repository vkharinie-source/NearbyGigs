const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints (login, register, reset-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Rate limiter for OTP requests and parent verification
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 OTP requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 10 minutes before requesting again.',
  },
});

// Rate limiter for Emergency SOS (prevents spam while allowing emergency retries)
const sosLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Emergency request received. Please wait briefly before re-transmitting.',
  },
});

// General API rate limiter for all other endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please slow down your requests.',
  },
});

module.exports = {
  authLimiter,
  otpLimiter,
  sosLimiter,
  apiLimiter,
};
