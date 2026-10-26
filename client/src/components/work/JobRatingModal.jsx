import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import './WorkCompletion.css';

const JobRatingModal = ({ application, currentRole = 'worker', onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gig = application?.gig || {};
  const isWorker = currentRole === 'worker';
  const targetName = isWorker
    ? gig?.postedBy?.name || 'Employer'
    : application?.applicant?.name || 'Worker';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide feedback explaining your experience.');
      return;
    }

    setLoading(true);
    try {
      await reviewService.createReview({
        applicationId: application._id,
        gigId: gig._id,
        rating: Number(rating),
        comment: comment.trim(),
      });

      onSuccess('✓ Thank you! Your rating and review have been submitted successfully.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="work-modal-backdrop" onClick={onClose}>
      <div className="work-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="work-modal-header">
          <div className="work-modal-header-content">
            <div className="work-modal-icon success">
              <Star size={22} fill="#16a34a" />
            </div>
            <div>
              <h3 className="work-modal-title">Rate & Review Experience</h3>
              <p className="work-modal-subtitle">
                Share feedback for {targetName} on "{gig.title || 'Gig'}"
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

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.75rem' }}>
                How would you rate your overall experience with {targetName}?
              </span>

              {/* Interactive Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <Star
                      size={36}
                      fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                      color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                    />
                  </button>
                ))}
              </div>

              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                {rating === 5
                  ? '⭐⭐⭐⭐⭐ Outstanding & Highly Recommended'
                  : rating === 4
                  ? '⭐⭐⭐⭐ Great Experience'
                  : rating === 3
                  ? '⭐⭐⭐ Satisfactory'
                  : rating === 2
                  ? '⭐⭐ Needs Improvement'
                  : '⭐ Disappointing'}
              </span>
            </div>

            {/* Comment Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                Written Review & Feedback <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Highlight quality, punctuality, communication, and professionalism..."
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

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
              ℹ️ NearbyGig Policy: One eligible review per user per completed job. Contributes to public platform trust and reliability score.
            </div>
          </div>

          {/* Footer */}
          <div className="work-modal-footer">
            <button type="button" className="btn-work-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-work-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Post Public Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobRatingModal;
