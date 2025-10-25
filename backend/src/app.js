require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const xss = require('xss');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/errorMiddleware');
const validateEnv = require('./utils/validateEnv');

const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');

// Validate environment variables before startup
validateEnv();

const app = express();

/* ------------------------
   Global Middlewares
------------------------- */

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongoConnection: mongoose.connection.readyState === 1
  };
  res.status(200).json(healthcheck);
});

// Request logging
app.use((req, res, next) => {
  req.requestId = uuidv4();
  logger.info(`${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

/* ------------------------
   MongoDB Sanitization
------------------------- */
app.use((req, res, next) => {
  const body = req.body ? { ...req.body } : {};
  const query = req.query ? { ...req.query } : {};
  const params = req.params ? { ...req.params } : {};

  req.body = mongoSanitize.sanitize(body, { replaceWithEmptyObject: true });
  req.query = mongoSanitize.sanitize(query, { replaceWithEmptyObject: true });
  req.params = mongoSanitize.sanitize(params, { replaceWithEmptyObject: true });

  next();
});

/* ------------------------
   XSS Sanitization
------------------------- */
app.use((req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
      if (typeof obj[key] === 'string') obj[key] = xss(obj[key]);
      else if (typeof obj[key] === 'object') obj[key] = sanitizeObject(obj[key]);
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
});

/* ------------------------
   Health Check
------------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
});

/* ------------------------
   API Routes
------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/bounties', bountyRoutes);

/* ------------------------
   404 Handler
------------------------- */
// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Starklytics API'
  });
});

app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/* ------------------------
   Global Error Handler
------------------------- */
app.use(errorMiddleware);

module.exports = app;
