const User = require('../models/User');
const Gig = require('../models/Gig');
const Report = require('../models/Report');
const EmergencyAlert = require('../models/EmergencyAlert');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Get Employers for Verification Review
// @route   GET /api/admin/employers
// @access  Private (Admin only)
const getEmployers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: { $in: ['employer', 'customer', 'both'] } };
    if (status) filter.employerStatus = status;

    const employers = await User.find(filter)
      .select('name email phone role companyName companyRegistration employerStatus employerVerifiedAt createdAt')
      .sort('-createdAt');

    res.json({ success: true, count: employers.length, employers });
  } catch (error) {
    console.error('Admin get employers error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving employers.' });
  }
};

// @desc    Update Employer Verification Status (VERIFIED, REJECTED, SUSPENDED)
// @route   PUT /api/admin/employers/:id/status
// @access  Private (Admin only)
const updateEmployerStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid employer status.' });
    }

    const employer = await User.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    employer.employerStatus = status;
    if (status === 'VERIFIED') {
      employer.employerVerifiedAt = new Date();
    }
    await employer.save();

    await Notification.create({
      recipient: employer._id,
      type: 'system',
      title: `🏢 Employer Status Update: ${status}`,
      message:
        status === 'VERIFIED'
          ? 'Congratulations! Your employer profile has been approved and granted the "Verified Employer" trust badge.'
          : `Your employer status has been updated to: ${status}. ${adminNotes ? 'Reason: ' + adminNotes : ''}`,
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_UPDATE_EMPLOYER_STATUS',
      status: 'SUCCESS',
      req,
      resourceType: 'User',
      resourceId: employer._id,
      metadata: { newStatus: status, adminNotes },
    });

    res.json({ success: true, message: `Employer status updated to ${status}`, employer });
  } catch (error) {
    console.error('Update employer status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating employer status.' });
  }
};

// @desc    Get Platform Reports (Suspicious gigs/users)
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email phone')
      .populate('resolvedBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving reports.' });
  }
};

// @desc    Resolve / Dismiss Report
// @route   PUT /api/admin/reports/:id/status
// @access  Private (Admin only)
const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes, actionTaken } = req.body;
    if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    report.adminNotes = adminNotes || report.adminNotes;
    report.actionTaken = actionTaken || report.actionTaken;
    report.resolvedBy = req.user._id;
    await report.save();

    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_RESOLVE_REPORT',
      status: 'SUCCESS',
      req,
      resourceType: 'Report',
      resourceId: report._id,
      metadata: { newStatus: status, actionTaken },
    });

    res.json({ success: true, message: `Report marked as ${status}`, report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Server error updating report.' });
  }
};

// @desc    Get Emergency SOS Incidents
// @route   GET /api/admin/sos-alerts
// @access  Private (Admin only)
const getEmergencyAlerts = async (req, res) => {
  try {
    const alerts = await EmergencyAlert.find()
      .populate('user', 'name email phone role guardian')
      .populate('activeGig', 'title address budgetMin budgetMax')
      .sort('-createdAt');

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error('Admin get SOS error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving SOS alerts.' });
  }
};

// @desc    Update SOS Alert Status (RESPONDED / RESOLVED)
// @route   PUT /api/admin/sos-alerts/:id/status
// @access  Private (Admin only)
const updateEmergencyAlertStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const alert = await EmergencyAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.status = status;
    if (notes) alert.notes = notes;
    if (status === 'RESOLVED') {
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user._id;
    }
    await alert.save();

    await logAuditEvent({
      user: req.user._id,
      action: 'ADMIN_UPDATE_SOS_STATUS',
      status: 'SUCCESS',
      req,
      resourceType: 'EmergencyAlert',
      resourceId: alert._id,
      metadata: { status, notes },
    });

    res.json({ success: true, message: `Emergency alert status set to ${status}`, alert });
  } catch (error) {
    console.error('Update SOS error:', error);
    res.status(500).json({ success: false, message: 'Server error updating SOS alert.' });
  }
};

// @desc    Get System Audit Logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort('-createdAt')
      .limit(Number(limit) || 100);

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving audit logs.' });
  }
};

module.exports = {
  getEmployers,
  updateEmployerStatus,
  getReports,
  updateReportStatus,
  getEmergencyAlerts,
  updateEmergencyAlertStatus,
  getAuditLogs,
};
