const Application = require('../models/Application');
const Gig = require('../models/Gig');
const Notification = require('../models/Notification');

// Apply for a Gig
const applyForGig = async (req, res, next) => {
  try {
    const { gigId, proposal, proposedRate, estimatedTime } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      res.status(404);
      throw new Error('Gig not found');
    }

    if (gig.postedBy.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot apply for your own gig');
    }

    const existingApp = await Application.findOne({ gig: gigId, applicant: req.user._id });
    if (existingApp) {
      res.status(400);
      throw new Error('You have already applied for this gig');
    }

    const application = await Application.create({
      gig: gigId,
      applicant: req.user._id,
      proposal,
      proposedRate: Number(proposedRate) || gig.budgetMin,
      estimatedTime,
    });

    // Send Notification to Gig Poster
    await Notification.create({
      recipient: gig.postedBy,
      sender: req.user._id,
      type: 'application_received',
      title: 'New Application Received',
      message: `${req.user.name} applied for your gig "${gig.title}"`,
      link: '/applications/received',
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
        populate: { path: 'postedBy', select: 'name email profileImage phone' },
      })
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// Get Applications Received for My Gigs
const getReceivedApplications = async (req, res, next) => {
  try {
    const myGigs = await Gig.find({ postedBy: req.user._id }).select('_id');
    const gigIds = myGigs.map(g => g._id);

    const applications = await Application.find({ gig: { $in: gigIds } })
      .populate('gig', 'title budgetMin budgetMax status')
      .populate('applicant', 'name email rating profileImage bio skills phone')
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// Update Application Status (Accept / Reject)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate('gig');

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    if (application.gig.postedBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this application');
    }

    application.status = status;
    await application.save();

    if (status === 'accepted') {
      await Gig.findByIdAndUpdate(application.gig._id, {
        status: 'assigned',
        assignedTo: application.applicant,
      });
    }

    // Notify Applicant
    await Notification.create({
      recipient: application.applicant,
      sender: req.user._id,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your application for "${application.gig.title}" was ${status}`,
      link: '/my-applications',
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
