import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Image,
  AlertCircle,
  FileCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import './WorkCompletion.css';

const DEFAULT_CHECKLIST = [
  { task: 'Completed all core task requirements specified in job post', completed: true },
  { task: 'Cleaned up and restored work area after completion', completed: true },
  { task: 'Verified deliverables and functionality with client specifications', completed: true },
];

const SAMPLE_EVIDENCE_URLS = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop',
];

const SubmitWorkModal = ({ application, onClose, onSuccess }) => {
  const isResubmission = ['correction_requested', 'revision_requested', 'dispute_under_review'].includes(
    application?.workCompletion?.status
  );

  const [taskDescription, setTaskDescription] = useState(
    application?.workCompletion?.taskDescription || ''
  );
  const [checklist, setChecklist] = useState(
    application?.workCompletion?.checklist?.length > 0
      ? application.workCompletion.checklist
      : DEFAULT_CHECKLIST
  );
  const [deliverables, setDeliverables] = useState(
    application?.workCompletion?.deliverableLinks?.length > 0
      ? application.workCompletion.deliverableLinks
      : [{ title: 'Completed Project Deliverable', url: '' }]
  );

  // Before & After Photos
  const [beforePhotos, setBeforePhotos] = useState(
    application?.workCompletion?.beforePhotos?.length > 0
      ? application.workCompletion.beforePhotos
      : []
  );
  const [afterPhotos, setAfterPhotos] = useState(
    application?.workCompletion?.afterPhotos?.length > 0
      ? application.workCompletion.afterPhotos
      : []
  );

  const [newBeforeUrl, setNewBeforeUrl] = useState('');
  const [newBeforeCaption, setNewBeforeCaption] = useState('');
  const [newAfterUrl, setNewAfterUrl] = useState('');
  const [newAfterCaption, setNewAfterCaption] = useState('');

  const [workerNotes, setWorkerNotes] = useState('');
  const [confirmedCompleted, setConfirmedCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Checklist handlers
  const handleToggleChecklist = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddChecklistItem = () => {
    const text = prompt('Enter additional checklist item:');
    if (text && text.trim()) {
      setChecklist((prev) => [...prev, { task: text.trim(), completed: true }]);
    }
  };

  // Deliverables handlers
  const handleAddDeliverable = () => {
    setDeliverables((prev) => [...prev, { title: '', url: '' }]);
  };

  const handleDeliverableChange = (index, field, value) => {
    setDeliverables((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  // Before/After photo additions
  const handleAddBeforePhoto = () => {
    if (!newBeforeUrl.trim()) return;
    setBeforePhotos((prev) => [
      ...prev,
      { url: newBeforeUrl.trim(), caption: newBeforeCaption.trim() || 'Work Site Before Start' },
    ]);
    setNewBeforeUrl('');
    setNewBeforeCaption('');
  };

  const handleAddAfterPhoto = () => {
    if (!newAfterUrl.trim()) return;
    setAfterPhotos((prev) => [
      ...prev,
      { url: newAfterUrl.trim(), caption: newAfterCaption.trim() || 'Completed Work Result' },
    ]);
    setNewAfterUrl('');
    setNewAfterCaption('');
  };

  const handleQuickAddSample = (type) => {
    const randomUrl = SAMPLE_EVIDENCE_URLS[Math.floor(Math.random() * SAMPLE_EVIDENCE_URLS.length)];
    if (type === 'before') {
      setBeforePhotos((prev) => [
        ...prev,
        { url: randomUrl, caption: 'Before Starting Work Proof' },
      ]);
    } else {
      setAfterPhotos((prev) => [
        ...prev,
        { url: randomUrl, caption: 'Verified Finished Deliverable' },
      ]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!taskDescription.trim()) {
      setError('Please provide a detailed description of the completed work.');
      return;
    }

    if (!confirmedCompleted) {
      setError('You must confirm that the agreed work has been completed in accordance with requirements.');
      return;
    }

    const filteredDeliverables = deliverables.filter(
      (d) => d.url && d.url.trim().length > 0
    );

    setLoading(true);
    try {
      await applicationService.submitWorkCompletion(application._id, {
        taskDescription: taskDescription.trim(),
        deliverableLinks: filteredDeliverables,
        checklist,
        beforePhotos,
        afterPhotos,
        notes: workerNotes.trim() || (isResubmission ? 'Resubmitted after addressing requested corrections' : ''),
      });

      onSuccess(
        isResubmission
          ? '✓ Corrected work resubmitted for employer review!'
          : '✓ Work completion submitted for employer review and two-way verification!'
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit work completion.');
    } finally {
      setLoading(false);
    }
  };

  const gig = application?.gig || {};
  const currentSubmissionDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="work-modal-backdrop" onClick={onClose}>
      <div className="work-modal work-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="work-modal-header">
          <div className="work-modal-header-content">
            <div className={`work-modal-icon ${isResubmission ? 'warning' : ''}`}>
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="work-modal-title">
                {isResubmission ? 'Resubmit Corrected Work for Review' : 'Submit Work for Review'}
              </h3>
              <p className="work-modal-subtitle">
                Two-way work confirmation and verification system
              </p>
            </div>
          </div>
          <button className="work-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

            {/* Approved Job Details Banner */}
            <div className="work-info-banner">
              <div className="work-info-item">
                <span className="work-info-label">Assigned Job</span>
                <span className="work-info-value">{gig.title || 'Nearby Gig Job'}</span>
              </div>
              <div className="work-info-item">
                <span className="work-info-label">Agreed Budget</span>
                <span className="work-info-value" style={{ color: '#0f766e' }}>
                  ₹{application.payment?.amount || gig.budgetMin || 0}
                </span>
              </div>
              <div className="work-info-item">
                <span className="work-info-label">Work Location</span>
                <span className="work-info-value">{gig.location?.address || 'On-site'}</span>
              </div>
              <div className="work-info-item">
                <span className="work-info-label">Current Submission Date</span>
                <span className="work-info-value">{currentSubmissionDate}</span>
              </div>
            </div>

            {/* Resubmission Correction Notice */}
            {isResubmission && application?.workCompletion?.revisionNotes && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <AlertCircle size={16} />
                  <span>Employer's Correction Request</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f' }}>
                  "{application.workCompletion.revisionNotes}"
                </p>
                <span style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '4px', display: 'block' }}>
                  Please ensure your resubmission clearly addresses these requested adjustments.
                </span>
              </div>
            )}

            {/* Description of Completed Work */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Work Completion Summary <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <textarea
                rows={4}
                required
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe the work you accomplished, methodology used, deliverables completed, and any instructions for the employer..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Task Checklist */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                  Requirement Checklist Verification
                </label>
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f766e',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {checklist.map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: item.completed ? '#f0fdfa' : '#f8fafc',
                      border: '1px solid',
                      borderColor: item.completed ? '#99f6e4' : '#e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#0f172a',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(idx)}
                      style={{ accentColor: '#0f766e', width: '16px', height: '16px' }}
                    />
                    <span>{item.task}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Before & After Photo Evidence */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                  Supporting Photo Evidence (Before & After)
                </label>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Visual proof ensures faster employer acceptance
                </span>
              </div>

              <div className="comparison-grid">
                {/* Before Photos Column */}
                <div className="comparison-column">
                  <div className="comparison-header">
                    <span className="comparison-title" style={{ color: '#0284c7' }}>
                      📸 Before Starting ({beforePhotos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddSample('before')}
                      style={{
                        background: '#e0f2fe',
                        border: 'none',
                        color: '#0369a1',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Sample Photo
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <input
                      type="url"
                      placeholder="Image URL..."
                      value={newBeforeUrl}
                      onChange={(e) => setNewBeforeUrl(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddBeforePhoto}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>

                  {beforePhotos.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {beforePhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card">
                          <img src={photo.url} alt={photo.caption || 'Before work'} />
                          <span className="evidence-thumb-badge before">Before</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No before photos added
                    </div>
                  )}
                </div>

                {/* After Photos Column */}
                <div className="comparison-column">
                  <div className="comparison-header">
                    <span className="comparison-title" style={{ color: '#16a34a' }}>
                      ✨ After Completion ({afterPhotos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddSample('after')}
                      style={{
                        background: '#dcfce7',
                        border: 'none',
                        color: '#15803d',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Sample Photo
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    <input
                      type="url"
                      placeholder="Image URL..."
                      value={newAfterUrl}
                      onChange={(e) => setNewAfterUrl(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAfterPhoto}
                      style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>

                  {afterPhotos.length > 0 ? (
                    <div className="evidence-gallery-grid">
                      {afterPhotos.map((photo, i) => (
                        <div key={i} className="evidence-thumb-card">
                          <img src={photo.url} alt={photo.caption || 'After work'} />
                          <span className="evidence-thumb-badge after">After</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No completion photos added
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Deliverable Links */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                  Deliverable Files & Links (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f766e',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} /> Add Link
                </button>
              </div>

              {deliverables.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Deliverable title (e.g. Google Drive, GitHub, PDF)"
                    value={item.title}
                    onChange={(e) => handleDeliverableChange(i, 'title', e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={item.url}
                    onChange={(e) => handleDeliverableChange(i, 'url', e.target.value)}
                    style={{ flex: 2, padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(i)}
                      style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '0 4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Additional Notes / Resubmission Comments
              </label>
              <input
                type="text"
                value={workerNotes}
                onChange={(e) => setWorkerNotes(e.target.value)}
                placeholder="Any special remarks regarding safety, materials, or adjustments made..."
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Two-Way Work Confirmation Checkbox */}
            <div
              style={{
                background: '#f8fafc',
                border: '2px solid #0f766e',
                borderRadius: '10px',
                padding: '1rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={confirmedCompleted}
                  onChange={(e) => setConfirmedCompleted(e.target.checked)}
                  style={{
                    accentColor: '#0f766e',
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                  }}
                />
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    Worker Confirmation of Work Completion
                  </span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    I solemnly confirm that the assigned work has been completed in full accordance with the agreed requirements and quality standards. I understand the employer will review this submission for confirmation or may request adjustments.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="work-modal-footer">
            <button type="button" className="btn-work-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-work-primary" disabled={loading || !confirmedCompleted}>
              {loading ? (
                <>Submitting...</>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {isResubmission ? 'Resubmit for Employer Review' : 'Submit Work for Review'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitWorkModal;
