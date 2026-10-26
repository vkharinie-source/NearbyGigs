const express = require('express');
const router = express.Router();
const {
  submitStudentVerification,
  requestGuardianOtp,
  verifyGuardianOtp,
  submitKycVerification,
  startWorkSession,
  endWorkSession,
  triggerEmergencySOS,
  getMySafetyStatus,
  submitCategoryDocuments,
  approveVerification,
} = require('../controllers/safetyController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, sosLimiter } = require('../middleware/rateLimiter');

router.get('/my-safety-status', protect, getMySafetyStatus);
router.post('/student-verify', protect, submitStudentVerification);
router.post('/guardian/request-otp', protect, otpLimiter, requestGuardianOtp);
router.post('/guardian/verify-otp', protect, otpLimiter, verifyGuardianOtp);
router.post('/kyc-verify', protect, submitKycVerification);
router.post('/documents', protect, submitCategoryDocuments);
router.post('/approve-verification', protect, approveVerification);
router.post('/work-session/start', protect, startWorkSession);
router.post('/work-session/end', protect, endWorkSession);
router.post('/sos', protect, sosLimiter, triggerEmergencySOS);

module.exports = router;
