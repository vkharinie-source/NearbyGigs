const Application = require('../models/Application');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Earning = require('../models/Earning');
const { logAuditEvent } = require('../utils/auditLogger');

// Apply for a Gig with Student Safety & Age Verification Checks
const applyForGig = async (req, res, next) => {
  try {
    const { gigId, proposal, proposedRate, estimatedTime } = req.body;

    if (!gigId) {
      return res.status(400).json({ success: false, message: 'Gig ID is required.' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found.' });
    }

    if (gig.postedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot apply for your own gig.' });
    }

    // Check Student Safety & Minimum Age Requirement
    if (gig.minimumAge && req.user.age !== undefined && req.user.age < gig.minimumAge) {
      return res.status(403).json({
        success: false,
        message: `Safety Restriction: You must be at least ${gig.minimumAge} years old to apply for this gig.`,
      });
    }

    // Check existing application
    const existingApp = await Application.findOne({ gig: gigId, applicant: req.user._id });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied for this gig.' });
    }

    const application = await Application.create({
      gig: gigId,
      applicant: req.user._id,
      proposal: proposal?.trim() || 'I am interested in this gig and available to work.',
      proposedRate: Number(proposedRate) || gig.budgetMin,
      estimatedTime: estimatedTime || gig.duration || '2-3 Hours',
    });

    // Notify Gig Poster
    await Notification.create({
      recipient: gig.postedBy,
      sender: req.user._id,
      type: 'application_received',
      title: 'New Application Received',
      message: `${req.user.name} applied for your gig "${gig.title}" (Proposed: ₹${application.proposedRate})`,
      link: '/applications/received',
    });

    // Night Work Safety Alert: If student worker applied to night gig, notify guardian
    if (gig.isNightGig && req.user.isStudent && req.user.guardian?.isVerified) {
      await Notification.create({
        recipient: req.user._id,
        type: 'system',
        title: '🌙 Night Gig Proposal Registered',
        message: `Your proposal for night gig "${gig.title}" has been recorded. Guardian safety notifications are armed upon acceptance.`,
      });
    }

    await logAuditEvent({
      user: req.user._id,
      action: 'GIG_APPLICATION_SUBMITTED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gig._id,
      metadata: { proposedRate: application.proposedRate, isNightGig: gig.isNightGig },
    });

    res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// Get My Applications (as applicant)
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

// Get Applications Received for My Gigs (as employer/poster)
const getReceivedApplications = async (req, res, next) => {
  try {
    const myGigs = await Gig.find({ postedBy: req.user._id }).select('_id');
    const gigIds = myGigs.map((g) => g._id);

    const applications = await Application.find({ gig: { $in: gigIds } })
      .populate('gig', 'title budgetMin budgetMax status isNightGig date time')
      .populate('applicant', 'name email rating profileImage bio skills phone isStudent age studentVerificationStatus kycStatus')
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// Update Application Status (Accept / Reject / Complete)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid application status.' });
    }

    const application = await Application.findById(req.params.id).populate('gig');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Verify ownership: only the gig creator can accept/reject/complete
    if (application.gig.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application.' });
    }

    application.status = status;
    await application.save();

    if (status === 'accepted') {
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'assigned',
        assignedTo: application.applicant,
      });

      // Place funds into secure financial ledger (escrow)
      await Earning.create({
        worker: application.applicant,
        employer: req.user._id,
        gig: application.gig._id,
        title: application.gig.title,
        amount: application.proposedRate || application.gig.budgetMin || 500,
        hoursWorked: 3,
        payoutStatus: 'escrow_held',
      });

      // Check if student worker + night gig for Guardian Dispatch
      const applicantUser = await User.findById(application.applicant);
      if (applicantUser && applicantUser.isStudent && applicantUser.guardian?.isVerified && application.gig.isNightGig) {
        await Notification.create({
          recipient: applicantUser._id,
          type: 'system',
          title: '🌙 Night Work Confirmed & Guardian Notified',
          message: `Guardian ${applicantUser.guardian.name} received night work safety details for gig "${application.gig.title}".`,
        });
      }
    } else if (status === 'completed') {
      await Gig.findByIdAndUpdate(application.gig._id, { status: 'completed' });

      // Release Escrow in financial ledger
      await Earning.findOneAndUpdate(
        { gig: application.gig._id, worker: application.applicant },
        { payoutStatus: 'paid', paymentDate: new Date(), escrowReleasedAt: new Date() }
      );
    }

    // Notify Applicant
    await Notification.create({
      recipient: application.applicant,
      sender: req.user._id,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your application for "${application.gig.title}" has been marked as ${status}.`,
      link: '/my-applications',
    });

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

module.exports = {
  applyForGig,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
};
