const User = require('../models/User');
const { generateTokens } = require('../utils/generateToken');
const logger = require('../utils/logger');

const authController = {
  // Register new user
  async register(req, res) {
    const { email, password, role, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${email}`, {
        requestId: req.requestId,
        email
      });
      
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      role: role || 'analyst',
      firstName,
      lastName
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${email}`, {
      requestId: req.requestId,
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          createdAt: user.createdAt
        },
        accessToken,
        refreshToken
      }
    });
  },

  // Login user
  async login(req, res) {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      logger.warn(`Login attempt with invalid email: ${email}`, {
        requestId: req.requestId,
        email
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login attempt with invalid password for: ${email}`, {
        requestId: req.requestId,
        userId: user._id,
        email
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Update refresh token and last login
    user.refreshToken = refreshToken;
    await user.updateLastLogin();

    logger.info(`User logged in: ${email}`, {
      requestId: req.requestId,
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          lastLogin: user.lastLogin
        },
        accessToken,
        refreshToken
      }
    });
  },

  // Refresh access token
  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken, isActive: true }).select('+refreshToken');
    if (!user) {
      logger.warn('Invalid refresh token used', {
        requestId: req.requestId
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      logger.warn(`Expired/Invalid refresh token for user: ${user.email}`, {
        requestId: req.requestId,
        userId: user._id,
        error: error.message
      });
      
      // Clear invalid refresh token
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
      
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`Token refreshed for user: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  },

  // Logout user
  async logout(req, res) {
    const user = await User.findById(req.user.userId);
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    logger.info(`User logged out: ${req.user.email}`, {
      requestId: req.requestId,
      userId: req.user.userId
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  },

  // Get current user profile
  async getProfile(req, res) {
    const user = await User.findById(req.user.userId);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  },

  // Update user profile
  async updateProfile(req, res) {
    const { firstName, lastName } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    
    await user.save();

    logger.info(`Profile updated for user: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          updatedAt: user.updatedAt
        }
      }
    });
  },

  // Change password
  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }
};

module.exports = authController;