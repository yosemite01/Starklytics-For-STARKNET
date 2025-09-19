const express = require('express');
const authController = require('../controllers/authcontroller');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/authValidator');

const router = express.Router();

// Public routes
router.post('/register', 
  validateMiddleware(registerSchema), 
  authController.register
);

router.post('/login', 
  validateMiddleware(loginSchema), 
  authController.login
);

router.post('/refresh', 
  validateMiddleware(refreshTokenSchema), 
  authController.refreshToken
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

module.exports = router;