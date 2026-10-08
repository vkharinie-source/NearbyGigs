const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'escrow_held', 'released', 'paid', 'disputed'],
      default: 'pending',
      index: true,
    },
    transactionReference: {
      type: String,
      default: () => `TXN-NG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    paymentDate: {
      type: Date,
    },
    escrowReleasedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Earning', earningSchema);
