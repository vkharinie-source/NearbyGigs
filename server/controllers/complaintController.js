const Complaint = require('../models/Complaint');
const Gig = require('../models/Gig');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { calculateSLADeadlines } = require('../utils/slaCalculator');
const { logAuditEvent } = require('../utils/auditLogger');

// Helper to generate unique reference number: CMP-YYYY-XXXXX
const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${year}-${String(count + 1).padStart(4, '0')}${randomSuffix}`;
};

// @desc    Raise a new complaint
// @route   POST /api/complaints
// @access  Private (Customer or Worker)
const createComplaint = async (req, res, next) => {
  try {
    const {
      gigId,
      applicationId,
      category,
      title,
      description,
      incidentDate,
      evidence,
      desiredResolution,
      desiredResolutionNotes,
      urgency = 'medium',
      reportedPartyId,
    } = req.body;

    const effectiveGigId = gigId || req.body.relatedGig;
    const effectiveAppId = applicationId || req.body.relatedAssignment;
    const effectiveReportedParty = reportedPartyId || req.body.reportedUser;
    const effectiveTitle = title || req.body.title || `${(category || 'General').replace(/_/g, ' ')} Issue`;

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category and detailed description are required to raise a complaint.',
      });
    }

    let gig = null;
    if (effectiveGigId) {
      gig = await Gig.findById(effectiveGigId).populate('postedBy', 'name email role');
    }

    // Determine complainant role and reported party
    const isGigOwner = gig && gig.postedBy && gig.postedBy._id.toString() === req.user._id.toString();
    const complainantRole = isGigOwner ? 'employer' : req.user.role === 'customer' ? 'customer' : 'worker';

    let finalReportedParty = effectiveReportedParty;
    if (!finalReportedParty && gig) {
      if (isGigOwner) {
        if (!gig.assignedTo) {
          if (effectiveAppId) {
            const app = await Application.findById(effectiveAppId);
            finalReportedParty = app?.applicant;
          }
        } else {
          finalReportedParty = gig.assignedTo;
        }
      } else if (gig.postedBy) {
        finalReportedParty = gig.postedBy._id;
      }
    }

    if (!finalReportedParty) {
      const anyOtherUser = await User.findOne({ _id: { $ne: req.user._id } });
      finalReportedParty = anyOtherUser ? anyOtherUser._id : req.user._id;
    }

    // Independent routing safeguard:
    // If the reported party is the gig owner/employer or if no gig is specified, route to support admin / independent review
    const isReportingGigOwner = Boolean(
      gig && gig.postedBy && finalReportedParty && finalReportedParty.toString() === gig.postedBy._id.toString()
    );
    const isIndependentReview = !gig || isReportingGigOwner;

    // Find default assigned reviewer (admin or independent support)
    let assignedManager = null;
    let assignedManagerName = 'NearbyGigs Resolution Desk';

    if (isIndependentReview || !gig) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        assignedManager = adminUser._id;
        assignedManagerName = adminUser.name || 'Safety & Compliance Support';
      }
    } else {
      // If customer complains about worker, gig owner can be primary reviewer, or admin
      assignedManager = gig.postedBy?._id || null;
      assignedManagerName = gig.postedBy?.name || 'Job Owner / Employer';
    }

    const complaintRef = await generateComplaintId();
    const sla = calculateSLADeadlines(urgency);

    const formattedEvidence = Array.isArray(evidence)
      ? evidence.map((e) =>
          typeof e === 'string'
            ? { url: e, fileUrl: e, title: 'Attachment' }
            : { ...e, url: e.url || e.fileUrl || '', fileUrl: e.fileUrl || e.url || '' }
        )
      : [];

    const complaint = await Complaint.create({
      complaintId: complaintRef,
      gig: gig ? gig._id : undefined,
      application: effectiveAppId || undefined,
      complainant: req.user._id,
      complainantRole,
      reportedParty: finalReportedParty,
      category,
      title: effectiveTitle.trim(),
      description: description.trim(),
      incidentDate: incidentDate ? new Date(incidentDate) : new Date(),
      evidence: formattedEvidence,
      desiredResolution,
      desiredResolutionNotes: desiredResolutionNotes || '',
      urgency,
      assignedTo: assignedManager,
      assignedToName: assignedManagerName,
      isIndependentReview,
      status: 'submitted',
      acknowledgementDeadline: sla.acknowledgementDeadline,
      resolutionDeadline: sla.resolutionDeadline,
      statusHistory: [
        {
          status: 'submitted',
          updatedBy: req.user._id,
          updatedByName: req.user.name,
          notes: 'Complaint registered and assigned to reviewer.',
          timestamp: new Date(),
        },
      ],
    });

    // Notify Complainant with Confirmation & Reference #
    await Notification.create({
      recipient: req.user._id,
      sender: req.user._id,
      type: 'complaint_raised',
      title: `Complaint Registered [Ref: ${complaintRef}]`,
      message: `Your complaint for "${gig ? gig.title : 'Selected Job'}" has been filed. Expected response within ${sla.ackHours}h. Target resolution: ${sla.resolutionDeadline.toLocaleDateString()}.`,
      link: `/my-complaints`,
    });

    // Notify Assigned Reviewer / Support Team
    if (assignedManager && assignedManager.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedManager,
        sender: req.user._id,
        type: 'complaint_assigned',
        title: `⚠️ New Complaint Assigned [Ref: ${complaintRef}]`,
        message: `${req.user.name} reported "${category.replace(/_/g, ' ')}" on "${gig ? gig.title : 'Platform Service'}". Review SLA: ${sla.ackHours}h.`,
        link: `/manager/complaints`,
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'COMPLAINT_FILED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: complaint._id,
      metadata: {
        complaintId: complaintRef,
        category,
        urgency,
        gigId: gig ? gig._id : undefined,
        isIndependentReview,
      },
    });

    res.status(201).json({
      success: true,
      complaint,
      message: `Complaint ${complaintRef} registered successfully. Response target: ${sla.ackHours}h.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's complaints (filed by them or filed against them)
