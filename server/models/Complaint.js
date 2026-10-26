const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gig',
      required: false,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    complainantRole: {
      type: String,
      enum: ['customer', 'worker', 'student_worker', 'employer', 'student', 'user', 'admin'],
      default: 'customer',
      required: true,
    },
    reportedParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'worker_did_not_arrive',
        'worker_no_show',
        'unexpected_cancellation',
        'work_quality_mismatch',
        'skills_qualifications_inaccurate',
        'inaccurate_skills_qualifications',
        'unprofessional_behaviour',
        'unprofessional_behavior',
        'harassment_or_inappropriate_communication',
        'harassment_inappropriate',
        'payment_dispute',
        'work_schedule_timing_issue',
        'schedule_timing_issue',
        'safety_concern',
        'misleading_job_description',
        'incomplete_work',
        'property_damage',
        'suspected_fraud',
        'other',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    incidentDate: {
      type: Date,
      default: Date.now,
    },
    evidence: [
      {
        title: { type: String, default: 'Attachment' },
        url: { type: String, default: '' },
        fileUrl: { type: String, default: '' },
        fileType: { type: String, default: 'link' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    desiredResolution: {
      type: String,
      enum: [
        'replacement_worker',
        'work_corrected',
        'work_correction',
        'payment_refund_or_adjustment',
        'refund',
        'schedule_clarification',
        'clarification',
        'warning_or_penalty_to_reported_party',
        'policy_warning',
        'safety_investigation',
        'investigation',
        'formal_apology',
        'other',
      ],
      default: 'work_correction',
    },
    desiredResolutionNotes: {
      type: String,
      default: '',
    },
    urgency: {
      type: String,
      enum: ['critical_safety', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },

    // Reviewer & Routing
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedToName: {
      type: String,
      default: 'Support Review Team',
    },
    isIndependentReview: {
      type: Boolean,
      default: false,
    },

    // Lifecycle Status Workflow
    status: {
      type: String,
      enum: [
        'submitted',
        'acknowledged',
        'assigned',
        'under_investigation',
        'awaiting_information',
        'resolution_proposed',
        'resolved',
        'closed',
        'escalated',
        'reopened',
        'rejected',
      ],
      default: 'submitted',
      index: true,
    },

    // Time-Bound SLA Targets
    acknowledgementDeadline: {
      type: Date,
      required: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    resolutionDeadline: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
    },
    escalationReason: {
      type: String,
      default: '',
    },

    // Investigation & Audit
    investigationNotes: [
      {
        note: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        authorName: { type: String },
        isInternalOnly: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolutionSummary: {
      type: String,
      default: '',
    },
    correctiveAction: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reopenReason: {
      type: String,
      default: '',
    },
    // Two-Way Dispute Statements & Admin Review Trail
    workerStatement: {
      text: { type: String, default: '' },
      evidence: [
        {
          title: { type: String, default: 'Worker Proof' },
          url: { type: String, default: '' },
          fileType: { type: String, default: 'image' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      submittedAt: { type: Date },
    },
    employerStatement: {
      text: { type: String, default: '' },
      evidence: [
        {
          title: { type: String, default: 'Employer Proof' },
          url: { type: String, default: '' },
          fileType: { type: String, default: 'image' },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      submittedAt: { type: Date },
    },
    adminActions: [
      {
        actionType: {
          type: String,
          enum: [
            'info_requested',
            'status_updated',
            'resolution_approved',
            'correction_ordered',
            'case_closed',
            'case_reopened',
            'internal_note',
          ],
          default: 'status_updated',
        },
        notes: { type: String, default: '' },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        performedByName: { type: String, default: 'Admin' },
        performedAt: { type: Date, default: Date.now },
      },
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedByName: { type: String },
        notes: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

complaintSchema.virtual('referenceNumber').get(function () {
  return this.complaintId;
});

complaintSchema.virtual('relatedGig').get(function () {
  return this.gig;
});

complaintSchema.virtual('reportedUser').get(function () {
  return this.reportedParty;
});

complaintSchema.virtual('sla').get(function () {
  return {
    acknowledgementTarget: this.acknowledgementDeadline,
    resolutionTarget: this.resolutionDeadline,
    acknowledgedAt: this.acknowledgedAt,
    resolvedAt: this.resolutionDate,
    isOverdue: this.isOverdue,
  };
});

complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ status: 1, resolutionDeadline: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
