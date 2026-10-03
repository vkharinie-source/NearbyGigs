const Review = require('../models/Review');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  const { gigId, jobId, targetUserId, rating, comment } = req.body;

  try {
    const fromUserId = req.user._id;
    const toUserId = targetUserId;

    if (!toUserId) {
      return res.status(400).json({ message: 'Target user is required for review' });
    }

    const review = new Review({
      reviewer: fromUserId,
      fromUser: fromUserId,
      targetUser: toUserId,
      toUser: toUserId,
      gig: gigId,
      job: jobId,
      rating: Number(rating),
      comment,
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

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
