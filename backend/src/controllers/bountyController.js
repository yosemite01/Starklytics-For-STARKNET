const Bounty = require('../models/Bounty');
const logger = require('../utils/logger');

// Simple in-memory cache (replace with Redis in production)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const bountyController = {
  // Create new bounty
  async createBounty(req, res) {
    const bountyData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const bounty = new Bounty(bountyData);
    await bounty.save();

    await bounty.populate('createdBy', 'email firstName lastName');

    // Clear cache
    cache.clear();

    logger.info(`Bounty created: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Bounty created successfully',
      data: { bounty }
    });
  },

  // Get all bounties with pagination and filters
  async getBounties(req, res) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minReward,
      maxReward
    } = req.query;

    const cacheKey = `bounties:${JSON.stringify(req.query)}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }
    }

    // Build query
    const query = { isPublic: true };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    if (minReward || maxReward) {
      query['reward.amount'] = {};
      if (minReward) query['reward.amount'].$gte = Number(minReward);
      if (maxReward) query['reward.amount'].$lte = Number(maxReward);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    if (search) {
      sort.score = { $meta: 'textScore' };
    }

    const skip = (page - 1) * limit;

    // Execute query
    const [bounties, total] = await Promise.all([
      Bounty.find(query)
        .populate('createdBy', 'email firstName lastName')
        .populate('assignedTo', 'email firstName lastName')
        .select('-submissions.content -submissions.feedback')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Bounty.countDocuments(query)
    ]);

    const result = {
      bounties,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBounties: total,
        limit: Number(limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    // Cache result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: result
    });
  },

  // Get single bounty by ID
  async getBountyById(req, res) {
    const { id } = req.params;

    const bounty = await Bounty.findOne({ _id: id, isPublic: true })
      .populate('createdBy', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName')
      .populate('submissions.user', 'email firstName lastName');

    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    // Increment view count (async, don't wait)
    bounty.incrementViews().catch(err => 
      logger.error('Failed to increment bounty views:', err)
    );

    res.json({
      success: true,
      data: { bounty }
    });
  },

  // Update bounty
  async updateBounty(req, res) {
    const { id } = req.params;
    const updates = req.body;

    // Find bounty
    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' || 
                   bounty.createdBy.toString() === req.user.userId;
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this bounty'
      });
    }

    // Update bounty
    Object.assign(bounty, updates);
    await bounty.save();

    await bounty.populate('createdBy', 'email firstName lastName');
    await bounty.populate('assignedTo', 'email firstName lastName');

    // Clear cache
    cache.clear();

    logger.info(`Bounty updated: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Bounty updated successfully',
      data: { bounty }
    });
  },

  // Delete bounty
  async deleteBounty(req, res) {
    const { id } = req.params;

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || 
                     bounty.createdBy.toString() === req.user.userId;
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this bounty'
      });
    }

    await Bounty.findByIdAndDelete(id);

    // Clear cache
    cache.clear();

    logger.info(`Bounty deleted: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Bounty deleted successfully'
    });
  },

  // Get user's bounties
  async getMyBounties(req, res) {
    const { page = 1, limit = 10, status } = req.query;

    const query = { createdBy: req.user.userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [bounties, total] = await Promise.all([
      Bounty.find(query)
        .populate('assignedTo', 'email firstName lastName')
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
          limit: Number(limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  },

  // Submit to bounty
  async submitToBounty(req, res) {
    const { id } = req.params;
    const { content, attachments = [] } = req.body;

    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({
        success: false,
        message: 'Bounty not found'
      });
    }

    if (bounty.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bounty is not accepting submissions'
      });
    }

    // Check if user already submitted
    const existingSubmission = bounty.submissions.find(
      sub => sub.user.toString() === req.user.userId
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted to this bounty'
      });
    }

    const submission = {
      user: req.user.userId,
      content,
      attachments,
      submittedAt: new Date()
    };

    await bounty.addSubmission(submission);

    logger.info(`Submission added to bounty: ${bounty.title}`, {
      requestId: req.requestId,
      bountyId: bounty._id,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Submission added successfully'
    });
  },

  // Get bounty statistics (admin only)
  async getBountyStats(req, res) {
    const stats = await Bounty.getStats();
    
    const totalBounties = await Bounty.countDocuments();
    const activeBounties = await Bounty.countDocuments({ status: 'active' });
    const totalRewards = await Bounty.aggregate([
      { $group: { _id: null, total: { $sum: '$reward.amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBounties,
          activeBounties,
          totalRewardsValue: totalRewards[0]?.total || 0
        },
        byStatus: stats
      }
    });
  },

  // Search bounties
  async searchBounties(req, res) {
    const { 
      q: searchTerm, 
      category, 
      status = 'active',
      minReward,
      maxReward,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = { status };
    if (category) filters.category = category;
    
    if (minReward || maxReward) {
      filters['reward.amount'] = {};
      if (minReward) filters['reward.amount'].$gte = Number(minReward);
      if (maxReward) filters['reward.amount'].$lte = Number(maxReward);
    }

    const skip = (page - 1) * limit;

    const bounties = await Bounty.search(searchTerm, filters)
      .skip(skip)
      .limit(Number(limit));

    const total = await Bounty.countDocuments({
      ...filters,
      isPublic: true,
      ...(searchTerm && { $text: { $search: searchTerm } })
    });

    res.json({
      success: true,
      data: {
        bounties,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalResults: total,
          limit: Number(limit)
        },
        searchTerm
      }
    });
  },

  // Join bounty
  async joinBounty(req, res) {
    const { id } = req.params;
    
    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ success: false, message: 'Bounty not found' });
    }

    if (bounty.createdBy.toString() === req.user.userId) {
      return res.status(400).json({ success: false, message: 'Cannot join your own bounty' });
    }

    if (bounty.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Bounty is not active' });
    }

    res.json({ success: true, message: 'Ready to submit solution' });
  },

  // Select winner
  async selectWinner(req, res) {
    const { id } = req.params;
    const { winnerId } = req.body;
    
    const bounty = await Bounty.findById(id);
    if (!bounty) {
      return res.status(404).json({ success: false, message: 'Bounty not found' });
    }

    if (bounty.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Only bounty creator can select winner' });
    }

    bounty.assignedTo = winnerId;
    bounty.status = 'completed';
    await bounty.save();

    res.json({ success: true, message: 'Winner selected successfully' });
  }
};

module.exports = bountyController;