const express = require('express');
const router = express.Router();
const { updateLocation } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.put('/update', protect, updateLocation);

module.exports = router;
