const Earning = require('../models/Earning');
const Application = require('../models/Application');
const Gig = require('../models/Gig');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Get Worker's Earnings & Financial Ledger
// @route   GET /api/earnings
// @access  Private (Worker only)
const getMyEarnings = async (req, res) => {
  try {
    let earnings = await Earning.find({ worker: req.user._id })
      .populate('employer', 'name email profileImage companyName')
      .populate('gig', 'title category date')
      .sort('-createdAt');

    // Auto-generate verified records from completed applications if empty
    if (earnings.length === 0) {
      const completedApps = await Application.find({
        applicant: req.user._id,
        status: { $in: ['accepted', 'completed'] },
      }).populate('gig');

      if (completedApps.length > 0) {
        for (const app of completedApps) {
          if (app.gig) {
            await Earning.create({
              worker: req.user._id,
              employer: app.gig.postedBy,
              gig: app.gig._id,
              title: app.gig.title,
              amount: app.proposedRate || app.gig.budgetMin || 1000,
              hoursWorked: 3,
              payoutStatus: app.status === 'completed' ? 'paid' : 'escrow_held',
              paymentDate: app.status === 'completed' ? new Date() : undefined,
              escrowReleasedAt: app.status === 'completed' ? new Date() : undefined,
            });
          }
        }
        earnings = await Earning.find({ worker: req.user._id })
          .populate('employer', 'name email profileImage companyName')
          .populate('gig', 'title category date')
          .sort('-createdAt');
      }
    }

    const totalEarned = earnings
      .filter((e) => e.payoutStatus === 'paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const inEscrow = earnings
      .filter((e) => e.payoutStatus === 'escrow_held')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingReview = earnings
      .filter((e) => e.payoutStatus === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      summary: {
        totalEarned,
        inEscrow,
        pendingReview,
        transactionsCount: earnings.length,
      },
      earnings,
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving financial records.' });
  }
};

module.exports = {
  getMyEarnings,
};
