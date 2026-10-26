const express = require('express');
const router = express.Router();
const {
  applyForGig,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  respondToCommitment,
  generateAttendanceCode,
  verifyAttendance,
  recordCheckOut,
  disputeAttendance,
  submitWorkCompletion,
  reviewWorkCompletion,
  acknowledgeOrConcern,
  getApplicationCompletionDetails,
  cancelAssignment,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, applyForGig);
router.get('/my-applications', protect, getMyApplications);
router.get('/received', protect, getReceivedApplications);
router.put('/:id/status', protect, updateApplicationStatus);

// 7A: Commitment Confirmation
router.post('/:id/commit', protect, respondToCommitment);

// 7A: Attendance Proof
router.post('/:id/attendance/generate-code', protect, generateAttendanceCode);
router.post('/:id/attendance/verify', protect, verifyAttendance);
router.post('/:id/attendance/checkout', protect, recordCheckOut);
router.post('/:id/attendance/dispute', protect, disputeAttendance);

// 7A: Work Completion Proof, Two-Way Review & Dossier
router.get('/:id/completion-details', protect, getApplicationCompletionDetails);
router.post('/:id/completion/submit', protect, submitWorkCompletion);
router.post('/:id/completion/review', protect, reviewWorkCompletion);
router.post('/:id/completion/concern', protect, acknowledgeOrConcern);

// 7A: Cancellation Handling
router.post('/:id/cancel', protect, cancelAssignment);

module.exports = router;
