const Review = require('../models/Review');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a review for completed work
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  const { gigId, jobId, applicationId, targetUserId, rating, comment } = req.body;

  try {
    const fromUserId = req.user._id;
    let toUserId = targetUserId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Written review feedback is required.' });
    }

    let application = null;
    if (applicationId) {
      application = await Application.findById(applicationId).populate('gig');
      if (!application) {
        return res.status(404).json({ success: false, message: 'Associated application not found.' });
      }

      // Ensure work is completed and confirmed
      const isConfirmed =
        ['completed_confirmed', 'completed'].includes(application.workCompletion?.status) ||
        application.status === 'completed';

      if (!isConfirmed) {
        return res.status(400).json({
          success: false,
          message: 'Reviews are only permitted after the job has been completed and confirmed by both parties.',
        });
      }

      // Check for duplicate review by this user on this application
      const existingReview = await Review.findOne({
        application: applicationId,
        reviewer: fromUserId,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted an eligible review for this completed job.',
        });
      }

      // Infer target user if not specified
      const isWorker = application.applicant.toString() === fromUserId.toString();
      if (!toUserId) {
        toUserId = isWorker ? application.gig.postedBy : application.applicant;
      }
    }

    if (!toUserId) {
      return res.status(400).json({ success: false, message: 'Target user is required for review.' });
    }

    if (toUserId.toString() === fromUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    const isWorkerReviewer = application && application.applicant.toString() === fromUserId.toString();

    const review = new Review({
      reviewer: fromUserId,
      fromUser: fromUserId,
      targetUser: toUserId,
      toUser: toUserId,
      gig: gigId || (application ? application.gig._id : undefined),
      job: jobId,
      application: applicationId || undefined,
      role: isWorkerReviewer ? 'worker' : 'employer',
      rating: Number(rating),
      comment: comment.trim(),
    });

    await review.save();

    // Update target user's average rating
    const reviews = await Review.find({
      $or: [{ targetUser: toUserId }, { toUser: toUserId }],
    });
    const user = await User.findById(toUserId);
    if (user && reviews.length > 0) {
      const avg = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
      user.rating = parseFloat(avg.toFixed(1));
      await user.save();
    }

    // Update Application ratings flags
    if (application) {
      if (!application.workCompletion.ratings) {
        application.workCompletion.ratings = {};
      }
      if (isWorkerReviewer) {
        application.workCompletion.ratings.workerRated = true;
        application.workCompletion.ratings.workerRatingId = review._id;
      } else {
        application.workCompletion.ratings.employerRated = true;
        application.workCompletion.ratings.employerRatingId = review._id;
      }
      await application.save();
    }

    // Send notification to recipient
    await Notification.create({
      recipient: toUserId,
      sender: fromUserId,
      type: 'review_received',
      title: '⭐ New Rating & Feedback Received!',
      message: `${req.user.name} rated you ${rating} stars: "${comment.trim().substring(0, 100)}"`,
      link: '/profile',
    });

    res.status(201).json({ success: true, message: 'Review submitted successfully.', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId;
    const reviews = await Review.find({
      $or: [{ targetUser: userId }, { toUser: userId }],
    })
      .populate('reviewer', 'name profileImage email')
      .populate('fromUser', 'name profileImage email')
      .populate('gig', 'title category')
      .populate('job', 'title category')
      .sort({ createdAt: -1 });

    // Normalize review objects for cleaner frontend consumption
    const normalized = reviews.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewerName: r.reviewer?.name || r.fromUser?.name || 'Verified Client',
      reviewerImage: r.reviewer?.profileImage || r.fromUser?.profileImage || null,
      gigTitle: r.gig?.title || r.job?.title || null,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getUserReviews };
