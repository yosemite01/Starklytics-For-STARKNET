require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const xss = require('xss');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');

const app = express();

/* ------------------------
   Global Middlewares
------------------------- */
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
