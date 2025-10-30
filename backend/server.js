require('dotenv').config();
console.log("✅ Starting server.js...");

const mongoose = require('mongoose');
const { app, server } = require('./src/app'); // adjust path if app.js is in src/
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('PORT:', PORT);
console.log('MONGO_URI:', MONGO_URI ? 'Loaded' : 'Missing');

// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err);
  });
