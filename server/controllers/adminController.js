const User = require('../models/User');
const Gig = require('../models/Gig');
const Report = require('../models/Report');
const EmergencyAlert = require('../models/EmergencyAlert');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const Application = require('../models/Application');
const Earning = require('../models/Earning');
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

// =========================================================================
// SECTION 5: DISPUTE RESOLUTION & ADMIN ARBITRATION
// =========================================================================

// @desc    Get all disputes with filtering (status, category, urgency, search)
// @route   GET /api/admin/disputes
// @access  Private (Admin only)
const getDisputes = async (req, res) => {
  try {
    const { status, urgency, category, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (urgency && urgency !== 'all') {
      filter.urgency = urgency;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const disputes = await Complaint.find(filter)
      .populate('gig', 'title category budgetMin budgetMax location duration scheduledDate status')
      .populate('complainant', 'name email phone role verified badge profileImage')
      .populate('reportedParty', 'name email phone role verified badge profileImage rating')
      .populate('application')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .sort('-createdAt');

    // Aggregate stats
    const stats = {
      total: await Complaint.countDocuments(),
      open: await Complaint.countDocuments({ status: { $in: ['submitted', 'assigned', 'under_investigation'] } }),
      awaitingInfo: await Complaint.countDocuments({ status: 'awaiting_information' }),
      resolved: await Complaint.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      escalated: await Complaint.countDocuments({ status: 'escalated' }),
      reopened: await Complaint.countDocuments({ status: 'reopened' }),
    };

    res.json({ success: true, count: disputes.length, stats, disputes });
  } catch (error) {
    console.error('Admin get disputes error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving disputes.' });
  }
};

// @desc    Get full dossier for a dispute
// @route   GET /api/admin/disputes/:id
// @access  Private (Admin only)
const getDisputeDetails = async (req, res) => {
  try {
    const dispute = await Complaint.findById(req.params.id)
      .populate('gig')
      .populate('complainant', 'name email phone role profileImage rating verified badge createdAt')
      .populate('reportedParty', 'name email phone role profileImage rating verified badge createdAt')
      .populate({
        path: 'application',
        populate: [
          { path: 'applicant', select: 'name email phone profileImage rating verified badge' },
          { path: 'gig' },
          { path: 'workCompletion.reviewedBy', select: 'name email' },
        ],
      })
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('investigationNotes.author', 'name email');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    res.json({ success: true, dispute });
  } catch (error) {
    console.error('Admin get dispute details error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving dispute details.' });
  }
};

