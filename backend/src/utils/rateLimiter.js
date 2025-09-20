const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit'); // ✅ normalize IPv6/IP
const logger = require('./logger');

// 🔹 Helper to build a consistent handler
const buildHandler = (type, getExtra = () => ({})) => (req, res) => {
  logger.warn(`${type} rate limit exceeded`, {
    requestId: req.requestId,
    ip: req.ip,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ...getExtra(req)
  });

  res.status(429).json({
    success: false,
    message: `Too many ${type} requests, please try again later`
  });
};

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('general')
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes'
    });
  }
});

// API creation limiter (bounties, submissions, etc.)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req), // ✅ safe fallback
  handler: buildHandler('create', (req) => ({ userId: req.user?.userId }))
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: buildHandler('password reset', (req) => ({ email: req.body?.email }))
});

// Search limiter (more permissive)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  handler: buildHandler('search', (req) => ({ searchTerm: req.query?.q }))
});

module.exports = {
  general: generalLimiter,
  auth: authLimiter,
  create: createLimiter,
  passwordReset: passwordResetLimiter,
  search: searchLimiter
};
