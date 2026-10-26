import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import './WorkCompletion.css';

const WorkStatusTimeline = ({ status, twoWayConfirmation }) => {
  // Map server status to timeline progression
  // Statuses: 'work_not_started' | 'in_progress' | 'submitted_for_review' | 'correction_requested' | 'resubmitted_for_review' | 'dispute_under_review' | 'completed_confirmed'

  const isApproved = true;
  const isInProgress = ['in_progress', 'submitted_for_review', 'resubmitted_for_review', 'correction_requested', 'dispute_under_review', 'completed_confirmed', 'completed'].includes(status);
  const isSubmitted = ['submitted_for_review', 'resubmitted_for_review', 'correction_requested', 'dispute_under_review', 'completed_confirmed', 'completed'].includes(status);
  const isCorrection = ['correction_requested', 'revision_requested'].includes(status);
  const isDispute = ['dispute_under_review', 'disputed'].includes(status);
  const isCompleted = ['completed_confirmed', 'completed'].includes(status);

  // Compute percentage progress for bar
  let progressPct = 25;
  if (isCompleted) progressPct = 100;
  else if (isDispute || isCorrection) progressPct = 75;
  else if (isSubmitted) progressPct = 65;
  else if (isInProgress) progressPct = 40;

  return (
    <div style={{ width: '100%', margin: '0.75rem 0' }}>
      <div className="timeline-container">
        <div className="timeline-line">
          <div
            className="timeline-line-progress"
            style={{
              width: `${progressPct}%`,
              background: isDispute ? '#e11d48' : isCorrection ? '#d97706' : '#0f766e',
            }}
          />
        </div>

        {/* Step 1: Approved */}
        <div className={`timeline-step ${isApproved ? 'completed' : ''}`}>
          <div className="timeline-node">
            <CheckCircle2 size={18} />
          </div>
          <span className="timeline-label">1. Job Approved</span>
        </div>

        {/* Step 2: In Progress */}
        <div className={`timeline-step ${isInProgress ? 'completed' : ''}`}>
          <div className="timeline-node">
            <Clock size={18} />
          </div>
          <span className="timeline-label">2. In Progress</span>
        </div>

        {/* Step 3: Submitted */}
        <div
          className={`timeline-step ${
            isSubmitted ? (isCorrection ? 'warning' : isDispute ? 'danger' : 'completed') : ''
          }`}
        >
          <div className="timeline-node">
            <FileCheck size={18} />
          </div>
          <span className="timeline-label">
            {status === 'resubmitted_for_review' ? 'Resubmitted' : '3. Work Submitted'}
          </span>
        </div>

        {/* Step 4: Verification / Dispute */}
        <div
          className={`timeline-step ${
            isCompleted
              ? 'completed'
              : isDispute
              ? 'danger'
              : isCorrection
              ? 'warning'
              : isSubmitted
              ? 'active'
              : ''
          }`}
        >
          <div className="timeline-node">
            {isDispute ? (
              <AlertTriangle size={18} />
            ) : isCorrection ? (
              <RotateCcw size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
          <span className="timeline-label">
            {isDispute
              ? 'Dispute Under Review'
              : isCorrection
              ? 'Correction Requested'
              : '4. Employer Verification'}
          </span>
        </div>

        {/* Step 5: Confirmed */}
        <div className={`timeline-step ${isCompleted ? 'completed' : ''}`}>
          <div className="timeline-node">
            <CheckCircle2 size={18} />
          </div>
          <span className="timeline-label">5. Completed & Confirmed</span>
        </div>
      </div>

      {/* Two-Way Confirmation Badges */}
      {twoWayConfirmation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '0.25rem',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {twoWayConfirmation.workerConfirmed ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <Clock size={14} color="#ca8a04" />
            )}
            Worker Confirmed:{' '}
            <strong style={{ color: twoWayConfirmation.workerConfirmed ? '#16a34a' : '#0f172a' }}>
              {twoWayConfirmation.workerConfirmed ? 'YES' : 'Pending'}
            </strong>
          </span>

          <span style={{ color: '#cbd5e1' }}>•</span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {twoWayConfirmation.employerConfirmed ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <Clock size={14} color="#ca8a04" />
            )}
            Employer Confirmed:{' '}
            <strong style={{ color: twoWayConfirmation.employerConfirmed ? '#16a34a' : '#0f172a' }}>
              {twoWayConfirmation.employerConfirmed ? 'YES' : 'Pending'}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default WorkStatusTimeline;
