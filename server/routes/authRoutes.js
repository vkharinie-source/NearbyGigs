const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  choosePurpose,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected Auth Routes
router.get('/me', protect, getMe);
router.put('/choose-purpose', protect, choosePurpose);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logoutUser);

module.exports = router;
