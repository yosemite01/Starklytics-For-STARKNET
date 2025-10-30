const { OAuth2Client } = require('google-auth-library');
const logger = require('./logger');

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * Exchange authorization code for access token and get user info
   * @param {string} code - Authorization code from Google OAuth
   * @returns {Promise<Object>} - User profile information
   */
  async verifyToken(code) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`
      });

      // Get user info using access token
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
      const userInfo = await response.json();

      if (!userInfo.email) {
        throw new Error('No email in Google response');
      }

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        profilePicture: userInfo.picture || '',
        isEmailVerified: userInfo.verified_email || false
      };
    } catch (error) {
      logger.error('Google auth failed', { error: error.message });
      throw new Error('Google authentication failed');
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