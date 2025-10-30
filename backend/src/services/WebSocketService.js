const WebSocket = require('ws');
const logger = require('../utils/logger');
const Bounty = require('../models/Bounty');
const BountyParticipant = require('../models/BountyParticipant');
const Reward = require('../models/Reward');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.setupWebSocket();
    this.statsUpdateInterval = null;
  }

  setupWebSocket() {
    const WebSocketRateLimiter = require('../middlewares/WebSocketRateLimiter');
    const rateLimiter = new WebSocketRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxConnections: 50, // Max 50 connections per IP
      maxMessages: 300 // Max 300 messages per window
    });

    this.wss.on('connection', (ws, req) => {
      if (!rateLimiter.handleConnection(ws, req)) {
        return;
      }

      this.clients.add(ws);
      logger.info('New WebSocket client connected');

      // Send initial stats
      this.sendStatsToClient(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    // Start periodic stats updates if not already running
    if (!this.statsUpdateInterval) {
      this.statsUpdateInterval = setInterval(() => {
        this.broadcastStats();
      }, 5000); // Update every 5 seconds
    }
  }

  async getStats() {
    try {
      // Get active bounties count
      const activeBountiesCount = await Bounty.countDocuments({ status: 'active' });

      // Get total rewards in STRK
      const totalRewardsSTRK = await Reward.aggregate([
        { $match: { status: 'paid', currency: 'STRK' } },
        { $group: { _id: null, total: { $sum: '$amountSTRK' } } }
      ]).then(result => (result[0]?.total || 0));

      // Get active participants count
      const activeParticipantsCount = await BountyParticipant.countDocuments({
        status: { $in: ['joined', 'submitted'] },
        isActive: true
      });

      // Get completed bounties this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const completedThisMonth = await Bounty.countDocuments({
        status: 'completed',
        completedAt: { $gte: startOfMonth }
      });

      return {
        activeBountiesCount,
        totalRewardsSTRK,
        activeParticipantsCount,
        completedThisMonth
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return null;
    }
  }

  async sendStatsToClient(ws) {
    const stats = await this.getStats();
    if (stats && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'stats',
        data: stats
      }));
    }
  }

  async broadcastStats() {
    const stats = await this.getStats();
    if (stats) {
      this.broadcast({
        type: 'stats',
        data: stats
      });
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  notifyBountyUpdate(bountyId) {
    this.broadcastStats();
  }

  // Clean up resources
  cleanup() {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
  }
}

module.exports = WebSocketService;