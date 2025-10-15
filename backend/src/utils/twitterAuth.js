const axios = require('axios');
const logger = require('./logger');

class TwitterAuthService {
  constructor() {
    this.clientId = process.env.TWITTER_CLIENT_ID;
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from frontend
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<Object>} - Access token and user info
   */
  async exchangeCodeForToken(code, codeVerifier) {
    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post('https://api.twitter.com/2/oauth2/token', null, {
        params: {
          code,
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:8083/auth/twitter/callback',
          code_verifier: codeVerifier
        },
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Twitter token exchange failed', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to exchange Twitter authorization code');
    }
  }

  /**
   * Get user information from Twitter API
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - User profile information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          'user.fields': 'id,name,username,profile_image_url,email,verified'
        }
      });

      const user = response.data.data;

      return {
        twitterId: user.id,
        email: user.email || `${user.username}@twitter.local`, // Twitter may not provide email
        firstName: user.name.split(' ')[0] || '',
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        username: user.username,
        profilePicture: user.profile_image_url || '',
        isEmailVerified: user.verified || false
      };
    } catch (error) {
      logger.error('Failed to get Twitter user info', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to get Twitter user information');
    }
  }

  /**
   * Validate that required Twitter OAuth environment variables are set
   */
  validateConfig() {
    if (!process.env.TWITTER_CLIENT_ID) {
      throw new Error('TWITTER_CLIENT_ID environment variable is required');
    }

    if (!process.env.TWITTER_CLIENT_SECRET) {
      throw new Error('TWITTER_CLIENT_SECRET environment variable is required');
    }

    logger.info('Twitter OAuth configuration validated');
  }

  /**
   * Get Twitter OAuth configuration for frontend
   */
  getAuthConfig() {
    return {
      clientId: this.clientId,
      // Don't expose client secret to frontend
    };
  }
}

// Create singleton instance
const twitterAuthService = new TwitterAuthService();

// Validate configuration on startup
try {
  twitterAuthService.validateConfig();
} catch (error) {
  logger.error('Twitter OAuth configuration error:', error.message);
}

module.exports = twitterAuthService;