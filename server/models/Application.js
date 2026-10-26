const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    proposal: { type: String, required: true },
    proposedRate: { type: Number, required: true },
    estimatedTime: { type: String, default: '2-3 Hours' },

    // Core Application Status
    status: {
      type: String,
      enum: [
        'pending',
        'submitted',
        'under_review',
        'shortlisted',
        'accepted',
        'rejected',
        'withdrawn',
        'cancelled',
        'completed',
      ],
      default: 'submitted',
      index: true,
    },

    // =========================================================================
    // 7A. Section A: Proof of Skills and Suitability Before Selection
    // =========================================================================
    suitabilityProof: {
      coverMessage: { type: String, default: '' },
      portfolioLinks: [
        {
          title: { type: String, default: 'Portfolio' },
          url: { type: String, required: true },
        },
      ],
      certifications: [
        {
          name: { type: String, required: true },
          issuer: { type: String, default: '' },
          url: { type: String, default: '' },
          verificationStatus: {
            type: String,
            enum: ['submitted', 'reviewed', 'verified', 'rejected'],
            default: 'submitted',
          },
        },
      ],
      references: [
        {
          name: { type: String },
          contact: { type: String },
          relation: { type: String },
        },
      ],
      availabilityConfirmed: { type: Boolean, default: true },
    },

    // =========================================================================
    // 7A. Section B: Worker Commitment Confirmation
    // =========================================================================
    commitment: {
      status: {
        type: String,
        enum: [
          'not_applicable',
          'awaiting_worker_confirmation',
          'confirmed',
          'declined',
          'cancellation_requested',
          'cancelled',
          'completed',
        ],
        default: 'not_applicable',
        index: true,
      },
      workerConfirmedAt: { type: Date },
      workerConfirmationNotes: { type: String, default: '' },
      declinedReason: { type: String, default: '' },
      clarificationRequested: { type: String, default: '' },
      cancellationReason: { type: String, default: '' },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledAt: { type: Date },
    },

    // =========================================================================
    // 7A. Section C: Attendance Proof for On-Site Work
    // =========================================================================
    attendance: {
      method: {
        type: String,
        enum: ['otp', 'qr_code', 'manual_confirmation', 'remote_deliverable'],
        default: 'otp',
      },
      otpCode: { type: String, select: false },
      otpExpiresAt: { type: Date, select: false },
      qrToken: { type: String, select: false },
      qrExpiresAt: { type: Date, select: false },
      status: {
        type: String,
        enum: [
          'not_checked_in',
          'checkin_pending',
          'attendance_verified',
          'attendance_disputed',
          'absent',
          'checkout_recorded',
          'completed',
        ],
        default: 'not_checked_in',
        index: true,
      },
      checkInTime: { type: Date },
      checkInLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
        address: { type: String, default: '' },
      },
      checkOutTime: { type: Date },
      disputeReason: { type: String, default: '' },
      disputedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      disputedAt: { type: Date },
      manualOverrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      manualOverrideReason: { type: String, default: '' },
    },

    // =========================================================================
    // 7A. Section D & E: Proof of Work Completion & Two-Way Verification
    // =========================================================================
    workCompletion: {
      status: {
        type: String,
        enum: [
          'work_not_started',
          'in_progress',
          'submitted_for_review',
          'completion_submitted', // backward compat
          'under_review',
          'correction_requested',
          'revision_requested', // backward compat
          'resubmitted_for_review',
          'dispute_under_review',
          'disputed', // backward compat
          'completed_confirmed',
          'approved', // backward compat
          'completed', // backward compat
          'cancelled',
        ],
        default: 'work_not_started',
        index: true,
      },
      taskDescription: { type: String, default: '' },
      deliverableLinks: [
        {
          title: { type: String, default: 'Deliverable' },
          url: { type: String, required: true },
        },
      ],
      checklist: [
        {
          task: { type: String, required: true },
          completed: { type: Boolean, default: false },
        },
      ],
      beforePhotos: [
        {
          url: { type: String, required: true },
          caption: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      afterPhotos: [
        {
          url: { type: String, required: true },
          caption: { type: String, default: '' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      evidence: [
        {
          title: { type: String, default: 'Evidence Document' },
          url: { type: String, required: true },
          fileType: { type: String, default: 'image' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      submissionHistory: [
        {
          submissionNumber: { type: Number, default: 1 },
          taskDescription: { type: String, default: '' },
          deliverableLinks: { type: Array, default: [] },
          beforePhotos: { type: Array, default: [] },
          afterPhotos: { type: Array, default: [] },
          evidence: { type: Array, default: [] },
          submittedAt: { type: Date, default: Date.now },
          notes: { type: String, default: '' },
        },
      ],
      correctionHistory: [
        {
          reason: { type: String, required: true },
          notes: { type: String, default: '' },
          evidence: { type: Array, default: [] },
          requestedAt: { type: Date, default: Date.now },
          requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          status: { type: String, enum: ['open', 'addressed', 'waived'], default: 'open' },
        },
      ],
      twoWayConfirmation: {
        workerConfirmed: { type: Boolean, default: false },
        workerConfirmedAt: { type: Date },
        workerNotes: { type: String, default: '' },
        employerConfirmed: { type: Boolean, default: false },
        employerConfirmedAt: { type: Date },
        employerNotes: { type: String, default: '' },
        workerConcern: { type: String, default: '' },
        workerConcernAt: { type: Date },
      },
      disputeDetails: {
        disputeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
        disputeReference: { type: String, default: '' },
        raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        raisedByRole: { type: String, enum: ['employer', 'worker', 'admin'] },
        reason: { type: String, default: '' },
        evidence: [
          {
            title: { type: String, default: 'Proof' },
            url: { type: String, default: '' },
          },
        ],
        raisedAt: { type: Date },
        workerResponse: { type: String, default: '' },
        workerResponseEvidence: [
          {
            title: { type: String, default: 'Proof' },
            url: { type: String, default: '' },
          },
        ],
        workerRespondedAt: { type: Date },
        employerResponse: { type: String, default: '' },
        employerRespondedAt: { type: Date },
        adminNotes: { type: String, default: '' },
        resolutionStatus: {
          type: String,
          enum: ['none', 'open', 'awaiting_response', 'resolved', 'reopened'],
          default: 'none',
        },
        resolutionDecision: { type: String, default: '' },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        resolvedAt: { type: Date },
      },
      ratings: {
        workerRated: { type: Boolean, default: false },
        workerRatingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
        employerRated: { type: Boolean, default: false },
        employerRatingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
      },
      submittedAt: { type: Date },
      employerFeedback: { type: String, default: '' },
      revisionNotes: { type: String, default: '' },
      disputeNotes: { type: String, default: '' },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // =========================================================================
    // Employer Complete Job Instructions (Section 10)
    // =========================================================================
    jobInstructions: {
      confirmedDate: { type: String, default: '' },
      startTime: { type: String, default: '' },
      endTime: { type: String, default: '' },
      agreedPayment: { type: Number, default: 0 },
      paymentType: { type: String, enum: ['Fixed', 'Hourly', 'Monthly'], default: 'Fixed' },
      responsibilities: { type: String, default: '' },
      workLocation: { type: String, default: '' },
      arrivalInstructions: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      safetyInstructions: { type: String, default: '' },
      attendanceMethod: {
        type: String,
        enum: ['otp', 'qr_code', 'manual_confirmation', 'remote_deliverable'],
        default: 'otp',
      },
      completionRequirements: { type: String, default: '' },
      providedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending_instructions', 'provided'],
        default: 'pending_instructions',
      },
    },

    // =========================================================================
    // 7A. Section G: Job Payment & Financial Tracking
    // =========================================================================
    payment: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: [
          'payment_not_initiated',
          'payment_pending',
          'payment_processing',
          'paid',
          'payment_failed',
          'payment_disputed',
          'refund_pending',
        ],
        default: 'payment_not_initiated',
        index: true,
      },
      earningRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'Earning' },
      transactionReference: { type: String, default: '' },
      paidAt: { type: Date },
      history: [
        {
          status: { type: String, required: true },
          amount: { type: Number, default: 0 },
          note: { type: String, default: '' },
          timestamp: { type: Date, default: Date.now },
          recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ],
    },
  },
  { timestamps: true }
);

applicationSchema.index({ gig: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
