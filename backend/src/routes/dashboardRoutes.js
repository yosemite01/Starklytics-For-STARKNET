const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddlewares');
const validateMiddleware = require('../middlewares/validateMiddleware');
const { z } = require('zod');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Dashboard Schema
const dashboardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  widgets: [{
    id: String,
    type: String,
    title: String,
    config: mongoose.Schema.Types.Mixed,
    position: {
      x: Number,
      y: Number,
      w: Number,
      h: Number
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

// Validation schemas
const createDashboardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    config: z.any().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number()
    })
  })).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const updateDashboardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    config: z.any().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number()
    })
  })).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// ============================================
// DASHBOARD CRUD ENDPOINTS
// ============================================

// Create dashboard
router.post('/', authMiddleware.authenticate, validateMiddleware(createDashboardSchema), async (req, res) => {
  try {
    const { title, description, widgets = [], isPublic = false, tags = [] } = req.body;
    
    // Generate unique slug
    let slug = generateSlug(title);
    let counter = 1;
    let existingSlug = await Dashboard.findOne({ slug });
    
    while (existingSlug) {
      slug = `${generateSlug(title)}-${counter}`;
      existingSlug = await Dashboard.findOne({ slug });
      counter++;
    }

    const dashboard = new Dashboard({
      title,
      description,
      slug,
      createdBy: req.user.userId,
      widgets,
      isPublic,
      tags
    });

    await dashboard.save();
    await dashboard.populate('createdBy', 'email firstName lastName');

    logger.info(`Dashboard created: ${dashboard.title}`, {
      requestId: req.requestId,
      dashboardId: dashboard._id,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Dashboard created successfully',
      data: { dashboard }
    });
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard'
    });
  }
});

// Get all dashboards for user
router.get('/my-dashboards', authMiddleware.authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [dashboards, total] = await Promise.all([
      Dashboard.find({ createdBy: req.user.userId })
        .select('-widgets')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dashboard.countDocuments({ createdBy: req.user.userId })
    ]);

    res.json({
      success: true,
      data: {
        dashboards,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalDashboards: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user dashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboards'
    });
  }
});

// Get dashboard by ID
router.get('/:dashboardId', async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.dashboardId)
      .populate('createdBy', 'email firstName lastName');

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Check if user has access
    if (!dashboard.isPublic && req.user?.userId !== dashboard.createdBy._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment views
    dashboard.views += 1;
    await dashboard.save();

    res.json({
      success: true,
      data: { dashboard }
    });
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard'
    });
  }
});

// Get public dashboard by username and slug
router.get('/public/:username/:slug', async (req, res) => {
  try {
    const { username, slug } = req.params;

    const dashboard = await Dashboard.findOne({ slug, isPublic: true })
      .populate('createdBy', 'email firstName lastName');

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Increment views
    dashboard.views += 1;
    await dashboard.save();

    res.json({
      success: true,
      data: { dashboard }
    });
  } catch (error) {
    logger.error('Error fetching public dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard'
    });
  }
});

// Update dashboard
router.put('/:dashboardId', authMiddleware.authenticate, validateMiddleware(updateDashboardSchema), async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.dashboardId);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Check ownership
    if (dashboard.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this dashboard'
      });
    }

    const { title, description, widgets, isPublic, tags } = req.body;

    if (title) dashboard.title = title;
    if (description !== undefined) dashboard.description = description;
    if (widgets) dashboard.widgets = widgets;
    if (isPublic !== undefined) dashboard.isPublic = isPublic;
    if (tags) dashboard.tags = tags;
    dashboard.updatedAt = new Date();

    await dashboard.save();
    await dashboard.populate('createdBy', 'email firstName lastName');

    logger.info(`Dashboard updated: ${dashboard.title}`, {
      requestId: req.requestId,
      dashboardId: dashboard._id,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Dashboard updated successfully',
      data: { dashboard }
    });
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard'
    });
  }
});

// Delete dashboard
router.delete('/:dashboardId', authMiddleware.authenticate, async (req, res) => {
  try {
    const dashboard = await Dashboard.findById(req.params.dashboardId);

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Check ownership
    if (dashboard.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this dashboard'
      });
    }

    await Dashboard.findByIdAndDelete(req.params.dashboardId);

    logger.info(`Dashboard deleted: ${dashboard.title}`, {
      requestId: req.requestId,
      dashboardId: dashboard._id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dashboard'
    });
  }
});

// Duplicate dashboard
router.post('/:dashboardId/duplicate', authMiddleware.authenticate, async (req, res) => {
  try {
    const originalDashboard = await Dashboard.findById(req.params.dashboardId);

    if (!originalDashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Create new dashboard with copied data
    const newSlug = `${originalDashboard.slug}-copy-${Date.now()}`;
    const newDashboard = new Dashboard({
      title: `${originalDashboard.title} (Copy)`,
      description: originalDashboard.description,
      slug: newSlug,
      createdBy: req.user.userId,
      widgets: JSON.parse(JSON.stringify(originalDashboard.widgets)),
      isPublic: false,
      tags: originalDashboard.tags
    });

    await newDashboard.save();
    await newDashboard.populate('createdBy', 'email firstName lastName');

    logger.info(`Dashboard duplicated: ${newDashboard.title}`, {
      requestId: req.requestId,
      originalId: originalDashboard._id,
      newId: newDashboard._id,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Dashboard duplicated successfully',
      data: { dashboard: newDashboard }
    });
  } catch (error) {
    logger.error('Error duplicating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate dashboard'
    });
  }
});

// Search dashboards
router.get('/search', async (req, res) => {
  try {
    const { q, tags, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { isPublic: true };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const [dashboards, total] = await Promise.all([
      Dashboard.find(query)
        .select('-widgets')
        .populate('createdBy', 'email firstName lastName')
        .sort({ views: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dashboard.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        dashboards,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalDashboards: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error searching dashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search dashboards'
    });
  }
});

module.exports = { router, Dashboard };
