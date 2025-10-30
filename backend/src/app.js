require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const xss = require('xss');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/errorMiddleware');
const validateEnv = require('./utils/validateEnv');

// Routes
const authRoutes = require('./routes/authRoutes');
const bountyRoutes = require('./routes/bountyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contractRoutes = require('./routes/contractRoutes');
const { router: dashboardRoutes } = require('./routes/dashboardRoutes');
const { router: queryRoutes } = require('./routes/queryRoutes');

// Validate environment variables before startup
validateEnv();

const app = express();
const server = http.createServer(app);

/* ------------------------
   WebSocket Setup
------------------------- */
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN
        : '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`🟢 WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`🔴 WebSocket client disconnected: ${socket.id}`);
  });
});

/* ------------------------
   Security & Middleware
------------------------- */

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.CORS_ORIGIN],
      },
    },
  })
);

// CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  req.requestId = uuidv4();
  logger.info(`${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    ip: req.ip,
  });
  next();
});

/* ------------------------
   Sanitization
------------------------- */

// Mongo Injection & XSS
//app.use(mongoSanitize());
/* ------------------------
   Sanitization
------------------------- */

// ✅ Fix for "Cannot set property query..." issue;

// Custom sanitization logic (safe with Express v5)
app.use((req, res, next) => {
  try {
    // Sanitize only body and params (skip req.query to avoid read-only error)
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);

    // XSS sanitization
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const key in obj) {
        if (typeof obj[key] === 'string') obj[key] = xss(obj[key]);
        else if (typeof obj[key] === 'object') obj[key] = sanitize(obj[key]);
      }
      return obj;
    };

    req.body = sanitize(req.body);
    req.params = sanitize(req.params);
    // ⚠️ skip req.query to prevent crash
  } catch (err) {
    console.error('Sanitization error:', err.message);
  }
  next();
});


/* ------------------------
   Health Check
------------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    status: 'OK',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/* ------------------------
   Routes
------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/queries', queryRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Starklytics API',
  });
});

/* ------------------------
   404 + Global Error
------------------------- */
app.use((req, res) => {
  logger.warn(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

/* ------------------------
   Export App + Server + IO
------------------------- */
module.exports = { app, server, io };
