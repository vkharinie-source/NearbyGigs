import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import './WorkCompletion.css';

const DisputeDetailModal = ({ application, currentRole = 'worker', onClose, onSuccess }) => {
  const [statement, setStatement] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [action, setAction] = useState('raise_concern'); // 'raise_concern' | 'agree_to_correct'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gig = application?.gig || {};
  const completion = application?.workCompletion || {};
  const dispute = completion?.disputeDetails || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (action === 'raise_concern' && !statement.trim()) {
      setError('Please provide your statement or reasons for disagreement.');
      return;
    }

    setLoading(true);
    try {
      const evidence = evidenceUrl.trim()
        ? [{ title: 'Worker Rebuttal Evidence', url: evidenceUrl.trim() }]
        : [];

      await applicationService.acknowledgeOrConcern(application._id, {
        action,
        statement: statement.trim(),
        evidence,
      });

      onSuccess(
        action === 'raise_concern'
          ? '✓ Your statement has been recorded and submitted for dispute arbitration.'
          : '✓ Acknowledgment recorded.'
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="work-modal-backdrop" onClick={onClose}>
      <div className="work-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="work-modal-header">
          <div className="work-modal-header-content">
            <div className="work-modal-icon danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="work-modal-title">Dispute Mediation & Worker Statement</h3>
              <p className="work-modal-subtitle">
                Two-way dispute representation on "{gig.title || 'Job'}"
              </p>
            </div>
          </div>
          <button className="work-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="work-modal-body">
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecdd3',
                  color: '#991b1b',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Current Complaint Overview */}
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '1rem', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase' }}>
                Employer's Complaint / Review Decision:
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#881337', fontWeight: 500 }}>
                "{completion.disputeNotes || completion.revisionNotes || dispute.reason || 'Employer reported discrepancies in work completion.'}"
              </p>
            </div>

            {/* Response Type Selector */}
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                How would you like to respond?
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid',
                    borderColor: action === 'raise_concern' ? '#e11d48' : '#e2e8f0',
                    background: action === 'raise_concern' ? '#fff1f2' : '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: action === 'raise_concern' ? '#be123c' : '#334155',
                  }}
                >
                  <input
                    type="radio"
                    name="disputeAction"
                    value="raise_concern"
                    checked={action === 'raise_concern'}
                    onChange={() => setAction('raise_concern')}
                    style={{ accentColor: '#e11d48' }}
                  />
                  <span>Disagree & Submit Defense</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid',
                    borderColor: action === 'agree_to_correct' ? '#0f766e' : '#e2e8f0',
                    background: action === 'agree_to_correct' ? '#f0fdfa' : '#ffffff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: action === 'agree_to_correct' ? '#0f766e' : '#334155',
                  }}
                >
                  <input
                    type="radio"
                    name="disputeAction"
                    value="agree_to_correct"
                    checked={action === 'agree_to_correct'}
                    onChange={() => setAction('agree_to_correct')}
                    style={{ accentColor: '#0f766e' }}
                  />
                  <span>Acknowledge & Correct</span>
                </label>
              </div>
            </div>

            {/* Statement Field */}
            {action === 'raise_concern' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Worker Statement & Rebuttal <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Provide your side of the events, reference original job terms, materials used, or why the complaint is unfounded..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Optional Proof Image URL
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://... photo proving completed work was satisfactory"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
              🛡️ NearbyGig Dispute Guarantee: All dispute cases are reviewed by neutral platform administrators. Evidence from both parties is evaluated before a final binding determination is recorded.
            </div>
          </div>

          {/* Footer */}
          <div className="work-modal-footer">
            <button type="button" className="btn-work-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-work-primary" disabled={loading}>
              {loading ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={16} /> Submit Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeDetailModal;
