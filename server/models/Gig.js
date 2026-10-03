const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    date: { type: String },
    time: { type: String },
    duration: { type: String },
    address: { type: String },
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
  },
  { timestamps: true }
);

gigSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Gig', gigSchema);
