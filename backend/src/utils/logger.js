// Simple console logger
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  debug: (message, meta = {}) => console.log(`[DEBUG] ${message}`, meta),
  http: (message, meta = {}) => console.log(`[HTTP] ${message}`, meta),
  
  stream: {
    write: (message) => console.log(message.trim())
  },
  
  withRequestId: (requestId) => ({
    error: (message, meta = {}) => logger.error(message, { requestId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { requestId, ...meta }),
    info: (message, meta = {}) => logger.info(message, { requestId, ...meta }),
    http: (message, meta = {}) => logger.http(message, { requestId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { requestId, ...meta })
  })
};

module.exports = logger;