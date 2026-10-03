const express = require('express');
const router = express.Router();
const {
  createServiceRequest,
  getServiceRequests,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createServiceRequest);
router.get('/', protect, getServiceRequests);
router.put('/:id/status', protect, updateRequestStatus);

module.exports = router;
