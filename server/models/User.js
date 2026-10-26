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
      enum: ['customer', 'worker', 'student_worker', 'employer', 'both', 'admin', 'teacher'],
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

    // ==========================================
    // 6. ONBOARDING & EXTENDED PROFILES
    // ==========================================
    purpose: {
      type: String,
      enum: ['find_work', 'post_jobs', 'offer_services', 'both'],
      default: 'find_work',
    },
    userType: {
      type: String,
      enum: ['school_student', 'college_student', 'graduate', 'professional', 'teacher', 'employer', 'both'],
      default: 'professional',
    },
    onboardingCompleted: { type: Boolean, default: false },
    country: { type: String, default: 'India' },

    // School Student Specific Safeguards
    school: {
      name: { type: String, default: '' },
      grade: { type: String, default: '' },
      daytimeAvailability: { type: String, default: 'After School (3 PM - 7 PM)' },
      generalServiceArea: { type: String, default: '' },
      parentConsentVerified: { type: Boolean, default: false },
      parentConsentApprovedAt: { type: Date },
    },

    // Graduate or Unemployed Job Seeker Profile
    graduate: {
      degree: { type: String, default: '' },
      university: { type: String, default: '' },
      graduationYear: { type: Number },
      degreeDocUrl: { type: String, default: '' },
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected', 'additional_info_required'],
        default: 'unverified',
      },
      verifiedAt: { type: Date },
    },

    // Teacher or Tutor Profile
    teacher: {
      subjects: [{ type: String }],
      grades: [{ type: String }],
      qualifications: [{ type: String }],
      teachingExperience: { type: Number, default: 0 },
      credentialsDocUrl: { type: String, default: '' },
      teachingMode: { type: String, enum: ['online', 'in_person', 'both'], default: 'both' },
      languages: [{ type: String }],
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected', 'additional_info_required'],
        default: 'unverified',
      },
      verifiedAt: { type: Date },
    },

    // Professional Worker Profile
    professionalVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected', 'additional_info_required'],
      default: 'unverified',
    },
    professionalVerifiedAt: { type: Date },
    certifications: [{ type: String }],
    portfolioLinks: [{ type: String }],
    expectedRate: { type: Number, default: 0 },
    rateType: { type: String, enum: ['Hourly', 'Fixed', 'Monthly'], default: 'Hourly' },
    workArea: { type: String, default: '' },

    // Generic Document Submissions & Audit
    documents: [
      {
        docType: { type: String, required: true },
        fileName: { type: String, required: true },
        fileUrl: { type: String, default: '' },
        fileSize: { type: String, default: '' },
        status: {
          type: String,
          enum: ['not_submitted', 'submitted', 'pending', 'verified', 'rejected', 'additional_info_required'],
          default: 'pending',
        },
        submittedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date },
        rejectionReason: { type: String, default: '' },
      },
    ],

    // Employer / Business Category
    businessCategory: { type: String, default: '' },
    businessLocation: { type: String, default: '' },

    // Bookmarked / Saved Gigs
    savedGigs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gig' }],
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
