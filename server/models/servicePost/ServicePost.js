const mongoose = require('mongoose');

const servicePostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lon, lat]
  },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open','filled','closed'], default: 'open' }
}, { timestamps: true });

servicePostSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServicePost', servicePostSchema);
