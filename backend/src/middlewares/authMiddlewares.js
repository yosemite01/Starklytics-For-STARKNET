const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authMiddleware = {
  // Authenticate JWT token
  authenticate: async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication attempted without token', {
          requestId: req.requestId,
          ip: req.ip,
          path: req.path
        });
        
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        logger.warn('Authentication attempted with token for inactive/deleted user', {
          requestId: req.requestId,
          userId: decoded.userId,
          email: decoded.email
        });
        
        return res.status(401).json({
          success: false,
          message: 'User account is inactive or deleted'
        });
      }

      // Add user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      logger.debug('User authenticated successfully', {
        requestId: req.requestId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      });

      next();
    } catch (error) {
      logger.warn('Authentication failed', {
        requestId: req.requestId,
        error: error.message,
        path: req.path
      });

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  },

  // Require specific roles
  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        logger.error('requireRole middleware called without authentication', {
          requestId: req.requestId,
          path: req.path
        });
        
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Access denied - insufficient role', {
          requestId: req.requestId,
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      logger.debug('Role authorization successful', {
        requestId: req.requestId,
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });

      next();
    };
  },

  // Optional authentication (doesn't fail if no token)
  optionalAuth: async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      logger.debug('Optional authentication failed', {
        requestId: req.requestId,
        error: error.message
      });
    }
    
    next();
  },

  // Check if user is admin
  requireAdmin: (req, res, next) => {
    return authMiddleware.requireRole(['admin'])(req, res, next);
  },

  // Check if user is creator or admin
  requireCreator: (req, res, next) => {
    return authMiddleware.requireRole(['creator', 'admin'])(req, res, next);
  }
};

module.exports = authMiddleware;