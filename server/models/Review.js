const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    role: { type: String, enum: ['worker', 'employer'], default: 'worker' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ application: 1, reviewer: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
