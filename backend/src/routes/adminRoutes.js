const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddlewares');
const User = require('../models/User');
const Bounty = require('../models/Bounty');
const logger = require('../utils/logger');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// ============================================
// USER MANAGEMENT ENDPOINTS
// ============================================

// Get all users
router.get('/users', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.isActive ? 'active' : 'inactive',
          authProvider: user.authProvider,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
router.get('/users/:userId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          status: user.isActive ? 'active' : 'inactive',
          authProvider: user.authProvider,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Suspend user
router.post('/users/:userId/suspend', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    logger.info(`User suspended: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id,
      suspendedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    logger.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

// Activate user
router.post('/users/:userId/activate', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    logger.info(`User activated: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id,
      activatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    logger.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    });
  }
});

// Delete user
router.delete('/users/:userId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User deleted: ${user.email}`, {
      requestId: req.requestId,
      userId: user._id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// ============================================
// BOUNTY MODERATION ENDPOINTS
// ============================================

// Get all bounties for moderation
router.get('/bounties', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [bounties, total] = await Promise.all([
      Bounty.find(query)
        .populate('createdBy', 'email firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Bounty.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        bounties,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalBounties: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching bounties for moderation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bounties'
    });
  }
});

// Approve bounty
router.post('/bounties/:bountyId/approve', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const bounty = await Bounty.findById(req.params.bountyId);
    
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    bounty.status = 'active';
    await bounty.save();

    logger.info(`Bounty approved: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      approvedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Bounty approved successfully'
    });
  } catch (error) {
    logger.error('Error approving bounty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve bounty'
    });
  }
});

// Reject bounty
router.post('/bounties/:bountyId/reject', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const bounty = await Bounty.findById(req.params.bountyId);
    
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    bounty.status = 'rejected';
    await bounty.save();

    logger.info(`Bounty rejected: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      rejectedBy: req.user.userId,
      reason
    });

    res.json({
      success: true,
      message: 'Bounty rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting bounty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject bounty'
    });
  }
});

// Delete bounty
router.delete('/bounties/:bountyId', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const bounty = await Bounty.findByIdAndDelete(req.params.bountyId);
    
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    logger.info(`Bounty deleted: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Bounty deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting bounty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bounty'
    });
  }
});

// ============================================
// REPORTS ENDPOINTS
// ============================================

// Get all reports
router.get('/reports', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // For now, return empty reports (would need Report model)
    const reports = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// ============================================
// STATISTICS ENDPOINTS
// ============================================

// Get admin statistics
router.get('/stats', authMiddleware.authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalBounties, activeBounties, usersByRole, bountyStats] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Bounty.countDocuments(),
      Bounty.countDocuments({ status: 'active' }),
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Bounty.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalReward: { $sum: '$reward.amount' } } }
      ])
    ]);

    const totalRewards = bountyStats.reduce((sum, stat) => sum + (stat.totalReward || 0), 0);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: usersByRole
        },
        bounties: {
          total: totalBounties,
          active: activeBounties,
          byStatus: bountyStats,
          totalRewards
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