// @desc    Admin requests additional information or evidence from party/parties
// @route   POST /api/admin/disputes/:id/request-info
// @access  Private (Admin only)
const requestDisputeInfo = async (req, res) => {
  try {
    const targetParty = req.body.targetParty || 'worker';
    const instructions = (req.body.instructions || req.body.note || req.body.message || '').trim();

    if (!instructions) {
      return res.status(400).json({ success: false, message: 'Please specify the information or evidence requested.' });
    }

    const dispute = await Complaint.findById(req.params.id)
      .populate('complainant')
      .populate('reportedParty')
      .populate('gig');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    dispute.status = 'awaiting_information';
    if (!dispute.adminActions) dispute.adminActions = [];
    dispute.adminActions.push({
      actionType: 'info_requested',
      notes: `Requested additional information from [${targetParty.toUpperCase()}]: ${instructions}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedAt: new Date(),
    });

    dispute.statusHistory.push({
      status: 'awaiting_information',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: `Admin requested information from ${targetParty}: ${instructions}`,
      timestamp: new Date(),
    });

    await dispute.save();

    // Notify parties
    const notifyWorker = targetParty === 'worker' || targetParty === 'both';
    const notifyEmployer = targetParty === 'employer' || targetParty === 'both';

    const workerUser = dispute.complainantRole === 'worker' ? dispute.complainant : dispute.reportedParty;
    const employerUser = dispute.complainantRole === 'employer' ? dispute.complainant : dispute.reportedParty;

    if (notifyWorker && workerUser) {
      await Notification.create({
        recipient: workerUser._id,
        sender: req.user._id,
        type: 'dispute_info_requested',
        title: `📑 Additional Evidence Requested: ${dispute.complaintId}`,
        message: `Admin requested more details regarding "${dispute.gig?.title || 'your job'}": "${instructions}"`,
        link: '/my-applications',
      });
    }

    if (notifyEmployer && employerUser) {
      await Notification.create({
        recipient: employerUser._id,
        sender: req.user._id,
        type: 'dispute_info_requested',
        title: `📑 Additional Information Requested: ${dispute.complaintId}`,
        message: `Admin requested more information on dispute ${dispute.complaintId}: "${instructions}"`,
        link: '/applications/received',
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'DISPUTE_INFO_REQUESTED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: dispute._id,
      metadata: { targetParty, instructions },
    });

    res.json({ success: true, message: 'Information request dispatched to parties.', dispute });
  } catch (error) {
    console.error('Admin request dispute info error:', error);
    res.status(500).json({ success: false, message: 'Server error sending request.' });
  }
};

// @desc    Admin finalizes a reasoned dispute resolution
// @route   POST /api/admin/disputes/:id/resolve
// @access  Private (Admin only)
const resolveDispute = async (req, res) => {
  try {
    const rawDecision = req.body.resolutionDecision || req.body.resolutionOutcome || req.body.decision;
    const rawReason = (req.body.reason || req.body.reasonedResolution || req.body.notes || '').trim();
    const correctiveAction = req.body.correctiveAction || req.body.remediationPlan || rawDecision;

    const decisionMap = {
      release_worker: 'approve_completion',
      approve: 'approve_completion',
      approve_completion: 'approve_completion',
      order_correction: 'order_correction',
      request_correction: 'order_correction',
      refund_employer: 'refund_employer',
      refund: 'refund_employer',
      mutual_settlement: 'mutual_settlement',
    };
    const resolutionDecision = decisionMap[rawDecision] || rawDecision;
    const reason = rawReason;

    if (!resolutionDecision) {
      return res.status(400).json({ success: false, message: 'Please select a resolution decision.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a documented rationale for this decision.' });
    }

    const dispute = await Complaint.findById(req.params.id)
      .populate('complainant')
      .populate('reportedParty')
      .populate('gig');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    dispute.status = 'resolved';
    dispute.resolutionSummary = reason.trim();
    dispute.correctiveAction = correctiveAction || resolutionDecision;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();

    if (!dispute.adminActions) dispute.adminActions = [];
    dispute.adminActions.push({
      actionType: 'resolution_approved',
      notes: `Decision: [${resolutionDecision}]. Rationale: ${reason.trim()}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedAt: new Date(),
    });

    dispute.statusHistory.push({
      status: 'resolved',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: `Case resolved by Admin. Decision: ${resolutionDecision}`,
      timestamp: new Date(),
    });

    await dispute.save();

    // Now update associated Application if exists
    if (dispute.application) {
      const application = await Application.findById(dispute.application);
      if (application) {
        if (!application.workCompletion.disputeDetails) {
          application.workCompletion.disputeDetails = {};
        }
        application.workCompletion.disputeDetails.resolutionStatus = 'resolved';
        application.workCompletion.disputeDetails.resolutionDecision = reason.trim();
        application.workCompletion.disputeDetails.resolvedBy = req.user._id;
        application.workCompletion.disputeDetails.resolvedAt = new Date();

        // Apply corresponding status depending on decision
        if (resolutionDecision === 'approve_completion' || resolutionDecision === 'mutual_settlement') {
          application.workCompletion.status = 'completed_confirmed';
          application.status = 'completed';
          application.payment.status = 'paid';
          application.payment.paidAt = new Date();
          if (!application.payment.history) application.payment.history = [];
          application.payment.history.push({
            status: 'paid',
            amount: application.payment.amount,
            note: `Dispute resolved in favor of completion. Payment released by Admin.`,
            recordedBy: req.user._id,
            timestamp: new Date(),
          });
          if (application.payment.earningRecord) {
            await Earning.findByIdAndUpdate(application.payment.earningRecord, {
              payoutStatus: 'paid',
              paymentDate: new Date(),
              escrowReleasedAt: new Date(),
            });
          }
          await Gig.findByIdAndUpdate(application.gig, { status: 'completed' });
        } else if (resolutionDecision === 'order_correction') {
          application.workCompletion.status = 'correction_requested';
          if (!application.workCompletion.correctionHistory) application.workCompletion.correctionHistory = [];
          application.workCompletion.correctionHistory.push({
            reason: `Admin Order: ${reason.trim()}`,
            notes: correctiveAction || 'Admin directed worker to correct specified deficiencies.',
            evidence: [],
            requestedAt: new Date(),
            requestedBy: req.user._id,
            status: 'open',
          });
          application.workCompletion.twoWayConfirmation = application.workCompletion.twoWayConfirmation || {};
          application.workCompletion.twoWayConfirmation.workerConfirmed = false;
        } else if (resolutionDecision === 'refund_employer') {
          application.workCompletion.status = 'cancelled';
          application.status = 'cancelled';
          application.payment.status = 'refund_pending';
          if (!application.payment.history) application.payment.history = [];
          application.payment.history.push({
            status: 'refund_pending',
            amount: application.payment.amount,
            note: `Dispute resolved: Employer refund pending. Reason: ${reason.trim()}`,
            recordedBy: req.user._id,
            timestamp: new Date(),
          });
          await Gig.findByIdAndUpdate(application.gig, { status: 'open', assignedTo: null });
        }

        await application.save();
      }
    }

    // Notify both parties of resolution
    const workerUser = dispute.complainantRole === 'worker' ? dispute.complainant : dispute.reportedParty;
    const employerUser = dispute.complainantRole === 'employer' ? dispute.complainant : dispute.reportedParty;

    const notifMsg = `Dispute ${dispute.complaintId} has been resolved by Admin. Decision: "${resolutionDecision.replace(/_/g, ' ')}". Details: ${reason.trim()}`;

    if (workerUser) {
      await Notification.create({
        recipient: workerUser._id,
        sender: req.user._id,
        type: 'dispute_resolved',
        title: `⚖️ Dispute Resolved: ${dispute.complaintId}`,
        message: notifMsg,
        link: '/my-applications',
      });
    }

    if (employerUser) {
      await Notification.create({
        recipient: employerUser._id,
        sender: req.user._id,
        type: 'dispute_resolved',
        title: `⚖️ Dispute Resolved: ${dispute.complaintId}`,
        message: notifMsg,
        link: '/applications/received',
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'DISPUTE_RESOLVED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: dispute._id,
      metadata: { resolutionDecision, reason, correctiveAction },
    });

    res.json({ success: true, message: 'Dispute successfully resolved.', dispute });
  } catch (error) {
    console.error('Admin resolve dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error recording resolution.' });
  }
};

