const { OAuth2Client } = require('google-auth-library');
const logger = require('./logger');

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * Verify Google ID token and extract user information
   * @param {string} token - Google ID token from frontend
   * @returns {Promise<Object>} - User profile information
   */
  async verifyToken(token) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Extract user information from Google payload
      const userInfo = {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        profilePicture: payload.picture || '',
        isEmailVerified: payload.email_verified || false
      };

      logger.debug('Google token verified successfully', {
        email: userInfo.email,
        googleId: userInfo.googleId
      });

      return userInfo;
    } catch (error) {
      logger.error('Google token verification failed', {
        error: error.message,
        token: token?.substring(0, 50) + '...' // Log partial token for debugging
      });

      throw new Error('Invalid Google token');
    }
  }

  /**
   * Validate that required Google OAuth environment variables are set
   */
  validateConfig() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is required');
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      logger.warn('GOOGLE_CLIENT_SECRET not set - some features may not work');
    }

    logger.info('Google OAuth configuration validated');
  }

  /**
   * Get Google OAuth URLs and client information
   */
  getAuthConfig() {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      // Don't expose client secret to frontend
    };
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService();

// Validate configuration on startup
try {
  googleAuthService.validateConfig();
} catch (error) {
  logger.error('Google OAuth configuration error:', error.message);
}

module.exports = googleAuthService;