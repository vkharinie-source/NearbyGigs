const crypto = require('crypto');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Earning = require('../models/Earning');
const Complaint = require('../models/Complaint');
const { logAuditEvent } = require('../utils/auditLogger');
const { evaluateEligibility } = require('../utils/eligibilityEngine');

// @desc    Apply for a Gig with Smart Eligibility Validation & Suitability Evidence
// @route   POST /api/applications
// @access  Private (Worker)
const applyForGig = async (req, res, next) => {
  try {
    const {
      gigId,
      proposal,
      proposedRate,
      estimatedTime,
      suitabilityProof,
    } = req.body;

    if (!gigId) {
      return res.status(400).json({ success: false, message: 'Gig ID is required.' });
    }

    const gig = await Gig.findById(gigId).populate('postedBy', 'name email');
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found.' });
    }

    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This gig is currently not accepting applications.',
      });
    }

    if (gig.postedBy._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot apply for your own job posting.' });
    }

    // Server-Side Independent Eligibility Validation (Strict Verification Gate)
    const eligibility = evaluateEligibility(req.user, gig);
    if (!eligibility.isEligible) {
      return res.status(403).json({
        success: false,
        message: `Eligibility Restriction: ${eligibility.summary}`,
        status: eligibility.status,
        eligibility,
      });
    }

    // Check existing application to prevent duplicates
    const existingApp = await Application.findOne({ gig: gigId, applicant: req.user._id });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied for this gig.' });
    }

    // Build suitability evidence structure
    const proofData = {
      coverMessage: suitabilityProof?.coverMessage || proposal || '',
      portfolioLinks: Array.isArray(suitabilityProof?.portfolioLinks) ? suitabilityProof.portfolioLinks : [],
      certifications: Array.isArray(suitabilityProof?.certifications) ? suitabilityProof.certifications : [],
      references: Array.isArray(suitabilityProof?.references) ? suitabilityProof.references : [],
      availabilityConfirmed: suitabilityProof?.availabilityConfirmed !== undefined ? Boolean(suitabilityProof.availabilityConfirmed) : true,
    };

    const rate = Number(proposedRate) || gig.budgetMin || 500;

    const application = await Application.create({
      gig: gigId,
      applicant: req.user._id,
      proposal: proposal?.trim() || 'I am ready to perform this job with quality and commitment.',
      proposedRate: rate,
      estimatedTime: estimatedTime || gig.duration || '2-3 Hours',
      status: 'submitted',
      suitabilityProof: proofData,
      commitment: {
        status: 'not_applicable',
      },
      payment: {
        amount: rate,
        status: 'payment_not_initiated',
      },
    });

    // Increment applicants counter on the gig
    await Gig.findByIdAndUpdate(gigId, { $inc: { applicantsCount: 1 } });

    // Send in-app notification to the job owner
    await Notification.create({
      recipient: gig.postedBy._id,
      sender: req.user._id,
      type: 'application_received',
      title: 'New Candidate Proposal Received',
      message: `${req.user.name} submitted a proposal for "${gig.title}" (Rate: ₹${rate})`,
      link: '/applications/received',
    });

    // Night Work Safety: Alert student worker and verified guardian
    if (gig.isNightGig && req.user.isStudent && req.user.guardian?.isVerified) {
      await Notification.create({
        recipient: req.user._id,
        type: 'system',
        title: '🌙 Night Gig Proposal Recorded',
        message: `Your proposal for evening/night gig "${gig.title}" has been registered. Guardian alert safeguards will activate if selected.`,
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_APPLICATION_SUBMITTED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gig._id,
      metadata: { proposedRate: rate, isNightGig: gig.isNightGig },
    });

    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// @desc    Get My Applications (as worker)
// @route   GET /api/applications/my-applications
// @access  Private
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'gig',
        populate: { path: 'postedBy', select: 'name email profileImage phone employerStatus companyName' },
      })
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Applications Received for My Gigs (as employer)
// @route   GET /api/applications/received
// @access  Private
const getReceivedApplications = async (req, res, next) => {
  try {
    const myGigs = await Gig.find({ postedBy: req.user._id }).select('_id');
    const gigIds = myGigs.map((g) => g._id);

    const applications = await Application.find({ gig: { $in: gigIds } })
      .populate('gig', 'title budgetMin budgetMax status isNightGig date time jobType duration address evidenceRequirements attendanceMethod')
      .populate(
        'applicant',
        'name email rating profileImage bio skills phone isStudent age studentVerificationStatus kycStatus maskedAadhaar experience college school'
      )
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Employer updates application status (Review, Shortlist, Accept/Select, Reject)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes, instructions } = req.body;
    const validStatuses = ['under_review', 'shortlisted', 'accepted', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const application = await Application.findById(req.params.id)
      .populate('gig')
      .populate('applicant', 'name email isStudent guardian phone');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Verify ownership: only the gig creator or admin can update
    if (application.gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this candidate application.' });
    }

    application.status = status;

    if (status === 'accepted') {
      // Transition commitment workflow: Selected worker must explicitly confirm commitment
      application.commitment.status = 'awaiting_worker_confirmation';

      // Save complete job instructions (Section 10)
      application.jobInstructions = {
        confirmedDate: instructions?.confirmedDate || application.gig.date || 'Scheduled Date',
        startTime: instructions?.startTime || application.gig.startTime || '10:00 AM',
        endTime: instructions?.endTime || application.gig.endTime || '01:00 PM',
        agreedPayment: instructions?.agreedPayment || application.proposedRate || application.gig.budgetMin || 500,
        paymentType: instructions?.paymentType || application.gig.salaryType || 'Fixed',
        responsibilities: instructions?.responsibilities || application.gig.description || 'Assigned job duties',
        workLocation: instructions?.workLocation || application.gig.address || 'Bengaluru, Karnataka',
        arrivalInstructions: instructions?.arrivalInstructions || 'Please arrive 10 minutes prior to scheduled start time.',
        contactPhone: instructions?.contactPhone || req.user.phone || '',
        safetyInstructions: instructions?.safetyInstructions || 'Wear standard protective gear and follow platform safety rules.',
        attendanceMethod: instructions?.attendanceMethod || application.gig.attendanceMethod || 'otp',
        completionRequirements: instructions?.completionRequirements || 'Submit completion evidence before payment release.',
        providedAt: new Date(),
        status: 'provided',
      };

      // Update gig status to assigned
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'assigned',
        assignedTo: application.applicant._id,
      });

      // Initialize pending earning record in financial ledger
      const earning = await Earning.create({
        worker: application.applicant._id,
        employer: req.user._id,
        gig: application.gig._id,
        title: application.gig.title,
        amount: application.jobInstructions.agreedPayment,
        hoursWorked: 3,
        payoutStatus: 'escrow_held',
      });

      application.payment.amount = earning.amount;
      application.payment.status = 'payment_pending';
      application.payment.earningRecord = earning._id;

      // Notify the selected worker with complete job instructions
      await Notification.create({
        recipient: application.applicant._id,
        sender: req.user._id,
        type: 'application_accepted',
        title: '🎉 Application Accepted — Job Instructions Provided',
        message: `Employer accepted your proposal for "${application.gig.title}" at ₹${application.jobInstructions.agreedPayment}. Complete job instructions are available in My Approved Jobs. Please review and confirm your commitment.`,
        link: '/my-applications',
      });
    } else if (status === 'shortlisted') {
      await Notification.create({
        recipient: application.applicant._id,
        sender: req.user._id,
        type: 'application_shortlisted',
        title: 'Application Shortlisted',
        message: `Your application for "${application.gig.title}" has been shortlisted by the employer.`,
        link: '/my-applications',
      });
    } else if (status === 'rejected') {
      await Notification.create({
        recipient: application.applicant._id,
        sender: req.user._id,
        type: 'application_rejected',
        title: 'Application Status Update',
        message: `Your application for "${application.gig.title}" was not selected at this time.`,
        link: '/my-applications',
      });
    }

    await application.save();

    await logAuditEvent({
      user: req.user._id,
      action: 'APPLICATION_STATUS_UPDATED',
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { newStatus: status, gigId: application.gig._id },
    });

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 7A. WORKER COMMITMENT CONFIRMATION
// =========================================================================

