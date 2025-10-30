const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');

class WebSocketRateLimiter {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      maxConnections: options.maxConnections || 100, // Max connections per IP
      maxMessages: options.maxMessages || 500, // Max messages per window
      ...options
    };

    this.connections = new Map(); // IP -> connection count
    this.messages = new Map(); // IP -> message count
    this.timeouts = new Map(); // IP -> timeout ref
  }

  // Clean up connection counts after window expires
  _scheduleCleanup(ip) {
    if (this.timeouts.has(ip)) {
      clearTimeout(this.timeouts.get(ip));
    }

    this.timeouts.set(ip, setTimeout(() => {
      this.connections.delete(ip);
      this.messages.delete(ip);
      this.timeouts.delete(ip);
    }, this.options.windowMs));
  }

  // Check if IP has exceeded limits
  _isLimited(ip) {
    const connections = this.connections.get(ip) || 0;
    const messages = this.messages.get(ip) || 0;

    return connections >= this.options.maxConnections || 
           messages >= this.options.maxMessages;
  }

  // Handle new connection
  handleConnection(ws, req) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const currentConnections = this.connections.get(ip) || 0;
    this.connections.set(ip, currentConnections + 1);

    if (!this.messages.has(ip)) {
      this.messages.set(ip, 0);
    }

    this._scheduleCleanup(ip);

    // Handle messages
    ws.on('message', () => {
      if (this._isLimited(ip)) {
        ws.close(1008, 'Rate limit exceeded');
        return;
      }

      const messageCount = this.messages.get(ip) || 0;
      this.messages.set(ip, messageCount + 1);
    });

    // Clean up on connection close
    ws.on('close', () => {
      const count = this.connections.get(ip);
      if (count > 0) {
        this.connections.set(ip, count - 1);
      }
    });

    // Close connection if limit exceeded
    if (this._isLimited(ip)) {
      ws.close(1008, 'Rate limit exceeded');
      return false;
    }

    return true;
  }
}

module.exports = WebSocketRateLimiter;