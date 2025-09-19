const { ZodError } = require('zod');
const logger = require('../utils/logger');

const validateMiddleware = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      // Get data to validate based on property
      let dataToValidate;
      switch (property) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      // Validate data
      const validatedData = schema.parse(dataToValidate);
      
      // Replace original data with validated data
      req[property] = validatedData;
      
      logger.debug('Validation successful', {
        requestId: req.requestId,
        property,
        path: req.path
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          requestId: req.requestId,
          property,
          path: req.path,
          errors: error.errors
        });

        // Format validation errors for user-friendly response
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Handle unexpected errors
      logger.error('Unexpected validation error', {
        requestId: req.requestId,
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation'
      });
    }
  };
};

module.exports = validateMiddleware;