// @desc    Worker confirms, declines, or requests clarification for selected job
// @route   POST /api/applications/:id/commit
// @access  Private (Worker)
const respondToCommitment = async (req, res, next) => {
  try {
    const { action, notes, reason } = req.body; // action: 'confirm' | 'decline' | 'clarify' | 'reschedule' | 'cancel'
    const allowedActions = ['confirm', 'decline', 'clarify', 'reschedule', 'cancel'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({ success: false, message: `Action must be one of: ${allowedActions.join(', ')}` });
    }

    const application = await Application.findById(req.params.id)
      .populate('gig')
      .populate('applicant', 'name email isStudent guardian');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Only the chosen applicant can respond
    if (application.applicant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this job offer.' });
    }

    const employerId = application.gig.postedBy;

    if (action === 'confirm') {
      application.commitment.status = 'confirmed';
      application.commitment.workerConfirmedAt = new Date();
      application.commitment.workerConfirmationNotes = notes || 'Confirmed attendance and agreement with job conditions.';
      application.workCompletion.status = 'in_progress';

      // Notify Employer
      await Notification.create({
        recipient: employerId,
        sender: req.user._id,
        type: 'commitment_confirmed',
        title: '✓ Worker Commitment Confirmed',
        message: `${req.user.name} confirmed their commitment for "${application.gig.title}". You can now generate arrival attendance proof.`,
        link: '/applications/received',
      });
    } else if (action === 'decline' || action === 'cancel') {
      application.commitment.status = 'declined';
      application.commitment.declinedReason = reason || notes || 'Worker requested cancellation.';
      application.commitment.cancelledBy = req.user._id;
      application.commitment.cancelledAt = new Date();
      application.status = 'withdrawn';

      // Reset gig status back to open so employer can select another applicant
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'open',
        assignedTo: null,
      });

      // Update financial ledger
      if (application.payment.earningRecord) {
        await Earning.findByIdAndUpdate(application.payment.earningRecord, {
          payoutStatus: 'disputed',
        });
      }

      // Notify Employer
      await Notification.create({
        recipient: employerId,
        sender: req.user._id,
        type: 'commitment_declined',
        title: 'Worker Cancelled Job Commitment',
        message: `${req.user.name} cancelled the assignment for "${application.gig.title}". Reason: ${reason || notes || 'Not specified'}. The job is reopened for candidates.`,
        link: '/applications/received',
      });
    } else if (action === 'reschedule') {
      application.commitment.clarificationRequested = `Rescheduling Request: ${notes || reason || 'Requesting revised time/date'}`;

      // Notify Employer
      await Notification.create({
        recipient: employerId,
        sender: req.user._id,
        type: 'clarification_requested',
        title: '📅 Rescheduling Request Received',
        message: `${req.user.name} requested to reschedule "${application.gig.title}": "${notes || reason}"`,
        link: '/messages',
      });
    } else if (action === 'clarify') {
      application.commitment.clarificationRequested = notes || reason || 'Question regarding timings or location.';

      // Notify Employer
      await Notification.create({
        recipient: employerId,
        sender: req.user._id,
        type: 'clarification_requested',
        title: 'Clarification Requested by Worker',
        message: `${req.user.name} requested clarification for "${application.gig.title}": "${notes}"`,
        link: '/messages',
      });
    }

    await application.save();

    await logAuditEvent({
      user: req.user._id,
      action: `COMMITMENT_${action.toUpperCase()}`,
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { action, notes },
    });

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 7A. ATTENDANCE PROOF FOR ON-SITE WORK
// =========================================================================

