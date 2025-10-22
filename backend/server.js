const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
require('dotenv').config({ debug: false });

console.log("✅ Starting server.js...");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not defined. Set the MONGO_URI environment variable before starting the server.');
  process.exit(1);
}

let app;
try {
  app = require('./src/app');
  console.log("✅ App loaded successfully");
} catch (err) {
  console.error("❌ Error loading app.js:", err);
  process.exit(1); // Exit if app fails to load
}

// Define root route (optional)
if (app) {
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to Starklytics API'
    });
  });
}

const startServer = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    logger.info('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error: error.message });
  }
};

startServer();
