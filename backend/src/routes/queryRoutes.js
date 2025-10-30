const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddlewares');
const validateMiddleware = require('../middlewares/validateMiddleware');
const { z } = require('zod');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const axios = require('axios');

// Query Schema
const querySchema = new mongoose.Schema({
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
  sql: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  lastExecuted: Date,
  executionCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Query = mongoose.model('Query', querySchema);

// Validation schemas
const createQuerySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sql: z.string().min(1),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const executeQuerySchema = z.object({
  sql: z.string().min(1),
  limit: z.number().optional().default(100)
});

// ============================================
// QUERY EXECUTION ENDPOINTS
// ============================================

// Execute query (real-time)
router.post('/execute', authMiddleware.authenticate, validateMiddleware(executeQuerySchema), async (req, res) => {
  try {
    const { sql, limit = 100 } = req.body;

    // Validate SQL query (basic security check)
    const sqlLower = sql.toLowerCase();
    
    // Prevent dangerous operations
    if (sqlLower.includes('drop') || sqlLower.includes('delete') || sqlLower.includes('update') || sqlLower.includes('insert')) {
      return res.status(400).json({
        success: false,
        message: 'Only SELECT queries are allowed'
      });
    }

    // Parse query to extract table/contract info
    const selectMatch = sql.match(/from\s+(\w+)/i);
    if (!selectMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query format'
      });
    }

    const tableName = selectMatch[1];

    // Execute query based on table type
    let results = [];

    if (tableName.toLowerCase() === 'bounties') {
      // Query bounties from database
      const Bounty = require('../models/Bounty');
      results = await Bounty.find()
        .populate('createdBy', 'email firstName lastName')
        .limit(limit);
    } else if (tableName.toLowerCase() === 'users') {
      // Query users from database
      const User = require('../models/User');
      results = await User.find()
        .select('-password -refreshToken')
        .limit(limit);
    } else if (tableName.toLowerCase() === 'transactions' || tableName.toLowerCase() === 'blocks') {
      // Query blockchain data from Starknet RPC
      results = await queryStarknetData(tableName, limit);
    } else {
      return res.status(400).json({
        success: false,
        message: `Table '${tableName}' not found`
      });
    }

    logger.info(`Query executed: ${tableName}`, {
      requestId: req.requestId,
      userId: req.user.userId,
      resultCount: results.length
    });

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        query: sql
      }
    });
  } catch (error) {
    logger.error('Error executing query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute query',
      error: error.message
    });
  }
});

// Helper function to query Starknet data
async function queryStarknetData(tableName, limit) {
  try {
    const rpcUrl = process.env.VITE_STARKNET_RPC_URL || 'https://starknet-mainnet.public.blastapi.io';
    
    if (tableName.toLowerCase() === 'blocks') {
      // Get recent blocks
      const blockNumber = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'starknet_blockNumber',
        params: [],
        id: 1
      });

      const blocks = [];
      const currentBlock = blockNumber.data.result;

      for (let i = 0; i < Math.min(limit, 10); i++) {
        try {
          const block = await axios.post(rpcUrl, {
            jsonrpc: '2.0',
            method: 'starknet_getBlockWithTxs',
            params: [{ block_number: currentBlock - i }],
            id: i + 2
          });

          if (block.data.result) {
            blocks.push({
              block_number: block.data.result.block_number,
              timestamp: block.data.result.timestamp,
              transaction_count: block.data.result.transactions?.length || 0
            });
          }
        } catch (err) {
          logger.warn(`Failed to fetch block ${currentBlock - i}:`, err.message);
        }
      }

      return blocks;
    }

    return [];
  } catch (error) {
    logger.error('Error querying Starknet data:', error);
    return [];
  }
}

// ============================================
// SAVED QUERIES ENDPOINTS
// ============================================

// Create saved query
router.post('/', authMiddleware.authenticate, validateMiddleware(createQuerySchema), async (req, res) => {
  try {
    const { title, description, sql, isPublic = false, tags = [] } = req.body;

    const query = new Query({
      title,
      description,
      sql,
      createdBy: req.user.userId,
      isPublic,
      tags
    });

    await query.save();
    await query.populate('createdBy', 'email firstName lastName');

    logger.info(`Query saved: ${query.title}`, {
      requestId: req.requestId,
      queryId: query._id,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Query saved successfully',
      data: { query }
    });
  } catch (error) {
    logger.error('Error saving query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save query'
    });
  }
});

// Get all saved queries for user
router.get('/my-queries', authMiddleware.authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [queries, total] = await Promise.all([
      Query.find({ createdBy: req.user.userId })
        .select('-sql')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Query.countDocuments({ createdBy: req.user.userId })
    ]);

    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalQueries: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching user queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queries'
    });
  }
});

// Get query by ID
router.get('/:queryId', async (req, res) => {
  try {
    const query = await Query.findById(req.params.queryId)
      .populate('createdBy', 'email firstName lastName');

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    // Check if user has access
    if (!query.isPublic && req.user?.userId !== query.createdBy._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { query }
    });
  } catch (error) {
    logger.error('Error fetching query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch query'
    });
  }
});

// Update query
router.put('/:queryId', authMiddleware.authenticate, validateMiddleware(createQuerySchema), async (req, res) => {
  try {
    const query = await Query.findById(req.params.queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    // Check ownership
    if (query.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this query'
      });
    }

    const { title, description, sql, isPublic, tags } = req.body;

    if (title) query.title = title;
    if (description !== undefined) query.description = description;
    if (sql) query.sql = sql;
    if (isPublic !== undefined) query.isPublic = isPublic;
    if (tags) query.tags = tags;
    query.updatedAt = new Date();

    await query.save();
    await query.populate('createdBy', 'email firstName lastName');

    logger.info(`Query updated: ${query.title}`, {
      requestId: req.requestId,
      queryId: query._id,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Query updated successfully',
      data: { query }
    });
  } catch (error) {
    logger.error('Error updating query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update query'
    });
  }
});

// Delete query
router.delete('/:queryId', authMiddleware.authenticate, async (req, res) => {
  try {
    const query = await Query.findById(req.params.queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    // Check ownership
    if (query.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this query'
      });
    }

    await Query.findByIdAndDelete(req.params.queryId);

    logger.info(`Query deleted: ${query.title}`, {
      requestId: req.requestId,
      queryId: query._id,
      deletedBy: req.user.userId
    });

    res.json({
      success: true,
      message: 'Query deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete query'
    });
  }
});

// Search public queries
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

    const [queries, total] = await Promise.all([
      Query.find(query)
        .select('-sql')
        .populate('createdBy', 'email firstName lastName')
        .sort({ executionCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Query.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalQueries: total,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error searching queries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search queries'
    });
  }
});

module.exports = { router, Query };
