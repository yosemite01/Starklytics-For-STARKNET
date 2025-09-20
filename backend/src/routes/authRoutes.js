const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddlewares');
const validateMiddleware = require('../middlewares/validateMiddleware');
const rateLimiter = require('../utils/rateLimiter');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  googleAuthSchema,
  linkGoogleAccountSchema,
  unlinkGoogleAccountSchema
} = require('../validators/authValidator');

const router = express.Router();

// Public routes
router.post('/register', 
  rateLimiter.auth,
  validateMiddleware(registerSchema), 
  authController.register
);

router.post('/login', 
  rateLimiter.auth,
  validateMiddleware(loginSchema), 
  authController.login
);

router.post('/google', 
  rateLimiter.auth,
  validateMiddleware(googleAuthSchema), 
  authController.googleAuth
);

router.post('/refresh', 
  validateMiddleware(refreshTokenSchema), 
  authController.refreshToken
);

// Get Google OAuth configuration (for frontend)
router.get('/google/config', 
  authController.getGoogleConfig
);

// Protected routes
router.post('/logout', 
  authMiddleware.authenticate, 
  authController.logout
);

router.get('/profile', 
  authMiddleware.authenticate, 
  authController.getProfile
);

router.put('/profile', 
  authMiddleware.authenticate,
  validateMiddleware(updateProfileSchema), 
  authController.updateProfile
);

router.put('/change-password', 
  authMiddleware.authenticate,
  validateMiddleware(changePasswordSchema), 
  authController.changePassword
);

router.post('/link-google', 
  authMiddleware.authenticate,
  validateMiddleware(linkGoogleAccountSchema), 
  authController.linkGoogleAccount
);

router.post('/unlink-google', 
  authMiddleware.authenticate,
  validateMiddleware(unlinkGoogleAccountSchema), 
  authController.unlinkGoogleAccount
);

module.exports = router;