// @route   GET /api/complaints/my-complaints
// @access  Private
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({
      $or: [{ complainant: req.user._id }, { reportedParty: req.user._id }],
    })
      .populate('gig', 'title category address budgetMin budgetMax')
      .populate('complainant', 'name email profileImage role')
      .populate('reportedParty', 'name email profileImage role')
      .populate('assignedTo', 'name email role')
      .sort('-createdAt');

    // Redact internal investigation notes from non-manager users for confidentiality
    const sanitizedComplaints = complaints.map((c) => {
      const obj = c.toObject();
      const isComplainant = c.complainant?._id?.toString() === req.user._id.toString();
      const isReported = c.reportedParty?._id?.toString() === req.user._id.toString();

      if (isComplainant || isReported) {
        obj.investigationNotes = (obj.investigationNotes || []).filter((n) => !n.isInternalOnly);
      }
      return obj;
    });

    res.json({
      success: true,
      count: sanitizedComplaints.length,
      complaints: sanitizedComplaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manager complaint dashboard & analytics
// @route   GET /api/complaints/manager-dashboard
// @access  Private (Managers, Employers, Admins)
const getManagerComplaints = async (req, res, next) => {
  try {
    const { status, urgency, category, overdue, search } = req.query;

    const query = {};

    // If user is admin, they see all complaints. If employer/manager, see complaints assigned to them or their gigs
    if (req.user.role !== 'admin') {
      const myGigs = await Gig.find({ postedBy: req.user._id }).select('_id');
      const myGigIds = myGigs.map((g) => g._id);

      query.$or = [{ assignedTo: req.user._id }, { gig: { $in: myGigIds } }];
    }

    if (status && status !== 'ALL') query.status = status;
    if (urgency && urgency !== 'ALL') query.urgency = urgency;
    if (category && category !== 'ALL') query.category = category;
    if (overdue === 'true') query.isOverdue = true;

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('gig', 'title category address budgetMin budgetMax')
      .populate('complainant', 'name email phone role isStudent')
      .populate('reportedParty', 'name email phone role')
      .populate('assignedTo', 'name email role')
      .sort('-createdAt');

    // Calculate manager KPI summary stats
    const now = new Date();
    let managerFilter = {};
    if (req.user.role !== 'admin') {
      const userGigs = await Gig.find({ postedBy: req.user._id }).select('_id');
      const userGigIds = userGigs.map((g) => g._id);
      managerFilter = {
        $or: [
          { assignedTo: req.user._id },
          { gig: { $in: userGigIds } },
        ],
      };
    }
    const allManagerComplaints = await Complaint.find(managerFilter);

    const stats = {
      total: allManagerComplaints.length,
      submitted: allManagerComplaints.filter((c) => c.status === 'submitted').length,
      underInvestigation: allManagerComplaints.filter(
        (c) => c.status === 'under_investigation' || c.status === 'acknowledged' || c.status === 'assigned'
      ).length,
      awaitingInfo: allManagerComplaints.filter((c) => c.status === 'awaiting_information').length,
      approachingDeadline: allManagerComplaints.filter((c) => {
        if (c.status === 'resolved' || c.status === 'closed') return false;
        const diffHours = (new Date(c.resolutionDeadline) - now) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 12;
      }).length,
      overdue: allManagerComplaints.filter(
        (c) => (c.isOverdue || now > new Date(c.resolutionDeadline)) && c.status !== 'resolved' && c.status !== 'closed'
      ).length,
      escalated: allManagerComplaints.filter((c) => c.status === 'escalated' || c.isEscalated).length,
      resolved: allManagerComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length,
    };

    res.json({
      success: true,
      stats,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint details by ID
// @route   GET /api/complaints/:id
// @access  Private (Authorized parties only)
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('gig')
      .populate('application')
      .populate('complainant', 'name email phone role profileImage isStudent')
      .populate('reportedParty', 'name email phone role profileImage')
      .populate('assignedTo', 'name email phone role')
      .populate('resolvedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const isComplainant = complaint.complainant._id.toString() === req.user._id.toString();
    const isReported = complaint.reportedParty._id.toString() === req.user._id.toString();
    const isAssigned = complaint.assignedTo?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isComplainant && !isReported && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to inspect this complaint record.',
      });
    }

    const obj = complaint.toObject();
    if (isComplainant || isReported) {
      obj.investigationNotes = (obj.investigationNotes || []).filter((n) => !n.isInternalOnly);
    }

    res.json({ success: true, complaint: obj });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge complaint and update status
// @route   PUT /api/complaints/:id/acknowledge
// @access  Private (Manager / Reviewer)
const acknowledgeComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = 'acknowledged';
    complaint.acknowledgedAt = new Date();
    complaint.statusHistory.push({
      status: 'acknowledged',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: (req.body && req.body.notes) || 'Complaint reviewed and officially acknowledged by assigned manager.',
      timestamp: new Date(),
    });

    await complaint.save();

    // Notify Complainant
    await Notification.create({
      recipient: complaint.complainant,
      sender: req.user._id,
      type: 'complaint_acknowledged',
      title: `Complaint Acknowledged [Ref: ${complaint.complaintId}]`,
      message: `Your complaint is being handled by ${req.user.name}. Formal investigation has commenced.`,
      link: `/my-complaints`,
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'COMPLAINT_ACKNOWLEDGED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: complaint._id,
    });

    res.json({ success: true, complaint, message: 'Complaint officially acknowledged.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add investigation note or request information
// @route   PUT /api/complaints/:id/investigate
// @access  Private (Manager / Reviewer)
const updateComplaintInvestigation = async (req, res, next) => {
  try {
    const { note, requestInfoFrom, newStatus } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Investigation note is required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.investigationNotes.push({
      note: note.trim(),
      author: req.user._id,
      authorName: req.user.name,
      isInternalOnly: Boolean(req.body.isInternalOnly),
      createdAt: new Date(),
    });

    if (newStatus && ['under_investigation', 'awaiting_information'].includes(newStatus)) {
      complaint.status = newStatus;
    } else if (requestInfoFrom) {
      complaint.status = 'awaiting_information';
    } else {
      complaint.status = 'under_investigation';
    }

    complaint.statusHistory.push({
      status: complaint.status,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: note.trim(),
      timestamp: new Date(),
    });

    await complaint.save();

    // If clarification requested from complainant or respondent, notify them
    if (requestInfoFrom === 'complainant') {
      await Notification.create({
        recipient: complaint.complainant,
        sender: req.user._id,
        type: 'complaint_info_requested',
        title: `Information Requested [Ref: ${complaint.complaintId}]`,
        message: `The reviewer has requested additional clarification: "${note.trim()}"`,
        link: `/my-complaints`,
      });
    } else if (requestInfoFrom === 'reportedParty') {
      await Notification.create({
        recipient: complaint.reportedParty,
        sender: req.user._id,
        type: 'complaint_info_requested',
        title: `Response Requested Regarding Job Issue [Ref: ${complaint.complaintId}]`,
        message: `A query regarding a recent job requires your input: "${note.trim()}"`,
        link: `/my-complaints`,
      });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve complaint with recorded summary & corrective action
// @route   PUT /api/complaints/:id/resolve
// @access  Private (Manager / Reviewer)
const resolveComplaint = async (req, res, next) => {
  try {
    const { resolutionSummary, correctiveAction } = req.body;

    if (!resolutionSummary || !resolutionSummary.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A formal resolution summary is required to resolve a complaint.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = req.user._id;
    complaint.resolutionSummary = resolutionSummary.trim();
    complaint.correctiveAction = correctiveAction?.trim() || 'Investigation concluded with corrective guidance.';

    complaint.statusHistory.push({
      status: 'resolved',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: `Complaint resolved. Corrective action: ${complaint.correctiveAction}`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Notify Complainant
    await Notification.create({
      recipient: complaint.complainant,
      sender: req.user._id,
      type: 'complaint_resolved',
      title: `Complaint Resolved [Ref: ${complaint.complaintId}]`,
      message: `Resolution: "${complaint.resolutionSummary}". Action: ${complaint.correctiveAction}`,
      link: `/my-complaints`,
    });

    // Notify Respondent
    await Notification.create({
      recipient: complaint.reportedParty,
      sender: req.user._id,
      type: 'complaint_resolved',
      title: `Job Issue Investigation Concluded [Ref: ${complaint.complaintId}]`,
      message: `Outcome: "${complaint.resolutionSummary}". Action: ${complaint.correctiveAction}`,
      link: `/my-complaints`,
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'COMPLAINT_RESOLVED',
      status: 'SUCCESS',
      req,
      resourceType: 'Complaint',
      resourceId: complaint._id,
      metadata: {
        resolutionSummary: complaint.resolutionSummary,
        correctiveAction: complaint.correctiveAction,
      },
    });

    res.json({
      success: true,
      complaint,
      message: `Complaint ${complaint.complaintId} has been resolved with outcome recorded.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate complaint
// @route   PUT /api/complaints/:id/escalate
// @access  Private (Manager / Reviewer or Complainant)
const escalateComplaint = async (req, res, next) => {
  try {
    const { reason, escalationReason } = req.body || {};
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.isEscalated = true;
    complaint.status = 'escalated';
    complaint.escalatedAt = new Date();
    complaint.escalationReason = reason || escalationReason || 'Escalated to senior support oversight.';

    complaint.statusHistory.push({
      status: 'escalated',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: complaint.escalationReason,
      timestamp: new Date(),
    });

    await complaint.save();

    // Notify all admins of escalation
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        sender: req.user._id,
        type: 'complaint_escalated',
        title: `🚨 Escalation Alert [Ref: ${complaint.complaintId}]`,
        message: `Complaint has been escalated: "${complaint.escalationReason}"`,
        link: `/manager/complaints`,
      });
    }

    res.json({ success: true, complaint, message: 'Complaint escalated to senior oversight.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reopen a resolved complaint
// @route   PUT /api/complaints/:id/reopen
// @access  Private (Complainant)
const reopenComplaint = async (req, res, next) => {
  try {
    const { reason, reopenReason } = req.body || {};
    const effectiveReason = (reason || reopenReason || '').trim();
    if (!effectiveReason) {
      return res.status(400).json({ success: false, message: 'Reason for reopening is required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.complainant.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the complainant can request reopening.' });
    }

    complaint.status = 'reopened';
    complaint.reopenReason = effectiveReason;
    complaint.statusHistory.push({
      status: 'reopened',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      notes: `Reopened by user: ${effectiveReason}`,
      timestamp: new Date(),
    });

    await complaint.save();

    if (complaint.assignedTo) {
      await Notification.create({
        recipient: complaint.assignedTo,
        sender: req.user._id,
        type: 'complaint_reopened',
        title: `Complaint Reopened [Ref: ${complaint.complaintId}]`,
        message: `${req.user.name} reopened the complaint: "${effectiveReason}"`,
        link: `/manager/complaints`,
      });
    }

    res.json({ success: true, complaint, message: 'Complaint reopened for further review.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add additional evidence to existing complaint
// @route   POST /api/complaints/:id/evidence
// @access  Private
const addEvidence = async (req, res, next) => {
  try {
    const { title, url, fileUrl } = req.body || {};
    const effectiveUrl = (url || fileUrl || '').trim();
    if (!effectiveUrl && !title) {
      return res.status(400).json({ success: false, message: 'Valid evidence title or URL is required.' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.evidence.push({
      title: title || 'Additional Supporting Evidence',
      url: effectiveUrl,
      fileUrl: effectiveUrl,
      uploadedAt: new Date(),
    });

    await complaint.save();

    res.json({ success: true, evidence: complaint.evidence, message: 'Evidence added to complaint.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
