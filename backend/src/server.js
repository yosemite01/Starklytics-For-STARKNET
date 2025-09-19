require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const rateLimiter = require('./utils/rateLimiter');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const requestId = require('uuid').v4();
  req.requestId = requestId;
  
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = 'Error';
    res.status(503).json(healthcheck);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bounties', bountyRoutes);

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;