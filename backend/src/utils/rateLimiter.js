const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later'
    });
  }
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
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

// API creation limiter (for creating bounties, submissions, etc.)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 create operations per hour
  message: {
    success: false,
    message: 'Too many create operations, please try again later'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip;
  },
  handler: (req, res) => {
    logger.warn('Create rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many create operations, please try again later'
    });
  }
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later'
  },
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      email: req.body?.email,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again in 1 hour'
    });
  }
});

// Search limiter (more permissive but still limited)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down'
  },
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      searchTerm: req.query?.q,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please slow down'
    });
  }
});

module.exports = {
  general: generalLimiter,
  auth: authLimiter,
  create: createLimiter,
  passwordReset: passwordResetLimiter,
  search: searchLimiter
};