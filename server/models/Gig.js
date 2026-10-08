const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    budgetMin: { type: Number, required: true, min: 0 },
    budgetMax: { type: Number, required: true, min: 0 },
    date: { type: String, default: 'Today' },
    time: { type: String, default: 'Flexible' },
    duration: { type: String, default: '2-3 Hours' },
    address: { type: String, default: 'Bengaluru, Karnataka' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    numberOfWorkers: { type: Number, default: 1 },
    additionalRequirements: { type: String },

    // Safety & Verification Enhancements
    isNightGig: { type: Boolean, default: false },
    nightWorkAlertShown: { type: Boolean, default: false },
    isStudentEligible: { type: Boolean, default: true },
    minimumAge: { type: Number, default: 18 },
    safetyRating: { type: Number, default: 5.0 },
    safetyGuidelines: [
      {
        type: String,
        default: 'Always verify employer identity upon arrival and share live work status with your emergency contact.',
      },
    ],
    cancellationPolicy: {
      type: String,
      default: 'Flexible: Full cancellation allowed up to 2 hours before scheduled start.',
    },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gigSchema.index({ location: '2dsphere' });
gigSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Gig', gigSchema);
