const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
