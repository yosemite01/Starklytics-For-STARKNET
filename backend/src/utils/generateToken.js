const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
  // Validate required environment variables
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are not configured');
  }

  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'bounty-backend',
      audience: 'bounty-users'
    }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    { 
      userId: payload.userId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'bounty-backend',
      audience: 'bounty-users'
    }
  );

  return {
    accessToken,
    refreshToken
  };
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'bounty-backend',
      audience: 'bounty-users'
    });
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'bounty-backend',
      audience: 'bounty-users'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Decode token without verification (for debugging)
const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

// Get token expiration time
const getTokenExpiration = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
};

// Check if token is expired
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }
  return expiration < new Date();
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired
};