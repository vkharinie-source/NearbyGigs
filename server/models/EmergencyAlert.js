const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activeGig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, default: '' },
    },
    locationPermissionGranted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESPONDED', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
    guardianNotified: {
      type: Boolean,
      default: false,
    },
    adminNotified: {
      type: Boolean,
      default: true,
    },
    contactsNotifiedCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
