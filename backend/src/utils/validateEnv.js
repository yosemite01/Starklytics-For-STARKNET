const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
  'NODE_ENV'
];

const optionalEnvVars = [
  'EMAIL_SERVICE_API_KEY',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_SECRET',
  'TWITTER_CLIENT_SECRET',
  'SENTRY_DSN'
];

function validateEnv() {
  const missingRequired = requiredEnvVars.filter(env => !process.env[env]);
  const missingOptional = optionalEnvVars.filter(env => !process.env[env]);

  if (missingRequired.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: Missing required environment variables:');
    missingRequired.forEach(env => console.error(`   - ${env}`));
    console.error('\nThese variables are required for the server to function. Please set them in your environment.');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ Warning: Missing optional environment variables:');
    missingOptional.forEach(env => console.warn(`   - ${env}`));
    console.warn('\nSome features may be disabled without these variables.');
  }

  // Validate JWT secrets
  if (process.env.JWT_SECRET?.length < 32) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET?.length < 32) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: JWT_REFRESH_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  // Validate CORS origin
  if (process.env.NODE_ENV === 'production') {
    try {
      new URL(process.env.CORS_ORIGIN);
    } catch (e) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error: CORS_ORIGIN must be a valid URL in production');
      process.exit(1);
    }
  }

  // MongoDB URI validation
  if (!process.env.MONGO_URI?.includes('mongodb')) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error: MONGO_URI must be a valid MongoDB connection string');
    process.exit(1);
  }

  console.log('\x1b[32m%s\x1b[0m', '✅ Environment validation passed');
}

module.exports = validateEnv;