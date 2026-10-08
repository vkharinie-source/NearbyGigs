const Report = require('../models/Report');
const Gig = require('../models/Gig');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Submit a Report (Suspicious Gig / Fraudulent Employer / Safety Concern)
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details, targetTitle } = req.body;

    if (!targetType || !targetId || !reason || !details) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, reason, and details are required to submit a report.',
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      targetTitle: targetTitle || '',
      reason,
      details,
      status: 'pending',
    });

    // If reporting a gig, increment report count
    if (targetType === 'gig') {
      await Gig.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'REPORT_SUBMITTED',
      status: 'SUCCESS',
      req,
      resourceType: targetType,
      resourceId: targetId,
      metadata: { reason },
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted to platform safety review team. Thank you for keeping NearbyGigs safe.',
      report,
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting report.' });
  }
};

// @desc    Get user's submitted reports
// @route   GET /api/reports/my-reports
// @access  Private
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving reports.' });
  }
};

module.exports = {
  createReport,
  getMyReports,
};