// @desc    Employer generates single-use, short-lived Attendance OTP or QR Code Token
// @route   POST /api/applications/:id/attendance/generate-code
// @access  Private (Employer)
const generateAttendanceCode = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the employer can generate attendance codes.' });
    }

    if (application.commitment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Worker commitment must be confirmed before generating check-in attendance proof.',
      });
    }

    // Generate single-use 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Generate secure QR token
    const qrToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes validity

    application.attendance.otpCode = otp;
    application.attendance.otpExpiresAt = expiresAt;
    application.attendance.qrToken = qrToken;
    application.attendance.qrExpiresAt = expiresAt;
    application.attendance.status = 'checkin_pending';

    await application.save();

    // Notify the worker with the check-in request
    await Notification.create({
      recipient: application.applicant,
      sender: req.user._id,
      type: 'attendance_otp_generated',
      title: '📍 Arrival Attendance Check-In Available',
      message: `The employer generated your check-in code for "${application.gig.title}". Provide or scan the verification code with the employer upon arrival.`,
      link: '/my-applications',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'ATTENDANCE_CODE_GENERATED',
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
    });

    res.json({
      success: true,
      attendance: {
        otp,
        qrToken,
        expiresAt,
        status: application.attendance.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Worker submits attendance verification OTP or QR token
// @route   POST /api/applications/:id/attendance/verify
// @access  Private (Worker)
const verifyAttendance = async (req, res, next) => {
  try {
    const { code, latitude, longitude, address } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Check-in OTP or QR code token is required.' });
    }

    const application = await Application.findById(req.params.id)
      .select('+attendance.otpCode +attendance.otpExpiresAt +attendance.qrToken +attendance.qrExpiresAt')
      .populate('gig');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned worker can check in.' });
    }

    const cleanInput = String(code).trim();
    const isOtpMatch = application.attendance.otpCode && application.attendance.otpCode === cleanInput;
    const isQrMatch = application.attendance.qrToken && application.attendance.qrToken === cleanInput;

    if (!isOtpMatch && !isQrMatch) {
      return res.status(400).json({ success: false, message: 'Invalid check-in code. Please ask the employer for a fresh code.' });
    }

    const now = new Date();
    const expiry = isOtpMatch ? application.attendance.otpExpiresAt : application.attendance.qrExpiresAt;
    if (expiry && expiry < now) {
      return res.status(400).json({ success: false, message: 'Attendance code has expired. Please ask the employer to regenerate.' });
    }

    // Mark verified and burn token to prevent replay
    application.attendance.status = 'attendance_verified';
    application.attendance.checkInTime = now;
    application.attendance.otpCode = undefined;
    application.attendance.otpExpiresAt = undefined;
    application.attendance.qrToken = undefined;
    application.attendance.qrExpiresAt = undefined;

    if (latitude && longitude) {
      application.attendance.checkInLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || 'Verified Jobsite',
      };
    }

    await application.save();

    // Notify Employer
    await Notification.create({
      recipient: application.gig.postedBy,
      sender: req.user._id,
      type: 'attendance_verified',
      title: '✓ Worker Attendance Verified',
      message: `${req.user.name} checked in successfully for "${application.gig.title}" at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      link: '/applications/received',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'ATTENDANCE_VERIFIED',
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { checkInTime: now },
    });

    res.json({
      success: true,
      message: 'Attendance verified successfully. You can begin the assigned tasks.',
      attendance: {
        status: application.attendance.status,
        checkInTime: application.attendance.checkInTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Check-Out timestamp
// @route   POST /api/applications/:id/attendance/checkout
// @access  Private (Worker or Employer)
const recordCheckOut = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const isWorker = application.applicant.toString() === req.user._id.toString();
    const isEmployer = application.gig.postedBy.toString() === req.user._id.toString();

    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    application.attendance.checkOutTime = new Date();
    application.attendance.status = 'checkout_recorded';
    await application.save();

    const otherParty = isWorker ? application.gig.postedBy : application.applicant;
    await Notification.create({
      recipient: otherParty,
      sender: req.user._id,
      type: 'system',
      title: 'Check-Out Recorded',
      message: `Work session check-out recorded for "${application.gig.title}".`,
      link: isWorker ? '/my-applications' : '/applications/received',
    });

    res.json({
      success: true,
      message: 'Check-out recorded.',
      attendance: application.attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Raise an Attendance Dispute
// @route   POST /api/applications/:id/attendance/dispute
// @access  Private (Worker or Employer)
const disputeAttendance = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Dispute reason is required.' });
    }

    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const isWorker = application.applicant.toString() === req.user._id.toString();
    const isEmployer = application.gig.postedBy.toString() === req.user._id.toString();

    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    application.attendance.status = 'attendance_disputed';
    application.attendance.disputeReason = reason.trim();
    application.attendance.disputedBy = req.user._id;
    application.attendance.disputedAt = new Date();

    await application.save();

    const recipient = isWorker ? application.gig.postedBy : application.applicant;
    await Notification.create({
      recipient,
      sender: req.user._id,
      type: 'attendance_disputed',
      title: '⚠️ Attendance Dispute Raised',
      message: `An attendance discrepancy was reported for "${application.gig.title}": "${reason}"`,
      link: isWorker ? '/applications/received' : '/my-applications',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'ATTENDANCE_DISPUTE_RAISED',
      status: 'WARNING',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { reason },
    });

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 7A. PROOF OF WORK COMPLETION & TWO-WAY WORKFLOW
// =========================================================================

const normalizePhotos = (photos) => {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((p) => {
      if (typeof p === 'string') {
        return { url: p, caption: '', uploadedAt: new Date() };
      }
      return {
        url: p?.url || '',
        caption: p?.caption || '',
        uploadedAt: p?.uploadedAt || new Date(),
      };
    })
    .filter((p) => !!p.url);
};

const normalizeChecklist = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((c) => ({
    task: c?.task || c?.label || 'Requirement completed',
    completed: typeof c?.completed === 'boolean' ? c.completed : !!c?.checked,
  }));
};

const normalizeLinks = (links) => {
  if (!Array.isArray(links)) return [];
  return links
    .map((l) => {
      if (typeof l === 'string') return { title: 'Deliverable Link', url: l };
      return { title: l?.title || 'Deliverable', url: l?.url || '' };
    })
    .filter((l) => !!l.url);
};

const normalizeEvidence = (evList) => {
  if (!Array.isArray(evList)) return [];
  return evList
    .map((e) => {
      if (typeof e === 'string') {
        return { title: 'Evidence Proof', url: e, fileType: 'image', uploadedAt: new Date() };
      }
      return {
        title: e?.title || 'Evidence Proof',
        url: e?.url || '',
        fileType: e?.fileType || 'image',
        uploadedAt: e?.uploadedAt || new Date(),
      };
    })
    .filter((e) => !!e.url);
};

// @desc    Worker submits evidence of completed work (or resubmits after correction)
// @route   POST /api/applications/:id/completion/submit
// @access  Private (Worker)
const submitWorkCompletion = async (req, res, next) => {
  try {
    const {
      taskDescription,
      deliverableLinks,
      checklist,
      beforePhotos,
      afterPhotos,
      evidence,
      notes,
    } = req.body;

    if (!taskDescription || !taskDescription.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a clear description of completed work.' });
    }

    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned worker can submit completion evidence.' });
    }

    if (['completed_confirmed', 'completed', 'cancelled'].includes(application.workCompletion.status)) {
      return res.status(400).json({ success: false, message: 'This assignment is already finalized and cannot be modified.' });
    }

    const isResubmission = ['correction_requested', 'revision_requested', 'dispute_under_review'].includes(
      application.workCompletion.status
    );

    // Save previous submission snapshot to history if one already existed
    if (application.workCompletion.submittedAt) {
      const prevSubNumber = (application.workCompletion.submissionHistory?.length || 0) + 1;
      if (!application.workCompletion.submissionHistory) {
        application.workCompletion.submissionHistory = [];
      }
      application.workCompletion.submissionHistory.push({
        submissionNumber: prevSubNumber,
        taskDescription: application.workCompletion.taskDescription,
        deliverableLinks: application.workCompletion.deliverableLinks || [],
        beforePhotos: application.workCompletion.beforePhotos || [],
        afterPhotos: application.workCompletion.afterPhotos || [],
        evidence: application.workCompletion.evidence || [],
        submittedAt: application.workCompletion.submittedAt,
        notes: notes || 'Previous work submission revision',
      });
    }

    // Update active completion data with normalized fields
    application.workCompletion.taskDescription = taskDescription.trim();
    application.workCompletion.deliverableLinks = normalizeLinks(deliverableLinks);
    application.workCompletion.checklist = normalizeChecklist(checklist);
    application.workCompletion.beforePhotos = normalizePhotos(beforePhotos);
    application.workCompletion.afterPhotos = normalizePhotos(afterPhotos);
    application.workCompletion.evidence = normalizeEvidence(evidence);
    application.workCompletion.submittedAt = new Date();

    // Two-way confirmation flag for worker
    application.workCompletion.twoWayConfirmation = application.workCompletion.twoWayConfirmation || {};
    application.workCompletion.twoWayConfirmation.workerConfirmed = true;
    application.workCompletion.twoWayConfirmation.workerConfirmedAt = new Date();
    application.workCompletion.twoWayConfirmation.workerNotes = notes || taskDescription.trim();
    // Reset employer confirmation so employer verifies latest submission
    application.workCompletion.twoWayConfirmation.employerConfirmed = false;

    // Transition status
    const newStatus = isResubmission ? 'resubmitted_for_review' : 'submitted_for_review';
    application.workCompletion.status = newStatus;
    application.status = 'submitted'; // application active status

    // If there are open correction requests, update them to addressed
    if (application.workCompletion.correctionHistory && application.workCompletion.correctionHistory.length > 0) {
      application.workCompletion.correctionHistory.forEach((c) => {
        if (c.status === 'open') c.status = 'addressed';
      });
    }

    // Payment tracking: ensure status is pending review
    if (application.payment.status === 'payment_not_initiated') {
      application.payment.status = 'payment_pending';
      if (!application.payment.history) application.payment.history = [];
      application.payment.history.push({
        status: 'payment_pending',
        amount: application.payment.amount,
        note: 'Worker submitted completion proof. Escrow pending employer verification.',
        recordedBy: req.user._id,
        timestamp: new Date(),
      });
    }

    await application.save();

    // Notify Employer
    await Notification.create({
      recipient: application.gig.postedBy,
      sender: req.user._id,
      type: isResubmission ? 'correction_resubmitted' : 'completion_submitted',
      title: isResubmission ? '🔄 Corrected Work Resubmitted for Review' : '📋 Work Completion Proof Submitted',
      message: `${req.user.name} submitted completion deliverables for "${application.gig.title}". Please review and confirm.`,
      link: '/applications/received',
    });

    await logAuditEvent({
      user: req.user._id,
      action: isResubmission ? 'WORK_CORRECTION_RESUBMITTED' : 'WORK_COMPLETION_SUBMITTED',
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { isResubmission, photosCount: (beforePhotos?.length || 0) + (afterPhotos?.length || 0) },
    });

    res.json({
      success: true,
      message: isResubmission
        ? 'Corrected work resubmitted for employer review.'
        : 'Work completion proof submitted for employer review.',
      workCompletion: application.workCompletion,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Employer reviews completion evidence (Accept, Request Correction, Raise Dispute)
// @route   POST /api/applications/:id/completion/review
// @access  Private (Employer)
const reviewWorkCompletion = async (req, res, next) => {
  try {
    const { decision, reason, feedback, revisionNotes, disputeNotes, evidence } = req.body;
    const normalizedEvidence = normalizeEvidence(evidence);
    // Normalized decision: 'accept' (or 'approve'), 'request_correction' (or 'request_revision'), 'raise_dispute' (or 'dispute')

    const normalizedDecision =
      decision === 'approve' ? 'accept' :
      decision === 'request_revision' ? 'request_correction' :
      decision === 'dispute' ? 'raise_dispute' : decision;

    if (!['accept', 'request_correction', 'raise_dispute'].includes(normalizedDecision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be "accept", "request_correction", or "raise_dispute".',
      });
    }

    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the job owner can review completion evidence.' });
    }

    application.workCompletion.reviewedAt = new Date();
    application.workCompletion.reviewedBy = req.user._id;
    application.workCompletion.employerFeedback = feedback || reason || '';

    // A. ACCEPT WORK
    if (normalizedDecision === 'accept') {
      application.workCompletion.twoWayConfirmation = application.workCompletion.twoWayConfirmation || {};
      application.workCompletion.twoWayConfirmation.employerConfirmed = true;
      application.workCompletion.twoWayConfirmation.employerConfirmedAt = new Date();
      application.workCompletion.twoWayConfirmation.employerNotes = feedback || 'Work meets agreed specifications.';

      // Both parties have confirmed
      application.workCompletion.status = 'completed_confirmed';
      application.status = 'completed';

      // Update Gig Status
      await Gig.findByIdAndUpdate(application.gig._id, { status: 'completed' });

      // Update Payment Tracking
      application.payment.status = 'paid';
      application.payment.paidAt = new Date();
      if (!application.payment.history) application.payment.history = [];
      application.payment.history.push({
        status: 'paid',
        amount: application.payment.amount,
        note: 'Employer accepted work deliverables. Payment confirmed.',
        recordedBy: req.user._id,
        timestamp: new Date(),
      });

      // Update financial ledger (Earning record) if present
      if (application.payment.earningRecord) {
        await Earning.findByIdAndUpdate(application.payment.earningRecord, {
          payoutStatus: 'paid',
          paymentDate: new Date(),
          escrowReleasedAt: new Date(),
        });
      }

      // Notify Worker
      await Notification.create({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'job_completed_confirmed',
        title: '🎉 Work Completed & Confirmed! Payment Released',
        message: `Employer accepted your work on "${application.gig.title}". Payout of ₹${application.payment.amount} has been confirmed. You may now leave a rating!`,
        link: '/my-applications',
      });
    }

    // B. REQUEST CORRECTION
    else if (normalizedDecision === 'request_correction') {
      const correctionReason = (reason || revisionNotes || feedback || '').trim();
      if (!correctionReason) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a clear reason explaining what needs to be corrected.',
        });
      }

      application.workCompletion.status = 'correction_requested';
      application.workCompletion.revisionNotes = correctionReason;

      // Reset worker confirmation until worker reviews and resubmits
      application.workCompletion.twoWayConfirmation = application.workCompletion.twoWayConfirmation || {};
      application.workCompletion.twoWayConfirmation.workerConfirmed = false;
      application.workCompletion.twoWayConfirmation.employerConfirmed = false;

      // Add to correction history
      if (!application.workCompletion.correctionHistory) {
        application.workCompletion.correctionHistory = [];
      }
      application.workCompletion.correctionHistory.push({
        reason: correctionReason,
        notes: feedback || '',
        evidence: normalizedEvidence,
        requestedAt: new Date(),
        requestedBy: req.user._id,
        status: 'open',
      });

      // Notify Worker
      await Notification.create({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'correction_requested',
        title: '📝 Work Correction Requested',
        message: `Employer requested corrections for "${application.gig.title}": "${correctionReason}". Please make the adjustments and resubmit.`,
        link: '/my-applications',
      });
    }

    // C. RAISE FORMAL DISPUTE
    else if (normalizedDecision === 'raise_dispute') {
      const disputeReason = (reason || disputeNotes || feedback || '').trim();
      if (!disputeReason) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a clear reason for opening a dispute.',
        });
      }

      application.workCompletion.status = 'dispute_under_review';
      application.workCompletion.disputeNotes = disputeReason;
      application.payment.status = 'payment_disputed';

      if (!application.payment.history) application.payment.history = [];
      application.payment.history.push({
        status: 'payment_disputed',
        amount: application.payment.amount,
        note: `Formal dispute raised by employer: ${disputeReason}`,
        recordedBy: req.user._id,
        timestamp: new Date(),
      });

      if (application.payment.earningRecord) {
        await Earning.findByIdAndUpdate(application.payment.earningRecord, {
          payoutStatus: 'disputed',
        });
      }

      // Create linked Complaint document for formal mediation
      const disputeCode = 'DISP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const complaint = await Complaint.create({
        complaintId: disputeCode,
        gig: application.gig._id,
        application: application._id,
        complainant: req.user._id,
        complainantRole: 'employer',
        reportedParty: application.applicant,
        category: 'incomplete_work',
        title: `Work Review Dispute: ${application.gig.title}`,
        description: disputeReason,
        incidentDate: new Date(),
        evidence: normalizedEvidence,
        desiredResolution: 'work_corrected',
        desiredResolutionNotes: disputeReason,
        urgency: 'medium',
        status: 'submitted',
        acknowledgementDeadline: new Date(Date.now() + 4 * 3600 * 1000),
        resolutionDeadline: new Date(Date.now() + 48 * 3600 * 1000),
        employerStatement: {
          text: disputeReason,
          evidence: normalizedEvidence,
          submittedAt: new Date(),
        },
        statusHistory: [
          {
            status: 'submitted',
            updatedBy: req.user._id,
            updatedByName: req.user.name,
            notes: `Dispute opened by Employer during completion review. Reason: ${disputeReason}`,
            timestamp: new Date(),
          },
        ],
      });

      // Update application dispute details
      application.workCompletion.disputeDetails = {
        disputeId: complaint._id,
        disputeReference: disputeCode,
        raisedBy: req.user._id,
        raisedByRole: 'employer',
        reason: disputeReason,
        evidence: normalizedEvidence,
        raisedAt: new Date(),
        resolutionStatus: 'open',
      };

      // Notify Worker
      await Notification.create({
        recipient: application.applicant,
        sender: req.user._id,
        type: 'dispute_raised',
        title: '⚠️ Work Completion Dispute Opened',
        message: `Employer raised a formal review dispute on "${application.gig.title}". You can submit your statement and evidence for admin mediation.`,
        link: '/my-applications',
      });

      // Notify Admins
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const adm of admins) {
        await Notification.create({
          recipient: adm._id,
          sender: req.user._id,
          type: 'complaint_raised',
          title: `⚖️ New Work Dispute: ${disputeCode}`,
          message: `Employer disputed completion for "${application.gig.title}". Case ready for admin review.`,
          link: '/admin/disputes',
        });
      }
    }

    await application.save();

    await logAuditEvent({
      user: req.user._id,
      action: `COMPLETION_REVIEW_${normalizedDecision.toUpperCase()}`,
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { decision: normalizedDecision, feedback, reason },
    });

    res.json({
      success: true,
      message:
        normalizedDecision === 'accept'
          ? 'Work accepted and confirmed. Payment released!'
          : normalizedDecision === 'request_correction'
          ? 'Correction request submitted to worker.'
          : 'Dispute submitted for admin mediation.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Worker responds to correction or raises disagreement/concern
// @route   POST /api/applications/:id/completion/concern
// @access  Private (Worker)
const acknowledgeOrConcern = async (req, res, next) => {
  try {
    const { action, statement, evidence } = req.body; // action: 'agree_to_correct' | 'raise_concern'
    const normalizedEvidence = normalizeEvidence(evidence);
    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned worker can perform this action.' });
    }

    if (action === 'raise_concern') {
      const concernText = (statement || '').trim();
      if (!concernText) {
        return res.status(400).json({ success: false, message: 'Please provide details of your concern or disagreement.' });
      }

      application.workCompletion.status = 'dispute_under_review';
      application.workCompletion.twoWayConfirmation = application.workCompletion.twoWayConfirmation || {};
      application.workCompletion.twoWayConfirmation.workerConcern = concernText;
      application.workCompletion.twoWayConfirmation.workerConcernAt = new Date();
      application.payment.status = 'payment_disputed';

      // Check if complaint already exists; if not, create one
      let complaintId = application.workCompletion.disputeDetails?.disputeId;
      if (!complaintId) {
        const disputeCode = 'DISP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        const comp = await Complaint.create({
          complaintId: disputeCode,
          gig: application.gig._id,
          application: application._id,
          complainant: req.user._id,
          complainantRole: 'worker',
          reportedParty: application.gig.postedBy,
          category: 'work_quality_mismatch',
          title: `Worker Disagreement: ${application.gig.title}`,
          description: concernText,
          incidentDate: new Date(),
          evidence: normalizedEvidence,
          desiredResolution: 'clarification',
          desiredResolutionNotes: concernText,
          urgency: 'medium',
          status: 'submitted',
          acknowledgementDeadline: new Date(Date.now() + 4 * 3600 * 1000),
          resolutionDeadline: new Date(Date.now() + 48 * 3600 * 1000),
          workerStatement: {
            text: concernText,
            evidence: normalizedEvidence,
            submittedAt: new Date(),
          },
          statusHistory: [
            {
              status: 'submitted',
              updatedBy: req.user._id,
              updatedByName: req.user.name,
              notes: `Worker raised concern/dispute regarding employer review: ${concernText}`,
              timestamp: new Date(),
            },
          ],
        });
        complaintId = comp._id;
        application.workCompletion.disputeDetails = {
          disputeId: comp._id,
          disputeReference: disputeCode,
          raisedBy: req.user._id,
          raisedByRole: 'worker',
          reason: concernText,
          evidence: normalizedEvidence,
          raisedAt: new Date(),
          resolutionStatus: 'open',
        };
      } else {
        // Update existing complaint with worker's statement
        await Complaint.findByIdAndUpdate(complaintId, {
          workerStatement: {
            text: concernText,
            evidence: normalizedEvidence,
            submittedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'under_investigation',
              updatedBy: req.user._id,
              updatedByName: req.user.name,
              notes: `Worker statement submitted: ${concernText}`,
              timestamp: new Date(),
            },
          },
        });
        if (application.workCompletion.disputeDetails) {
          application.workCompletion.disputeDetails.workerResponse = concernText;
          application.workCompletion.disputeDetails.workerResponseEvidence = normalizedEvidence;
          application.workCompletion.disputeDetails.workerRespondedAt = new Date();
        }
      }

      await application.save();

      // Notify Employer
      await Notification.create({
        recipient: application.gig.postedBy,
        sender: req.user._id,
        type: 'dispute_response_submitted',
        title: '⚖️ Worker Submitted Statement / Disagreement',
        message: `${req.user.name} submitted a statement regarding "${application.gig.title}". Case is under mediation.`,
        link: '/applications/received',
      });

      return res.json({
        success: true,
        message: 'Your concern has been recorded and submitted for dispute review.',
        application,
      });
    }

    // Default: Worker acknowledges and plans to correct
    res.json({ success: true, message: 'Acknowledgment recorded. You can now correct and resubmit.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete work completion, history & dispute dossier for an application
// @route   GET /api/applications/:id/completion-details
// @access  Private (Worker, Employer, Admin)
const getApplicationCompletionDetails = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('gig')
      .populate('applicant', 'name email phone profileImage rating verified badge createdAt')
      .populate('workCompletion.reviewedBy', 'name email')
      .populate('workCompletion.disputeDetails.disputeId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const isWorker = application.applicant._id.toString() === req.user._id.toString();
    const isEmployer = application.gig.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isWorker && !isEmployer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this completion record.' });
    }

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 7A. CANCELLATION WORKFLOW
// =========================================================================

// @desc    Worker or Employer cancels assignment with mandatory reason
// @route   POST /api/applications/:id/cancel
// @access  Private
const cancelAssignment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a clear cancellation reason.' });
    }

    const application = await Application.findById(req.params.id).populate('gig');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const isWorker = application.applicant.toString() === req.user._id.toString();
    const isEmployer = application.gig.postedBy.toString() === req.user._id.toString();

    if (!isWorker && !isEmployer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this assignment.' });
    }

    application.commitment.status = 'cancelled';
    application.commitment.cancellationReason = reason.trim();
    application.commitment.cancelledBy = req.user._id;
    application.commitment.cancelledAt = new Date();
    application.status = 'cancelled';

    // Reopen gig for other workers if cancelled before completion
    if (application.workCompletion.status !== 'approved') {
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'open',
        assignedTo: null,
      });

      if (application.payment.earningRecord) {
        await Earning.findByIdAndUpdate(application.payment.earningRecord, {
          payoutStatus: 'disputed',
        });
      }
    }

    await application.save();

    const recipient = isWorker ? application.gig.postedBy : application.applicant;
    await Notification.create({
      recipient,
      sender: req.user._id,
      type: 'cancellation_confirmed',
      title: 'Assignment Cancelled',
      message: `${req.user.name} recorded cancellation for "${application.gig.title}". Reason: "${reason.trim()}"`,
      link: isWorker ? '/applications/received' : '/my-applications',
    });

    await logAuditEvent({
      user: req.user._id,
      action: 'ASSIGNMENT_CANCELLED',
      status: 'SUCCESS',
      req,
      resourceType: 'Application',
      resourceId: application._id,
      metadata: { cancelledBy: isWorker ? 'WORKER' : 'EMPLOYER', reason },
    });

    res.json({ success: true, message: 'Assignment cancelled successfully.', application });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
