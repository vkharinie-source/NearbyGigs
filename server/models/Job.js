const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Part-time',
      'Internship',
      'Weekend',
      'Evening',
      'Freelance',
      'Campus',
      'Temporary',
      'Hourly',
      'Remote',
      'Other'
    ]
  },
  jobType: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  salary: {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Hourly', 'Fixed', 'Monthly'], default: 'Hourly' }
  },
  requirements: [{ type: String }],
  
  // Geospatial Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      default: [0, 0]
    },
    formattedAddress: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['open', 'closed', 'filled'],
    default: 'open'
  },
  applicantsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Create a 2dsphere index for geospatial queries
jobSchema.index({ location: '2dsphere' });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
