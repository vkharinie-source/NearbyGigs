const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createComplaint,
  getMyComplaints,
  getManagerComplaints,
  getComplaintById,
  acknowledgeComplaint,
  updateComplaintInvestigation,
  resolveComplaint,
  escalateComplaint,
  reopenComplaint,
  addEvidence,
} = require('../controllers/complaintController');

// All complaint endpoints are protected by authentication
router.post('/', protect, createComplaint);
router.get('/my-complaints', protect, getMyComplaints);
router.get('/manager-dashboard', protect, getManagerComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/acknowledge', protect, acknowledgeComplaint);
router.put('/:id/investigate', protect, updateComplaintInvestigation);
router.put('/:id/resolve', protect, resolveComplaint);
router.put('/:id/escalate', protect, escalateComplaint);
router.put('/:id/reopen', protect, reopenComplaint);
router.post('/:id/evidence', protect, addEvidence);

module.exports = router;
