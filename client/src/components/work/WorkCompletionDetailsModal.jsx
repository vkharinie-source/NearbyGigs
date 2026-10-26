import React, { useState } from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  User,
  History,
  ShieldAlert,
} from 'lucide-react';
import WorkStatusTimeline from './WorkStatusTimeline';
import './WorkCompletion.css';

const WorkCompletionDetailsModal = ({ application, onClose, onOpenDisputeResponse, onOpenResubmit }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!application) return null;

  const gig = application.gig || {};
  const applicant = application.applicant || {};
  const completion = application.workCompletion || {};
  const twoWay = completion.twoWayConfirmation || {};
  const dispute = completion.disputeDetails || {};
  const correctionHistory = completion.correctionHistory || [];
  const submissionHistory = completion.submissionHistory || [];

  return (
    <div className="work-modal-backdrop" onClick={onClose}>
      <div className="work-modal work-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="work-modal-header">
          <div className="work-modal-header-content">
            <div className="work-modal-icon">
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="work-modal-title">Work Completion Dossier</h3>
              <p className="work-modal-subtitle">
                Two-Party Verification Record & Audit Trail
              </p>
            </div>
          </div>
          <button className="work-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="work-modal-body">
          {/* Timeline */}
          <WorkStatusTimeline
            status={completion.status || 'in_progress'}
            twoWayConfirmation={twoWay}
          />

          {/* Job Info Banner */}
          <div className="work-info-banner">
            <div className="work-info-item">
              <span className="work-info-label">Gig Title</span>
              <span className="work-info-value">{gig.title || 'Job Assignment'}</span>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Assigned Worker</span>
              <span className="work-info-value">{applicant.name || 'Specialist'}</span>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Agreed Budget</span>
              <span className="work-info-value" style={{ color: '#0f766e' }}>
                ₹{application.payment?.amount || gig.budgetMin || 0}
              </span>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Completion Status</span>
              <span className={`work-status-badge status-${completion.status || 'in_progress'}`}>
                {(completion.status || 'in_progress').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Active Work Report */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#ffffff' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
              📝 Submitted Work Report
            </span>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px' }}>
              {completion.taskDescription || 'No description recorded.'}
            </p>

            {/* Checklist */}
            {completion.checklist?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                  Checklist Items:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.35rem', marginTop: '0.35rem' }}>
                  {completion.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        color: item.completed ? '#15803d' : '#64748b',
                      }}
                    >
                      <CheckCircle2 size={14} color={item.completed ? '#16a34a' : '#cbd5e1'} />
                      <span>{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverables */}
            {completion.deliverableLinks?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                  Deliverable Artifacts:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {completion.deliverableLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.65rem',
                        background: '#f0fdfa',
                        border: '1px solid #99f6e4',
                        color: '#0f766e',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>{link.title || 'Open Deliverable'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Before & After Photo Evidence */}
          {((completion.beforePhotos && completion.beforePhotos.length > 0) ||
            (completion.afterPhotos && completion.afterPhotos.length > 0)) && (
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                📸 Submitted Visual Evidence
              </span>
              <div className="comparison-grid">
                <div className="comparison-column">
                  <span className="comparison-title" style={{ color: '#0284c7', display: 'block', marginBottom: '0.5rem' }}>
                    Before Photos ({completion.beforePhotos?.length || 0})
                  </span>
                  {completion.beforePhotos?.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {completion.beforePhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card" onClick={() => setPreviewImage(photo.url)}>
                          <img src={photo.url} alt={photo.caption || 'Before'} />
                          <span className="evidence-thumb-badge before">Before</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None uploaded</span>
                  )}
                </div>

                <div className="comparison-column">
                  <span className="comparison-title" style={{ color: '#16a34a', display: 'block', marginBottom: '0.5rem' }}>
                    After Photos ({completion.afterPhotos?.length || 0})
                  </span>
                  {completion.afterPhotos?.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {completion.afterPhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card" onClick={() => setPreviewImage(photo.url)}>
                          <img src={photo.url} alt={photo.caption || 'After'} />
                          <span className="evidence-thumb-badge after">After</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None uploaded</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Two-Way Confirmation Box */}
          <div className="two-way-box">
            <div className="two-way-header">
              <CheckCircle2 size={18} color="#0f766e" />
              <span>Two-Party Confirmation Status</span>
            </div>
            <div className="party-confirm-grid">
              <div className={`party-confirm-card ${twoWay.workerConfirmed ? 'confirmed' : 'pending'}`}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  WORKER CONFIRMATION
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: twoWay.workerConfirmed ? '#15803d' : '#a16207' }}>
                  {twoWay.workerConfirmed ? '✓ Confirmed by Worker' : '⏳ Awaiting Confirmation'}
                </span>
                {twoWay.workerConfirmedAt && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Timestamp: {new Date(twoWay.workerConfirmedAt).toLocaleString('en-IN')}
                  </span>
                )}
                {twoWay.workerNotes && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
                    "{twoWay.workerNotes}"
                  </p>
                )}
              </div>

              <div className={`party-confirm-card ${twoWay.employerConfirmed ? 'confirmed' : 'pending'}`}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  EMPLOYER CONFIRMATION
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: twoWay.employerConfirmed ? '#15803d' : '#a16207' }}>
                  {twoWay.employerConfirmed ? '✓ Verified & Accepted' : '⏳ Awaiting Verification'}
                </span>
                {twoWay.employerConfirmedAt && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Timestamp: {new Date(twoWay.employerConfirmedAt).toLocaleString('en-IN')}
                  </span>
                )}
                {twoWay.employerNotes && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>
                    "{twoWay.employerNotes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Correction History if any */}
          {correctionHistory.length > 0 && (
            <div style={{ border: '1px solid #fed7aa', borderRadius: '10px', padding: '1rem', background: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                <RotateCcw size={16} />
                <span>Correction Request History ({correctionHistory.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {correctionHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#78350f', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700 }}>Request #{idx + 1}</span>
                      <span>{item.requestedAt ? new Date(item.requestedAt).toLocaleString('en-IN') : ''}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                      "{item.reason}"
                    </p>
                    <span style={{ fontSize: '0.72rem', color: item.status === 'addressed' ? '#15803d' : '#b45309', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                      Status: {item.status?.toUpperCase() || 'OPEN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dispute Notice if open */}
          {dispute && dispute.resolutionStatus && dispute.resolutionStatus !== 'none' && (
            <div style={{ border: '1px solid #fecdd3', borderRadius: '10px', padding: '1rem', background: '#fff1f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#be123c', fontWeight: 700, fontSize: '0.88rem' }}>
                  <ShieldAlert size={18} /> Dispute Case: {dispute.disputeReference || 'Under Review'}
                </span>
                <span className="work-status-badge status-dispute_under_review">
                  {dispute.resolutionStatus.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#881337' }}>
                Grievance: "{dispute.reason}"
              </p>
              {dispute.resolutionDecision && (
                <div style={{ background: '#ffffff', padding: '0.65rem', borderRadius: '6px', border: '1px solid #fda4af' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                    ADMIN RESOLUTION DECISION:
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#0f172a' }}>
                    {dispute.resolutionDecision}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="work-modal-footer">
          <button type="button" className="btn-work-secondary" onClick={onClose}>
            Close
          </button>
          {['correction_requested', 'revision_requested'].includes(completion.status) && onOpenResubmit && (
            <button
              type="button"
              className="btn-work-primary"
              onClick={() => {
                onClose();
                onOpenResubmit(application);
              }}
            >
              <RotateCcw size={16} /> Resubmit Corrected Work
            </button>
          )}
        </div>
      </div>

      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Evidence zoom"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default WorkCompletionDetailsModal;
