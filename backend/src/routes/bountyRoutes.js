const express = require('express');
const bountyController = require('../controllers/bountyController');
const authMiddleware = require('../middlewares/authMiddlewares');
const validateMiddleware = require('../middlewares/validateMiddleware');
const { 
  createBountySchema, 
  updateBountySchema,
  bountyParamsSchema,
  submitToBountySchema,
  bountyQuerySchema
} = require('../validators/bountyValidator');

const router = express.Router();

/* ------------------------
   Public Routes
------------------------- */

// Get list of bounties (with optional query params)
router.get('/', 
  validateMiddleware(bountyQuerySchema, 'query'), 
  bountyController.getBounties
);

// Search bounties
router.get('/search', bountyController.searchBounties);

/* ------------------------
   Protected Routes - Require Authentication
------------------------- */
router.use(authMiddleware.authenticate);

// Authenticated user routes
router.get('/user/my-bounties', bountyController.getMyBounties);

// Submit to a bounty
router.post('/:id/submit', 
  validateMiddleware(bountyParamsSchema, 'params'),
  validateMiddleware(submitToBountySchema), 
  bountyController.submitToBounty
);

/* ------------------------
   Creator/Admin Routes
------------------------- */

// Create bounty (creator or admin)
router.post('/', 
  authMiddleware.requireRole(['creator', 'admin']),
  validateMiddleware(createBountySchema), 
  bountyController.createBounty
);

// Update bounty (creator or admin)
router.put('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'),
  validateMiddleware(updateBountySchema), 
  bountyController.updateBounty
);

// Delete bounty (creator or admin)
router.delete('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'), 
  bountyController.deleteBounty
);

/* ------------------------
   Admin-Only Routes
------------------------- */

// Admin stats
router.get('/admin/stats', 
  authMiddleware.requireRole(['admin']), 
  bountyController.getBountyStats
);

/* ------------------------
   Dynamic Param Routes
   (Last to avoid route conflicts)
------------------------- */

// Get bounty by ID
router.get('/:id', 
  validateMiddleware(bountyParamsSchema, 'params'), 
  bountyController.getBountyById
);

module.exports = router;
