const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    startingPrice: { type: Number, required: true },
    availability: {
      type: String,
      enum: ['available_now', 'available_today', 'available_week', 'custom'],
      default: 'available_today',
    },
    serviceAreaKm: { type: Number, default: 10 },
    address: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    photos: [{ type: String }],
  },
  { timestamps: true }
);

serviceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Service', serviceSchema);
