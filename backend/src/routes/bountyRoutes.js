const express = require('express');
const bountyController = require('../controllers/bountyController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const { 
  createBountySchema, 
  updateBountySchema,
  bountyParamsSchema,
  submitToBountySchema,
  bountyQuerySchema
} = require('../validators/bountyValidator');

const router = express.Router();

// Public routes
router.get('/', 
  validateMiddleware(bountyQuerySchema, 'query'), 
  bountyController.getBounties
);

router.get('/search', 
  bountyController.searchBounties
);

router.get('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'), 
  bountyController.getBountyById
);

// Protected routes - require authentication
router.use(authMiddleware.authenticate);

// Routes for all authenticated users
router.get('/user/my-bounties', 
  bountyController.getMyBounties
);

router.post('/:id/submit', 
  validateMiddleware(bountyParamsSchema, 'params'),
  validateMiddleware(submitToBountySchema), 
  bountyController.submitToBounty
);

// Routes that require creator or admin role
router.post('/', 
  authMiddleware.requireRole(['creator', 'admin']),
  validateMiddleware(createBountySchema), 
  bountyController.createBounty
);

router.put('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'),
  validateMiddleware(updateBountySchema), 
  bountyController.updateBounty
);

router.delete('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'), 
  bountyController.deleteBounty
);

// Admin-only routes
router.get('/admin/stats', 
  authMiddleware.requireRole(['admin']), 
  bountyController.getBountyStats
);

module.exports = router;