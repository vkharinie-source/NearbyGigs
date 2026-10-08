const express = require('express');
const router = express.Router();
const { getMyEarnings } = require('../controllers/earningController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyEarnings);

module.exports = router;
