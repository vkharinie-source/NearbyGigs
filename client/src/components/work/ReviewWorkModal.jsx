import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  User,
  Star,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  BadgeCheck,
  Phone,
  Mail,
  Clock,
  Sparkles,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import WorkStatusTimeline from './WorkStatusTimeline';
import './WorkCompletion.css';

const ReviewWorkModal = ({ application, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('accept'); // 'accept' | 'request_correction' | 'raise_dispute'
  const [feedback, setFeedback] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const gig = application?.gig || {};
  const applicant = application?.applicant || {};
  const completion = application?.workCompletion || {};
  const twoWay = completion?.twoWayConfirmation || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'request_correction' && !reason.trim() && !feedback.trim()) {
      setError('Please provide a clear reason explaining what needs to be corrected.');
      return;
    }

    if (activeTab === 'raise_dispute' && !reason.trim() && !feedback.trim()) {
      setError('Please provide a documented reason for opening a dispute.');
      return;
    }

    setLoading(true);
    try {
      const evidence = evidenceUrl.trim()
        ? [{ title: 'Employer Supporting Proof', url: evidenceUrl.trim() }]
        : [];

      await applicationService.reviewWorkCompletion(application._id, {
        decision: activeTab,
        reason: reason.trim() || feedback.trim(),
        feedback: feedback.trim(),
        evidence,
      });

      onSuccess(
        activeTab === 'accept'
          ? '✓ Work accepted and confirmed! Escrow payment has been released to the worker.'
          : activeTab === 'request_correction'
          ? 'Correction request has been dispatched to the worker.'
          : 'Dispute has been formally opened and referred for admin mediation.'
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const submissionDateFormatted = completion?.submittedAt
    ? new Date(completion.submittedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recently';

  return (
    <div className="work-modal-backdrop" onClick={onClose}>
      <div className="work-modal work-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="work-modal-header">
          <div className="work-modal-header-content">
            <div className="work-modal-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="work-modal-title">Review Completed Work</h3>
              <p className="work-modal-subtitle">
                Two-Party Work Verification & Payment Release
              </p>
            </div>
          </div>
          <button className="work-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="work-modal-body">
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecdd3',
                color: '#991b1b',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Timeline */}
          <WorkStatusTimeline
            status={completion.status || 'submitted_for_review'}
            twoWayConfirmation={twoWay}
          />

          {/* Job & Worker Dossier Header */}
          <div className="work-info-banner">
            <div className="work-info-item">
              <span className="work-info-label">Job Title & Reference</span>
              <span className="work-info-value">{gig.title || 'Nearby Gig'}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                ID: {gig._id ? String(gig._id).substring(0, 10) + '...' : 'N/A'}
              </span>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Assigned Worker</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                <span className="work-info-value">{applicant.name || 'Verified Specialist'}</span>
                {applicant.verified && (
                  <BadgeCheck size={16} color="#0f766e" title="Aadhaar KYC Verified" />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                <Star size={12} fill="#eab308" color="#eab308" />
                <span>{applicant.rating || 5.0} Rating</span>
                {applicant.phone && <span>• {applicant.phone}</span>}
              </div>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Agreed Compensation</span>
              <span className="work-info-value" style={{ color: '#0f766e', fontSize: '1.1rem' }}>
                ₹{application.payment?.amount || gig.budgetMin || 0}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Status: {application.payment?.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING VERIFICATION'}
              </span>
            </div>
            <div className="work-info-item">
              <span className="work-info-label">Work Schedule & Location</span>
              <span className="work-info-value">{gig.location?.address || 'Hyperlocal On-Site'}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Submitted: {submissionDateFormatted}
              </span>
            </div>
          </div>

          {/* Original Requirements & Agreement */}
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Original Job Agreement & Requirements
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
              {gig.description || 'Deliver scheduled services in accordance with agreed specifications.'}
            </p>
          </div>

          {/* Worker Completion Submission */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={16} color="#0f766e" /> Worker's Completion Report
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Submitted at {submissionDateFormatted}
              </span>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #f1f5f9', whiteSpace: 'pre-wrap', margin: 0 }}>
              {completion.taskDescription || 'Worker confirmed completion of scheduled tasks.'}
            </p>

            {/* Checklist items */}
            {completion.checklist?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Submitted Checklist:
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
                      <CheckCircle size={14} color={item.completed ? '#16a34a' : '#cbd5e1'} />
                      <span>{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverable External Links */}
            {completion.deliverableLinks?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Deliverable Artifacts / Links:
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
                        padding: '0.35rem 0.75rem',
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

          {/* Before & After Comparison Photos Gallery */}
          {((completion.beforePhotos && completion.beforePhotos.length > 0) ||
            (completion.afterPhotos && completion.afterPhotos.length > 0)) && (
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                📸 Visual Evidence Comparison (Click to Inspect)
              </span>
              <div className="comparison-grid">
                {/* Before Photos */}
                <div className="comparison-column">
                  <span className="comparison-title" style={{ color: '#0284c7', display: 'block', marginBottom: '0.5rem' }}>
                    Before Starting ({completion.beforePhotos?.length || 0})
                  </span>
                  {completion.beforePhotos?.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {completion.beforePhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card" onClick={() => setPreviewImage(photo.url)}>
                          <img src={photo.url} alt={photo.caption || 'Before proof'} />
                          <span className="evidence-thumb-badge before">Before</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No before photos provided
                    </div>
                  )}
                </div>

                {/* After Photos */}
                <div className="comparison-column">
                  <span className="comparison-title" style={{ color: '#16a34a', display: 'block', marginBottom: '0.5rem' }}>
                    Finished Deliverables ({completion.afterPhotos?.length || 0})
                  </span>
                  {completion.afterPhotos?.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {completion.afterPhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card" onClick={() => setPreviewImage(photo.url)}>
                          <img src={photo.url} alt={photo.caption || 'After proof'} />
                          <span className="evidence-thumb-badge after">After</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      No after photos provided
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Tabs: Accept / Request Correction / Raise Dispute */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
              Select Verification Action:
            </span>

            <div className="review-actions-bar">
              <button
                type="button"
                className={`action-tab-btn accept ${activeTab === 'accept' ? 'active' : ''}`}
                onClick={() => setActiveTab('accept')}
              >
                <CheckCircle size={18} />
                <span>Accept Work</span>
              </button>

              <button
                type="button"
                className={`action-tab-btn correct ${activeTab === 'request_correction' ? 'active' : ''}`}
                onClick={() => setActiveTab('request_correction')}
              >
                <RotateCcw size={18} />
                <span>Request Correction</span>
              </button>

              <button
                type="button"
                className={`action-tab-btn dispute ${activeTab === 'raise_dispute' ? 'active' : ''}`}
                onClick={() => setActiveTab('raise_dispute')}
              >
                <AlertTriangle size={18} />
                <span>Raise a Dispute</span>
              </button>
            </div>

            {/* Dynamic Form for Selected Action */}
            <div style={{ marginTop: '1rem' }}>
              {activeTab === 'accept' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <CheckCircle size={18} />
                    <span>Confirm Acceptance & Release Payment</span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#166534' }}>
                    By accepting, you confirm that the worker has completed the agreed requirements. Both parties will be marked as confirmed, the job will transition to <strong>Completed & Confirmed</strong>, and payment of <strong>₹{application.payment?.amount || 0}</strong> will be released to the worker.
                  </p>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#15803d', marginBottom: '0.25rem' }}>
                    Complimentary Feedback / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. Excellent work, on time, highly professional..."
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #86efac', fontSize: '0.88rem' }}
                  />
                </div>
              )}

              {activeTab === 'request_correction' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <RotateCcw size={18} />
                    <span>Request Correction from Worker</span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#92400e' }}>
                    Specify clearly what needs to be fixed or adjusted. The worker will receive an instant notification and can make the adjustments before resubmitting.
                  </p>

                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#78350f', marginBottom: '0.25rem' }}>
                    Correction Reason <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe specific items that need to be corrected or redone..."
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '0.88rem', marginBottom: '0.5rem' }}
                  />

                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#78350f', marginBottom: '0.25rem' }}>
                    Optional Proof Photo URL
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://... photo pointing out area needing correction"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #fcd34d', fontSize: '0.88rem' }}
                  />
                </div>
              )}

              {activeTab === 'raise_dispute' && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be123c', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <AlertTriangle size={18} />
                    <span>Open Formal Mediation Dispute</span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#9f1239' }}>
                    If the work is incomplete or inconsistent with terms, open a formal case. Neither party is penalized automatically. Our neutral administrator will review evidence from both sides and order a fair resolution.
                  </p>

                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#881337', marginBottom: '0.25rem' }}>
                    Dispute Reason & Specific Grievance <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide full details of why the deliverables are rejected..."
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '0.88rem', marginBottom: '0.5rem' }}
                  />

                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#881337', marginBottom: '0.25rem' }}>
                    Supporting Evidence Image URL
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://... photo showing incomplete work or damage"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #fda4af', fontSize: '0.88rem' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="work-modal-footer">
          <button type="button" className="btn-work-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button
            type="button"
            className={
              activeTab === 'accept'
                ? 'btn-work-primary'
                : activeTab === 'request_correction'
                ? 'btn-work-secondary'
                : 'btn-work-danger'
            }
            onClick={handleSubmit}
            disabled={loading}
            style={
              activeTab === 'request_correction'
                ? { background: '#d97706', color: '#ffffff', border: 'none' }
                : {}
            }
          >
            {loading ? (
              'Processing...'
            ) : activeTab === 'accept' ? (
              <>
                <CheckCircle size={16} /> Confirm Acceptance & Release Payment
              </>
            ) : activeTab === 'request_correction' ? (
              <>
                <RotateCcw size={16} /> Send Correction Request
              </>
            ) : (
              <>
                <AlertTriangle size={16} /> Submit Dispute for Mediation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
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
            alt="Evidence full view"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewWorkModal;
