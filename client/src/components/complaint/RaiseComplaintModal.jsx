import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Send,
  Clock,
  CheckCircle,
  FileText,
  Paperclip,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import complaintService from '../../services/complaintService';
import './RaiseComplaintModal.css';

const CATEGORIES = [
  { value: 'worker_no_show', label: 'Worker Did Not Arrive (No Show)' },
  { value: 'unexpected_cancellation', label: 'Unexpected Cancellation' },
  { value: 'work_quality_mismatch', label: 'Work Quality Does Not Match Requirements' },
  { value: 'inaccurate_skills_qualifications', label: 'Inaccurate Skills or Qualifications' },
  { value: 'unprofessional_behavior', label: 'Unprofessional Behaviour' },
  { value: 'harassment_inappropriate', label: 'Harassment or Inappropriate Communication' },
  { value: 'payment_dispute', label: 'Payment Dispute / Unpaid Work' },
  { value: 'schedule_timing_issue', label: 'Work Schedule or Timing Discrepancy' },
  { value: 'safety_concern', label: 'Safety Concern or Hazard' },
  { value: 'misleading_job_description', label: 'Misleading Job Description' },
  { value: 'incomplete_work', label: 'Incomplete Work / Abandoned Assignment' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'suspected_fraud', label: 'Suspected Fraud or Scam' },
  { value: 'other', label: 'Other Issue' },
];

const DESIRED_RESOLUTIONS = [
  { value: 'work_correction', label: 'Request Agreed Work to be Corrected' },
  { value: 'replacement_worker', label: 'Schedule Replacement Worker' },
  { value: 'refund', label: 'Payment Refund / Adjustment' },
  { value: 'clarification', label: 'Clarify Job Requirements / Schedule' },
  { value: 'investigation', label: 'Formal Investigation & Review' },
  { value: 'policy_warning', label: 'Platform Policy Warning & Action' },
  { value: 'other', label: 'Other Specific Resolution' },
];

const SLA_INFO = {
  critical_safety: { ack: '2 Hours', res: '24 Hours', color: '#dc2626', badge: 'CRITICAL PRIORITY' },
  high: { ack: '4 Hours', res: '48 Hours', color: '#ea580c', badge: 'HIGH PRIORITY' },
  medium: { ack: '12 Hours', res: '72 Hours', color: '#2563eb', badge: 'STANDARD TIMELINE' },
  low: { ack: '24 Hours', res: '5 Business Days', color: '#4b5563', badge: 'GENERAL SUPPORT' },
};