// @desc    Admin reopens a dispute with documented reason
// @route   POST /api/admin/disputes/:id/reopen
// @access  Private (Admin only)
const reopenDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a justification for reopening this case.' });
    }

    const dispute = await Complaint.findById(req.params.id)
      .populate('complainant')
      .populate('reportedParty')
      .populate('gig');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    dispute.status = 'reopened';
    dispute.reopenReason = reason.trim();
    if (!dispute.adminActions) dispute.adminActions = [];
    dispute.adminActions.push({
      actionType: 'case_reopened',
      notes: `Case reopened: ${reason.trim()}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedAt: new Date(),
    });

    dispute.statusHistory.push({
      status: 'reopened',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: `Case reopened by Admin. Justification: ${reason.trim()}`,
      timestamp: new Date(),
    });

    await dispute.save();

    // If application exists, update dispute resolutionStatus to 'reopened'
    if (dispute.application) {
      await Application.findByIdAndUpdate(dispute.application, {
        'workCompletion.status': 'dispute_under_review',
        'workCompletion.disputeDetails.resolutionStatus': 'reopened',
      });
    }

    // Notify parties
    const workerUser = dispute.complainantRole === 'worker' ? dispute.complainant : dispute.reportedParty;
    const employerUser = dispute.complainantRole === 'employer' ? dispute.complainant : dispute.reportedParty;

    const notifMsg = `Case ${dispute.complaintId} has been reopened for further investigation. Reason: ${reason.trim()}`;

    if (workerUser) {
      await Notification.create({
        recipient: workerUser._id,
        sender: req.user._id,
        type: 'complaint_reopened',
        title: `🔄 Dispute Case Reopened: ${dispute.complaintId}`,
        message: notifMsg,
        link: '/my-applications',
      });
    }

    if (employerUser) {
      await Notification.create({
        recipient: employerUser._id,
        sender: req.user._id,
        type: 'complaint_reopened',
        title: `🔄 Dispute Case Reopened: ${dispute.complaintId}`,
        message: notifMsg,
        link: '/applications/received',
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'DISPUTE_REOPENED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: dispute._id,
      metadata: { reason },
    });

    res.json({ success: true, message: 'Case successfully reopened.', dispute });
  } catch (error) {
    console.error('Admin reopen dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error reopening dispute.' });
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
  getDisputes,
  getDisputeDetails,
  requestDisputeInfo,
  resolveDispute,
  reopenDispute,
};
