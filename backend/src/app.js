require('dotenv').config({ debug: false });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const rateLimiter = require('./utils/rateLimiter');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');

const app = express();

/* ------------------------
   Global Middlewares
------------------------- */
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
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
   Health Check Route
------------------------- */
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
  };
  res.status(200).json(healthcheck);
});

/* ------------------------
   API Routes with Rate Limiters
------------------------- */
app.use('/api/auth', rateLimiter.auth, authRoutes);
app.use('/api/bounties', rateLimiter.create, bountyRoutes);

/* ------------------------
   404 Handler
------------------------- */
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