const RaiseComplaintModal = ({
  isOpen,
  onClose,
  relatedGig = null,
  relatedAssignment = null,
  reportedUser = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    category: 'work_quality_mismatch',
    urgency: 'medium',
    description: '',
    incidentDate: new Date().toISOString().slice(0, 16),
    desiredResolution: 'work_correction',
    desiredResolutionNotes: '',
    evidenceTitle: '',
    evidenceUrl: '',
    consentConfirmed: true,
  });

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState(null);

  if (!isOpen) return null;

  const handleAddEvidence = () => {
    if (!formData.evidenceTitle.trim()) return;
    setEvidenceList([
      ...evidenceList,
      {
        title: formData.evidenceTitle.trim(),
        fileUrl: formData.evidenceUrl.trim() || undefined,
        fileType: formData.evidenceUrl ? 'link' : 'note',
      },
    ]);
    setFormData((prev) => ({ ...prev, evidenceTitle: '', evidenceUrl: '' }));
  };

  const handleRemoveEvidence = (index) => {
    setEvidenceList(evidenceList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description || !formData.description.trim()) {
      setError('Please provide a description of the issue before submitting.');
      return;
    }

    if (!formData.consentConfirmed) {
      setError('Please check the confirmation box below to verify your report.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        category: formData.category,
        urgency: formData.urgency,
        description: formData.description.trim(),
        incidentDate: formData.incidentDate ? new Date(formData.incidentDate) : undefined,
        desiredResolution: formData.desiredResolution,
        desiredResolutionNotes: formData.desiredResolutionNotes.trim(),
        relatedGig: relatedGig?._id || relatedGig || undefined,
        relatedAssignment: relatedAssignment?._id || relatedAssignment || undefined,
        reportedUser: reportedUser?._id || reportedUser || undefined,
        evidence: evidenceList,
        consentConfirmed: true,
      };

      const res = await complaintService.createComplaint(payload);
      setCreatedComplaint(res.complaint);
      if (onSuccess) onSuccess(res.complaint);
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      setError(
        err.response?.data?.message ||
          'Failed to submit complaint. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setCreatedComplaint(null);
    setFormData({
      category: 'work_quality_mismatch',
      urgency: 'medium',
      description: '',
      incidentDate: new Date().toISOString().slice(0, 16),
      desiredResolution: 'work_correction',
      desiredResolutionNotes: '',
      evidenceTitle: '',
      evidenceUrl: '',
      consentConfirmed: true,
    });
    setEvidenceList([]);
    setError('');
    onClose();
  };

  const currentSla = SLA_INFO[formData.urgency] || SLA_INFO.medium;

  return (
    <div className="complaint-modal-backdrop" onClick={handleResetAndClose}>
      <div className="complaint-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="complaint-modal-header">
          <div className="header-title-box">
            <div className="modal-header-icon-wrap">
              <ShieldAlert size={22} className="modal-header-icon" />
            </div>
            <div>
              <h3>Raise a Formal Complaint</h3>
              <p className="modal-subtitle">
                NearbyGigs Trusted Resolution &amp; Service SLA Management
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleResetAndClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="complaint-modal-body">
          {createdComplaint ? (
            /* Success confirmation screen */
            <div className="complaint-success-view">
              <CheckCircle size={56} color="#10b981" className="success-icon" />
              <h4>Complaint Registered Successfully</h4>
              <div className="reference-badge">
                Reference ID: <strong>{createdComplaint.referenceNumber || createdComplaint.complaintId || 'CMP-CONFIRMED'}</strong>
              </div>
              <p className="success-message">
                Your complaint has been securely filed in our Resolution Center and assigned for
                official review.
              </p>

              <div className="sla-summary-card">
                <div className="sla-col">
                  <span className="sla-label">Acknowledgement Target</span>
                  <span className="sla-val">
                    {new Date(createdComplaint.acknowledgementDeadline || createdComplaint.sla?.acknowledgementTarget || (Date.now() + 12 * 3600 * 1000)).toLocaleString()}
                  </span>
                </div>
                <div className="sla-col">
                  <span className="sla-label">Target Resolution</span>
                  <span className="sla-val">
                    {new Date(createdComplaint.resolutionDeadline || createdComplaint.sla?.resolutionTarget || (Date.now() + 72 * 3600 * 1000)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="success-instructions">
                <ul>
                  <li>
                    A responsible manager/independent reviewer has been alerted and will review
                    your evidence.
                  </li>
                  <li>
                    You can track real-time progress, attach additional proof, or respond to manager
                    queries in <strong>My Complaints</strong>.
                  </li>
                  <li>All investigations are handled impartially without bias.</li>
                </ul>
              </div>

              <div className="modal-actions-single">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleResetAndClose}
                >
                  View My Complaints Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="complaint-error-banner">{error}</div>}

              {/* Related Job Context Notice */}
              {relatedGig && (
                <div className="related-gig-notice">
                  <FileText size={16} />
                  <span>
                    Linked Job:{' '}
                    <strong>{relatedGig.title || `Job ID: ${relatedGig._id || relatedGig}`}</strong>
                  </span>
                </div>
              )}

              {/* Category & Urgency */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Complaint Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Severity / Urgency Level *</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    required
                  >
                    <option value="low">Low - General Feedback / Inquiry</option>
                    <option value="medium">Medium - Standard Service Issue</option>
                    <option value="high">High - Serious Dispute / Unresolved Issue</option>
                    <option value="critical_safety">
                      Critical - Safety Threat / Harassment / Emergency
                    </option>
                  </select>
                </div>
              </div>

              {/* Service Level Agreement Preview */}
              <div
                className="sla-guarantee-banner"
                style={{ borderLeftColor: currentSla.color }}
              >
                <div className="sla-badge" style={{ backgroundColor: currentSla.color }}>
                  {currentSla.badge}
                </div>
                <div className="sla-text">
                  Target Response: <strong>{currentSla.ack}</strong> | Target Resolution:{' '}
                  <strong>{currentSla.res}</strong>
                  <span className="sla-sub">
                    Monitored automatically by our server-side SLA escalation scheduler.
                  </span>
                </div>
              </div>

              {/* Incident Date & Desired Resolution */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Date &amp; Time of Incident</label>
                  <input
                    type="datetime-local"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Desired Resolution *</label>
                  <select
                    value={formData.desiredResolution}
                    onChange={(e) =>
                      setFormData({ ...formData, desiredResolution: e.target.value })
                    }
                    required
                  >
                    {DESIRED_RESOLUTIONS.map((res) => (
                      <option key={res.value} value={res.value}>
                        {res.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="form-group">
                <label>
                  Detailed Description of the Issue *
                  <span className="label-hint">(Please be factual and clear)</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe clearly what happened, who was involved, any prior communication, and why this issue requires resolution..."
                  required
                />
              </div>

              {/* Supporting Evidence List */}
              <div className="form-group evidence-section">
                <label>
                  Supporting Evidence or Proof (Optional)
                  <span className="label-hint">Screenshots, work photos, or links</span>
                </label>
                <div className="evidence-inputs">
                  <input
                    type="text"
                    placeholder="Evidence title (e.g. Chat Screenshot, Photo of Work)"
                    value={formData.evidenceTitle}
                    onChange={(e) => setFormData({ ...formData, evidenceTitle: e.target.value })}
                  />
                  <input
                    type="url"
                    placeholder="Image/Document URL (optional)"
                    value={formData.evidenceUrl}
                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-add-proof"
                    onClick={handleAddEvidence}
                    disabled={!formData.evidenceTitle.trim()}
                  >
                    <Paperclip size={14} /> Add Proof
                  </button>
                </div>

                {evidenceList.length > 0 && (
                  <ul className="evidence-list">
                    {evidenceList.map((item, index) => (
                      <li key={index} className="evidence-item">
                        <span>
                          <strong>{item.title}</strong>
                          {item.fileUrl && (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="evidence-link"
                            >
                              (View Link)
                            </a>
                          )}
                        </span>
                        <button
                          type="button"
                          className="remove-evidence-btn"
                          onClick={() => handleRemoveEvidence(index)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.consentConfirmed}
                    onChange={(e) =>
                      setFormData({ ...formData, consentConfirmed: e.target.checked })
                    }
                    required
                  />
                  <span>
                    I confirm this report is truthful and submitted in good faith. I understand that
                    false reports or abuse of the resolution system violates platform terms.
                  </span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="complaint-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleResetAndClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit-complaint"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <span>Submit Official Complaint</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaiseComplaintModal;
