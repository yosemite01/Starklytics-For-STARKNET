const axios = require('axios');
const logger = require('./logger');

class GitHubAuthService {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from frontend
   * @returns {Promise<Object>} - Access token and user info
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error_description || response.data.error);
      }

      return response.data;
    } catch (error) {
      logger.error('GitHub token exchange failed', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to exchange GitHub authorization code');
    }
  }

  /**
   * Get user information from GitHub API
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} - User profile information
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Starklytics-App'
        }
      });

      const user = response.data;

      // Get user email if not provided in basic info
      let email = user.email;
      if (!email) {
        try {
          const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'Starklytics-App'
            }
          });
          const primaryEmail = emailResponse.data.find(email => email.primary);
          email = primaryEmail ? primaryEmail.email : `${user.login}@github.local`;
        } catch (emailError) {
          logger.warn('Could not fetch GitHub user email, using fallback', { username: user.login });
          email = `${user.login}@github.local`;
        }
      }

      return {
        githubId: user.id.toString(),
        email: email,
        firstName: user.name ? user.name.split(' ')[0] : user.login,
        lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        username: user.login,
        profilePicture: user.avatar_url || '',
        isEmailVerified: true // GitHub emails are verified
      };
    } catch (error) {
      logger.error('Failed to get GitHub user info', {
        error: error.response?.data || error.message
      });
      throw new Error('Failed to get GitHub user information');
    }
  }

  /**
   * Validate that required GitHub OAuth environment variables are set
   */
  validateConfig() {
    if (!process.env.GITHUB_CLIENT_ID) {
      throw new Error('GITHUB_CLIENT_ID environment variable is required');
    }

    if (!process.env.GITHUB_CLIENT_SECRET) {
      throw new Error('GITHUB_CLIENT_SECRET environment variable is required');
    }

    logger.info('GitHub OAuth configuration validated');
  }

  /**
   * Get GitHub OAuth configuration for frontend
   */
  getAuthConfig() {
    return {
      clientId: this.clientId,
      // Don't expose client secret to frontend
    };
  }
}

// Create singleton instance
const githubAuthService = new GitHubAuthService();

// Validate configuration on startup
try {
  githubAuthService.validateConfig();
} catch (error) {
  logger.error('GitHub OAuth configuration error:', error.message);
}

module.exports = githubAuthService;