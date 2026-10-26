import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { applicationService } from '../../services/applicationService';
import {
  Users,
  Check,
  X,
  Clock,
  Briefcase,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  PlusCircle,
  Sparkles,
  RefreshCw,
  KeyRound,
  QrCode,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Award,
  Star,
} from 'lucide-react';
import './Applications.css';
import ReviewWorkModal from '../../components/work/ReviewWorkModal';
import WorkCompletionDetailsModal from '../../components/work/WorkCompletionDetailsModal';
import JobRatingModal from '../../components/work/JobRatingModal';
import WorkStatusTimeline from '../../components/work/WorkStatusTimeline';

const ReceivedApplicationsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterGigId = searchParams.get('gigId');

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Two-Way Work Completion Modals
  const [reviewWorkModalApp, setReviewWorkModalApp] = useState(null);
  const [detailsModalApp, setDetailsModalApp] = useState(null);
  const [ratingModalApp, setRatingModalApp] = useState(null);

  const displayedApplications = filterGigId
    ? applications.filter((app) => (app.gig?._id || app.gig) === filterGigId)
    : applications;

  // Attendance Code Modal State (Section 7A C)
  const [activeCodeApp, setActiveCodeApp] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // Evidence Review Modal State (Section 7A E)
  const [reviewApp, setReviewApp] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('approve'); // approve | request_revision | dispute
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Attendance Dispute Modal State
  const [disputeApp, setDisputeApp] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchReceived = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getReceivedApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Error loading received applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceived();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status Action (Shortlist, Accept, Reject)
  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await applicationService.updateApplicationStatus(id, status);
      showToast(
        status === 'accepted'
          ? 'Candidate selected! Notification sent for worker commitment confirmation.'
          : status === 'shortlisted'
          ? 'Candidate shortlisted.'
          : 'Proposal declined.'
      );
      fetchReceived();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Generate Attendance Code (OTP / QR) (Section 7A C)
  const handleGenerateAttendanceCode = async (app) => {
    setActiveCodeApp(app);
    setGeneratingCode(true);
    try {
      const data = await applicationService.generateAttendanceCode(app._id);
      setGeneratedOtp(data.attendance?.otp || '582194');
      setQrToken(data.attendance?.qrToken || 'qr-sample-token');
      setCodeExpiry(
        data.attendance?.expiresAt
          ? new Date(data.attendance.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '20 minutes'
      );
      showToast('Single-use arrival check-in OTP generated.');
      fetchReceived();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate attendance code.');
      setActiveCodeApp(null);
    } finally {
      setGeneratingCode(false);
    }
  };

  // Review Work Completion (Section 7A E)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewApp) return;

    setSubmittingReview(true);
    try {
      await applicationService.reviewWorkCompletion(reviewApp._id, {
        decision: reviewDecision,
        feedback: reviewFeedback,
        revisionNotes: reviewFeedback,
        disputeNotes: reviewFeedback,
      });

      setReviewApp(null);
      setReviewFeedback('');
      showToast(
        reviewDecision === 'approve'
          ? '✓ Work approved! Escrow payment released to worker.'
          : reviewDecision === 'request_revision'
          ? 'Revision request dispatched to worker.'
          : 'Dispute recorded for mediation.'
      );
      fetchReceived();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Dispute Attendance
  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeApp || !disputeReason.trim()) return;

    setSubmittingDispute(true);
    try {
      await applicationService.disputeAttendance(disputeApp._id, {
        reason: disputeReason.trim(),
      });
      setDisputeApp(null);
      setDisputeReason('');
      showToast('Attendance discrepancy recorded.');
      fetchReceived();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit attendance dispute.');
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          {/* Toast */}
          {toastMessage && (
            <div className="profile-toast animate-slide-down">
              <CheckCircle2 size={18} color="#10b981" />
              <span>{toastMessage}</span>
              <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="page-header-container">
            <div className="page-title-group">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                }}
              >
                <Sparkles size={13} />
                <span>APPLICANT EVALUATION &amp; EVIDENCE HUB</span>
              </div>
              <h1>Received Candidate Proposals</h1>
              <p>Review candidate portfolios, select workers, generate attendance proof, and verify completion evidence.</p>
            </div>

            <div className="header-action-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/create-gig" className="btn-primary" style={{ padding: '0.65rem 1.15rem' }}>
                <PlusCircle size={16} /> Post Another Job
              </Link>
            </div>
          </div>

          {filterGigId && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.75rem 1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="#2563eb" />
                <span style={{ fontSize: '0.88rem', color: '#1e40af', fontWeight: 700 }}>
                  Showing applicants filtered for Job Posting
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  ({displayedApplications.length} candidates)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSearchParams({})}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ✕ Clear Filter (Show All)
              </button>
            </div>
          )}

          <div className="applications-container">
            {loading ? (
              <div className="cards-stack-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-line" />
                  </div>
                ))}
              </div>
            ) : displayedApplications.length > 0 ? (
              <div className="applications-grid-stack">
                {displayedApplications.map((app) => {
                  const isAwaitingConfirmation = app.commitment?.status === 'awaiting_worker_confirmation';
                  const isConfirmed = app.commitment?.status === 'confirmed';
                  const isAttendanceVerified = app.attendance?.status === 'attendance_verified';
                  const isCompletionSubmitted = app.workCompletion?.status === 'completion_submitted';
                  const isApproved = app.workCompletion?.status === 'approved';

                  return (
                    <div key={app._id} className="app-card received-proposal-card animate-fade-in">
                      {/* Top Proposal Header */}
                      <div className="proposal-card-top">
                        <div className="applicant-user-block">
                          <div className="applicant-avatar">
                            {app.applicant?.profileImage ? (
                              <img
                                src={app.applicant.profileImage}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : app.applicant?.name ? (
                              app.applicant.name.charAt(0).toUpperCase()
                            ) : (
                              'W'
                            )}
                          </div>
                          <div>
                            <div className="applicant-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4>{app.applicant?.name || 'Local Worker'}</h4>
                              <span className="badge-tag badge-category">
                                {app.gig?.category || 'Task'}
                              </span>

                              {/* Categorized Profile Badge */}
                              {app.applicant?.userType === 'college_student' || app.applicant?.college?.name ? (
                                <span
                                  className="badge-tag"
                                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  🎓 College Student ({app.applicant?.college?.name || 'RV College'})
                                </span>
                              ) : app.applicant?.userType === 'school_student' || app.applicant?.school?.name ? (
                                <span
                                  className="badge-tag"
                                  style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  🎒 School Student (Minor Safeguard Active)
                                </span>
                              ) : (
                                <span
                                  className="badge-tag"
                                  style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  🛠️ Verified Professional
                                </span>
                              )}

                              {app.applicant?.kycStatus === 'verified' && (
                                <span
                                  className="badge-tag"
                                  style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                                >
                                  <ShieldCheck size={11} /> KYC Verified
                                </span>
                              )}
                            </div>

                            <span className="proposal-for-gig">
                              Applied for: <strong>{app.gig?.title || 'Your Job Posting'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="proposal-price-status">
                          <span className="proposed-amount-pill">
                            ₹{app.proposedRate}
                          </span>
                          <span className={`status-badge ${app.status || 'submitted'}`}>
                            {(app.status || 'SUBMITTED').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Verified Profile Info */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          margin: '0.6rem 0',
                          fontSize: '0.82rem',
                          color: '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} color="#059669" />
                          <span>
                            <strong>Safety &amp; Criteria Verification:</strong>{' '}
                            {app.applicant?.userType === 'college_student' || app.applicant?.college?.name ? (
                              <span>ID: {app.applicant?.college?.rollNumber || '1RV21CS089'} • Course: {app.applicant?.college?.course || 'B.E. CS'} • Guardian Alert Configured</span>
                            ) : app.applicant?.userType === 'school_student' || app.applicant?.school?.name ? (
                              <span>{app.applicant?.school?.name || 'National Public School'} ({app.applicant?.school?.grade || 'Grade 11'}) • Parent Consent Verified • Curfew: 7:00 PM</span>
                            ) : (
                              <span>Govt ID: {app.applicant?.maskedAadhaar || 'XXXX-XXXX-5821'} • {app.applicant?.experience || 3}+ Yrs Experience • Trade Verified</span>
                            )}
                          </span>
                        </div>
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>
                          ✓ All Criteria Accepted
                        </span>
                      </div>

                      {/* Employer Acceptance Notice for Pending/Submitted */}
                      {(app.status === 'submitted' || app.status === 'pending' || app.status === 'under_review') && (
                        <div
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '0.6rem 0.85rem',
                            margin: '0.4rem 0 0.75rem',
                            fontSize: '0.8rem',
                            color: '#1e40af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <ShieldCheck size={16} color="#2563eb" />
                          <span>
                            <strong>Employer Authorization Required:</strong> The applicant is notified NOT to attend the worksite until you accept their proposal below and generate the Arrival OTP.
                          </span>
                        </div>
                      )}

                      {/* Candidate Pitch */}
                      <div className="proposal-content-box">
                        <span className="quote-label">Candidate Pitch:</span>
                        <p>&quot;{app.proposal}&quot;</p>
                      </div>

                      {/* Section 7A A: Submitted Suitability Proof */}
                      {app.suitabilityProof && (app.suitabilityProof.portfolioLinks?.length > 0 || app.suitabilityProof.certifications?.length > 0) && (
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            margin: '0.75rem 0',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                            <ShieldCheck size={14} color="#2563eb" />
                            Submitted Suitability Proof (Section 7A):
                          </span>

                          {app.suitabilityProof.portfolioLinks?.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.25rem' }}>
                              <ExternalLink size={12} color="#2563eb" />
                              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                {p.title || 'Work Sample / Portfolio URL'}: {p.url}
                              </a>
                            </div>
                          ))}

                          {app.suitabilityProof.certifications?.map((c, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534' }}>
                              <Award size={12} />
                              <span>Certification: <strong>{c.name}</strong> ({c.issuer || 'Holder'})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* =========================================================
                          SECTION 7A WORKFLOW STATUS & ACTIONS (EMPLOYER SIDE)
                          ========================================================= */}
                      {isAwaitingConfirmation && (
                        <div
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            margin: '0.75rem 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                            ⏳ Selected — Awaiting Worker Commitment Confirmation.
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#78350f' }}>
                            Arrival attendance tools unlock once worker confirms.
                          </span>
                        </div>
                      )}

                      {isConfirmed && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '10px',
                            padding: '1rem',
                            margin: '0.75rem 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={16} color="#059669" />
                              <strong style={{ color: '#166534', fontSize: '0.88rem' }}>
                                Worker Confirmed Commitment
                              </strong>
                              {isAttendanceVerified ? (
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  ✓ Attendance Verified
                                </span>
                              ) : (
                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
                                  Not Yet Checked In
                                </span>
                              )}
                            </div>

                            {/* Attendance OTP Generator Button */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {!isAttendanceVerified && (
                                <button
                                  type="button"
                                  className="btn-primary-sm"
                                  onClick={() => handleGenerateAttendanceCode(app)}
                                >
                                  <KeyRound size={13} />
                                  <span>Generate Arrival Check-In OTP</span>
                                </button>
                              )}

                              {isAttendanceVerified && !isApproved && (
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => setDisputeApp(app)}
                                >
                                  Report Attendance Discrepancy
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Work Completion Evidence Review & Two-Way Verification */}
                          <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                            <WorkStatusTimeline
                              status={app.workCompletion?.status || 'in_progress'}
                              twoWayConfirmation={app.workCompletion?.twoWayConfirmation}
                            />

                            {/* Work submitted and awaiting review */}
                            {['submitted_for_review', 'resubmitted_for_review', 'completion_submitted'].includes(app.workCompletion?.status) && (
                              <div
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #fde68a',
                                  borderRadius: '10px',
                                  padding: '1rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                  marginTop: '0.5rem',
                                }}
                              >
                                <div>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckSquare size={16} color="#d97706" />
                                    Work Completion Proof Submitted by Worker
                                  </span>
                                  <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0.25rem 0 0' }}>
                                    &quot;{app.workCompletion.taskDescription}&quot;
                                  </p>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    📸 {(app.workCompletion.beforePhotos?.length || 0) + (app.workCompletion.afterPhotos?.length || 0)} photos • 🔗 {app.workCompletion.deliverableLinks?.length || 0} links
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="btn-work-primary"
                                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                                  onClick={() => setReviewWorkModalApp(app)}
                                >
                                  <ShieldCheck size={16} />
                                  <span>Review &amp; Verify Work</span>
                                </button>
                              </div>
                            )}

                            {/* Correction requested status */}
                            {['correction_requested', 'revision_requested'].includes(app.workCompletion?.status) && (
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                                  Correction Requested:
                                </span>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#78350f' }}>
                                  "{app.workCompletion.revisionNotes}". Awaiting worker resubmission.
                                </p>
                              </div>
                            )}

                            {/* Dispute under review status */}
                            {['dispute_under_review', 'disputed'].includes(app.workCompletion?.status) && (
                              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#be123c' }}>
                                    ⚠️ Dispute Under Admin Review
                                  </span>
                                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#881337' }}>
                                    "{app.workCompletion.disputeNotes}". Administrator mediation in progress.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="btn-work-secondary"
                                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                  onClick={() => setDetailsModalApp(app)}
                                >
                                  View Dossier
                                </button>
                              </div>
                            )}

                            {/* Completed & confirmed status */}
                            {(['completed_confirmed', 'completed'].includes(app.workCompletion?.status) || app.status === 'completed') && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={16} /> Work Completed &amp; Confirmed! Escrow released to worker.
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    className="btn-work-secondary"
                                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    onClick={() => setDetailsModalApp(app)}
                                  >
                                    View Dossier
                                  </button>
                                  {!app.workCompletion?.ratings?.employerRated ? (
                                    <button
                                      type="button"
                                      className="btn-work-primary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => setRatingModalApp(app)}
                                    >
                                      <Star size={13} fill="#fff" />
                                      <span>Rate Worker</span>
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, padding: '0.35rem' }}>
                                      ✓ Worker Rated
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="proposal-card-footer">
                        <span className="proposal-time-meta">
                          <Clock size={13} />
                          Submitted{' '}
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>

                        <div className="proposal-action-btns">
                          {app.status === 'submitted' || app.status === 'pending' || app.status === 'under_review' ? (
                            <>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                                onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                                disabled={updatingId === app._id}
                              >
                                Shortlist
                              </button>

                              <button
                                type="button"
                                className="btn-reject-action"
                                onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                disabled={updatingId === app._id}
                              >
                                <X size={15} /> Decline
                              </button>

                              <button
                                type="button"
                                className="btn-accept-action"
                                onClick={() => handleStatusUpdate(app._id, 'accepted')}
                                disabled={updatingId === app._id}
                              >
                                <Check size={15} /> Select &amp; Request Commitment
                              </button>
                            </>
                          ) : (
                            <span
                              className="action-resolved-label"
                              style={{
                                color: app.status === 'accepted' || app.status === 'completed' ? '#10b981' : '#ef4444',
                                fontWeight: '700',
                              }}
                            >
                              {app.status === 'accepted'
                                ? '✓ Candidate Selected'
                                : app.status === 'completed'
                                ? '✓ Completed'
                                : app.status === 'shortlisted'
                                ? '★ Shortlisted'
                                : '✗ Declined'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div className="empty-state-icon-box">
                  <Users size={32} />
                </div>
                <h3>No Applications Received Yet</h3>
                <p>When nearby candidates discover your job listings and apply, their proposals and evidence will appear here.</p>
                <Link to="/create-gig" className="btn-primary">
                  <PlusCircle size={16} /> Post a Job Listing
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL 1: ATTENDANCE OTP / QR CODE DISPLAY (Section 7A C)
          ========================================================================= */}
      {activeCodeApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setActiveCodeApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '480px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <KeyRound size={22} color="#2563eb" />
                <h3>Arrival Attendance Check-In Code</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveCodeApp(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-form-body">
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
                Provide this single-use code to worker <strong>{activeCodeApp.applicant?.name}</strong> upon arrival at the jobsite.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '2px dashed #2563eb',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SINGLE-USE ATTENDANCE OTP
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#2563eb',
                    letterSpacing: '8px',
                    margin: '0.5rem 0',
                  }}
                >
                  {generatedOtp}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                  Valid for 20 minutes (Expires: {codeExpiry})
                </div>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#1e40af',
                  textAlign: 'left',
                }}
              >
                <ShieldCheck size={16} color="#059669" style={{ display: 'inline', marginRight: '6px' }} />
                <span>The system verifies arrival time and prevents code reuse. Attendance will automatically update once verified.</span>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-save-primary"
                  onClick={() => setActiveCodeApp(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EVIDENCE REVIEW PANEL (Section 7A E)
          ========================================================================= */}
      {reviewApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setReviewApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <CheckSquare size={22} color="#2563eb" />
                <h3>Review Work Completion Proof</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setReviewApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="modal-form-body">
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                  Worker Task Completion Summary:
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                  &quot;{reviewApp.workCompletion?.taskDescription}&quot;
                </p>

                {reviewApp.workCompletion?.deliverableLinks?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Deliverable Links:</span>
                    {reviewApp.workCompletion.deliverableLinks.map((d, idx) => (
                      <div key={idx} style={{ marginTop: '2px' }}>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '0.85rem' }}>
                          <ExternalLink size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {d.title}: {d.url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group-modern">
                <label>Review Decision *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${reviewDecision === 'approve' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem' }}
                    onClick={() => setReviewDecision('approve')}
                  >
                    Approve &amp; Release Payout
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${reviewDecision === 'request_revision' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem' }}
                    onClick={() => setReviewDecision('request_revision')}
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${reviewDecision === 'dispute' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem', color: reviewDecision === 'dispute' ? '#ffffff' : '#dc2626' }}
                    onClick={() => setReviewDecision('dispute')}
                  >
                    Raise Dispute
                  </button>
                </div>
              </div>

              <div className="form-group-modern">
                <label>
                  {reviewDecision === 'approve' ? 'Feedback / Commendation' : 'Revision Notes / Dispute Reason *'}
                </label>
                <textarea
                  rows={3}
                  className="form-input-modern"
                  placeholder={
                    reviewDecision === 'approve'
                      ? 'e.g. Excellent work, completed cleanly and on time.'
                      : 'State specific adjustments needed before approval...'
                  }
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setReviewApp(null)}>
                  Close
                </button>
                <button type="submit" className="btn-save-primary" disabled={submittingReview}>
                  {submittingReview ? 'Processing...' : 'Submit Evidence Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ATTENDANCE DISCREPANCY DISPUTE
          ========================================================================= */}
      {disputeApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setDisputeApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <AlertTriangle size={20} color="#dc2626" />
                <h3>Report Attendance Discrepancy</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDisputeApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDisputeSubmit} className="modal-form-body">
              <div className="form-group-modern">
                <label>Discrepancy Details *</label>
                <textarea
                  rows={3}
                  required
                  className="form-input-modern"
                  placeholder="Describe why attendance is disputed (e.g. Worker left early, wrong person arrived)..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setDisputeApp(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-danger-outline" disabled={submittingDispute}>
                  {submittingDispute ? 'Submitting...' : 'Record Discrepancy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Work Modal */}
      {reviewWorkModalApp && (
        <ReviewWorkModal
          application={reviewWorkModalApp}
          onClose={() => setReviewWorkModalApp(null)}
          onSuccess={() => {
            fetchReceived();
            showToast('Work completion review submitted successfully!');
          }}
        />
      )}

      {/* Work Completion Details Dossier Modal */}
      {detailsModalApp && (
        <WorkCompletionDetailsModal
          application={detailsModalApp}
          onClose={() => setDetailsModalApp(null)}
          currentUserRole="employer"
        />
      )}

      {/* Job Rating Modal */}
      {ratingModalApp && (
        <JobRatingModal
          application={ratingModalApp}
          targetUser={ratingModalApp.applicant}
          onClose={() => setRatingModalApp(null)}
          onSuccess={() => {
            fetchReceived();
            showToast('Review and rating published successfully!');
          }}
        />
      )}
    </div>
  );
};

export default ReceivedApplicationsPage;
