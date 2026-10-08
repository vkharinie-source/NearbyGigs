const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['gig', 'employer', 'worker', 'message', 'other'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetTitle: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'fraud_or_scam',
        'safety_concern',
        'harassment',
        'inappropriate_content',
        'suspicious_employer',
        'underage_violation',
        'payment_refusal',
        'other',
      ],
    },
    details: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actionTaken: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
