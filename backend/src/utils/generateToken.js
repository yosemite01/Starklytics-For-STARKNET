const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets are not configured');
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: process.env.JWT_ISSUER || 'bounty-backend',
    audience: process.env.JWT_AUDIENCE || 'bounty-users',
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'bounty-backend',
      audience: process.env.JWT_AUDIENCE || 'bounty-users',
    }
  );

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'bounty-backend',
      audience: process.env.JWT_AUDIENCE || 'bounty-users',
    });
  } catch (err) {
    console.error('Access token verification failed:', err.message);
    throw new Error('Invalid access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: process.env.JWT_ISSUER || 'bounty-backend',
      audience: process.env.JWT_AUDIENCE || 'bounty-users',
    });
  } catch (err) {
    console.error('Refresh token verification failed:', err.message);
    throw new Error('Invalid refresh token');
  }
};

const decodeToken = (token) => jwt.decode(token, { complete: true });

const getTokenExpiration = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : null;
};

const isTokenExpired = (token) => {
  const exp = getTokenExpiration(token);
  return !exp || exp < new Date();
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
};
