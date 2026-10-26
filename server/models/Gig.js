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
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'draft', 'paused', 'closed'],
      default: 'open',
    },
    jobType: {
      type: String,
      enum: ['On-site', 'Remote', 'Hybrid'],
      default: 'On-site',
    },
    salaryType: {
      type: String,
      enum: ['Hourly', 'Fixed', 'Monthly'],
      default: 'Fixed',
    },
    workDate: { type: Date },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    recurringSchedule: { type: String, default: 'One-time' },
    deadline: { type: Date },
    requiredExperience: { type: Number, default: 0 },
    numberOfWorkers: { type: Number, default: 1 },
    additionalRequirements: { type: String },
    evidenceRequirements: [{ type: String }], // e.g. 'portfolio', 'task_checklist', 'completion_photos', 'deliverable_link'
    attendanceMethod: {
      type: String,
      enum: ['otp', 'qr_code', 'manual_confirmation', 'none'],
      default: 'otp',
    },
    applicantsCount: { type: Number, default: 0 },
    savedByCount: { type: Number, default: 0 },

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
