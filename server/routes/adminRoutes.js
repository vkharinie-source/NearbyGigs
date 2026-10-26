const express = require('express');
const router = express.Router();
const {
  getEmployers,
  updateEmployerStatus,
  getReports,
  updateReportStatus,
  getEmergencyAlerts,
  updateEmergencyAlertStatus,
  getAuditLogs,
  getDisputes,
  getDisputeDetails,
  requestDisputeInfo,
  resolveDispute,
  reopenDispute,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/employers', getEmployers);
router.put('/employers/:id/status', updateEmployerStatus);

router.get('/reports', getReports);
router.put('/reports/:id/status', updateReportStatus);

router.get('/sos-alerts', getEmergencyAlerts);
router.put('/sos-alerts/:id/status', updateEmergencyAlertStatus);

router.get('/audit-logs', getAuditLogs);

// Section 5: Dispute Resolution Dashboard
router.get('/disputes', getDisputes);
router.get('/disputes/:id', getDisputeDetails);
router.post('/disputes/:id/request-info', requestDisputeInfo);
router.post('/disputes/:id/resolve', resolveDispute);
router.post('/disputes/:id/reopen', reopenDispute);

module.exports = router;
