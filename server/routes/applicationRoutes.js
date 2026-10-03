const express = require('express');
const router = express.Router();
const {
  applyForGig,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, applyForGig);
router.get('/my-applications', protect, getMyApplications);
router.get('/received', protect, getReceivedApplications);
router.put('/:id/status', protect, updateApplicationStatus);

module.exports = router;
