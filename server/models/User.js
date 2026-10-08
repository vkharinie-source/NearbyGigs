const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/ageCalculator');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: {
      type: String,
      enum: ['customer', 'worker', 'student_worker', 'employer', 'both', 'admin'],
      default: 'customer',
    },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    experience: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ['available_now', 'available_today', 'available_week', 'not_available'],
      default: 'available_today',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.5946, 12.9716] }, // [lon, lat]
      address: { type: String, default: 'Bengaluru, Karnataka' },
    },
    address: { type: String, default: '' },
    rating: { type: Number, default: 5.0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    // ==========================================
    // 1. STUDENT SAFETY & VERIFICATION
    // ==========================================
    isStudent: { type: Boolean, default: false },
    dateOfBirth: { type: Date },
    age: { type: Number },
    college: {
      name: { type: String, default: '' },
      course: { type: String, default: '' },
      year: { type: Number, default: 1 },
      rollNumber: { type: String, default: '' },
      studentIdDocUrl: { type: String, default: '' },
    },
    studentVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    studentVerifiedAt: { type: Date },

    // Parent / Guardian Safety
    guardian: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: 'Parent' },
      isVerified: { type: Boolean, default: false },
      otp: { type: String },
      otpExpires: { type: Date },
      notifiedOnNightGigs: { type: Boolean, default: true },
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, default: 'Emergency Contact' },
      },
    ],

    // ==========================================
    // 2. IDENTITY / AADHAAR PRIVACY (KYC)
    // ==========================================
    kycStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    maskedAadhaar: { type: String, default: '' }, // e.g. XXXX-XXXX-1234 (NEVER raw 12 digits)
    aadhaarHash: { type: String, select: false }, // SHA-256 for duplicate check only
    kycReferenceId: { type: String, default: '' },
    kycVerifiedAt: { type: Date },

    // ==========================================
    // 3. EMPLOYER TRUST & VERIFICATION
    // ==========================================
    employerStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
    },
    companyName: { type: String, default: '' },
    companyRegistration: { type: String, default: '' },
    employerVerifiedAt: { type: Date },

    // ==========================================
    // 4. ACCOUNT SECURITY & PROTECTION
    // ==========================================
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    otpSecret: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ==========================================
    // 5. ACTIVE WORK SESSION (LOCATION PRIVACY)
    // ==========================================
    activeWorkSession: {
      isActive: { type: Boolean, default: false },
      activeGigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig' },
      startedAt: { type: Date },
      lastKnownLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
        address: { type: String, default: '' },
      },
      locationPermissionGranted: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

// Auto-calculate age from DOB before saving
userSchema.pre('save', async function () {
  if (this.dateOfBirth && this.isModified('dateOfBirth')) {
    this.age = calculateAge(this.dateOfBirth);
  }

  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is currently locked due to failed attempts
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);
