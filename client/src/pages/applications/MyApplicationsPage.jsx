import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { applicationService } from '../../services/applicationService';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import {
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
  ChevronRight,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  Send,
  X,
  Loader2,
  Check,
  HelpCircle,
  Building2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  ExternalLink,
  Star,
} from 'lucide-react';
import './Applications.css';
import RaiseComplaintModal from '../../components/complaint/RaiseComplaintModal';
import SubmitWorkModal from '../../components/work/SubmitWorkModal';
import WorkCompletionDetailsModal from '../../components/work/WorkCompletionDetailsModal';
import DisputeDetailModal from '../../components/work/DisputeDetailModal';
import JobRatingModal from '../../components/work/JobRatingModal';
import WorkStatusTimeline from '../../components/work/WorkStatusTimeline';

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { location } = useLocationContext();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Commitment Modal State
  const [commitmentApp, setCommitmentApp] = useState(null);
  const [commitmentAction, setCommitmentAction] = useState('confirm'); // confirm | clarify | decline
  const [commitmentNotes, setCommitmentNotes] = useState('');
  const [submittingCommitment, setSubmittingCommitment] = useState(false);

  // Attendance Check-In Modal State
  const [checkInApp, setCheckInApp] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Work Completion & Two-Way Verification Modals
  const [submitModalApp, setSubmitModalApp] = useState(null);
  const [detailsModalApp, setDetailsModalApp] = useState(null);
  const [disputeModalApp, setDisputeModalApp] = useState(null);
  const [ratingModalApp, setRatingModalApp] = useState(null);
  const [completionApp, setCompletionApp] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { task: 'Completed primary scheduled responsibilities', completed: true },
    { task: 'Cleaned up work area and restored workspace', completed: true },
    { task: 'Confirmed deliverable requirements with client', completed: true },
  ]);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Cancellation Modal State
  const [cancelApp, setCancelApp] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Complaint Modal State
  const [complaintApp, setComplaintApp] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Error fetching my applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Commitment Response (Section 7A B)
  const handleCommitmentSubmit = async (e) => {
    e.preventDefault();
    if (!commitmentApp) return;

    setSubmittingCommitment(true);
    try {
      await applicationService.respondToCommitment(commitmentApp._id, {
        action: commitmentAction,
        notes: commitmentNotes,
        reason: commitmentNotes,
      });

      setCommitmentApp(null);
      setCommitmentNotes('');
      showToast(
        commitmentAction === 'confirm'
          ? '✓ Job commitment confirmed! Employer notified.'
          : commitmentAction === 'decline'
          ? 'Job declined. Listing reopened.'
          : 'Clarification request dispatched to employer.'
      );
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit commitment response.');
    } finally {
      setSubmittingCommitment(false);
    }
  };

  // Handle Attendance Verification (Section 7A C)
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInApp || !otpInput.trim()) return;

    setSubmittingCheckIn(true);
    try {
      await applicationService.verifyAttendance(checkInApp._id, {
        code: otpInput.trim(),
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
      });

      setCheckInApp(null);
      setOtpInput('');
      showToast('✓ Attendance verified! You may now perform your tasks.');
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid or expired attendance check-in code.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Handle Work Completion Submission (Section 7A D)
  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    if (!completionApp) return;

    if (!taskDescription.trim()) {
      alert('Please describe your completed task work.');
      return;
    }

    setSubmittingCompletion(true);
    try {
      const deliverables = deliverableUrl.trim()
        ? [{ title: 'Deliverable Output', url: deliverableUrl.trim() }]
        : [];

      await applicationService.submitWorkCompletion(completionApp._id, {
        taskDescription: taskDescription.trim(),
        deliverableLinks: deliverables,
        checklist: checklistItems,
      });

      setCompletionApp(null);
      setTaskDescription('');
      setDeliverableUrl('');
      showToast('✓ Work completion proof submitted for employer review and payment release!');
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit completion proof.');
    } finally {
      setSubmittingCompletion(false);
    }
  };

  // Handle Cancellation (Section 7A F)
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelApp || !cancelReason.trim()) return;

    setSubmittingCancel(true);
    try {
      await applicationService.cancelAssignment(cancelApp._id, {
        reason: cancelReason.trim(),
      });
      setCancelApp(null);
      setCancelReason('');
      showToast('Assignment cancellation recorded.');
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel assignment.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const filteredApps =
    filter === 'ALL'
      ? applications
      : applications.filter((a) => {
          if (filter === 'CONFIRMED') return a.commitment?.status === 'confirmed';
          if (filter === 'AWAITING') return a.commitment?.status === 'awaiting_worker_confirmation';
          return a.status?.toLowerCase() === filter.toLowerCase();
        });

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
                  background: '#E6FFFA',
                  color: '#0F766E',
                  border: '1px solid #99F6E4',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                }}
              >
                <Sparkles size={13} />
                <span>WORKER COMMITMENT &amp; ATTENDANCE DASHBOARD</span>
              </div>
              <h1>My Applications &amp; Job Commitments</h1>
              <p>Track proposals, confirm accepted job offers, verify worksite attendance, and submit completion proof.</p>
            </div>

            <Link to="/find-gigs" className="btn-primary" style={{ background: '#0F766E', borderColor: '#0F766E' }}>
              <Briefcase size={16} />
              <span>Explore More Gigs</span>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="status-filter-tabs">
            {['ALL', 'AWAITING', 'CONFIRMED', 'SUBMITTED', 'REJECTED', 'COMPLETED'].map((st) => {
              let count = 0;
              if (st === 'ALL') count = applications.length;
              else if (st === 'AWAITING') count = applications.filter((a) => a.commitment?.status === 'awaiting_worker_confirmation').length;
              else if (st === 'CONFIRMED') count = applications.filter((a) => a.commitment?.status === 'confirmed').length;
              else count = applications.filter((a) => a.status?.toLowerCase() === st.toLowerCase()).length;

              return (
                <button
                  key={st}
                  className={`status-tab-btn ${filter === st ? 'active' : ''}`}
                  onClick={() => setFilter(st)}
                >
                  {st === 'AWAITING' ? 'ACTION NEEDED' : st}
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>

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
            ) : filteredApps.length > 0 ? (
              <div className="applications-grid-stack">
                {filteredApps.map((app) => {
                  const isAwaitingConfirmation = app.commitment?.status === 'awaiting_worker_confirmation';
                  const isConfirmed = app.commitment?.status === 'confirmed';
                  const isAttendanceVerified = app.attendance?.status === 'attendance_verified';
                  const isCompletionSubmitted = app.workCompletion?.status === 'completion_submitted';
                  const isApproved = app.workCompletion?.status === 'approved';

                  return (
                    <div key={app._id} className="app-card application-item-card animate-fade-in">
                      {/* Top Header Row */}
                      <div className="app-item-top-row">
                        <div className="app-gig-info">
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span className="badge-category">{app.gig?.category || 'General'}</span>
                            <span className="badge-category" style={{ background: '#f8fafc', color: '#475569' }}>
                              {app.gig?.jobType || 'On-site'}
                            </span>
                          </div>
                          <h3 className="app-gig-title">{app.gig?.title || 'Job Opportunity'}</h3>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={13} color="#2563eb" />
                              {app.gig?.postedBy?.companyName || app.gig?.postedBy?.name || 'Verified Employer'}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={13} />
                              {app.gig?.postedBy?.phone ? `Contact: ${app.gig.postedBy.phone}` : (app.gig?.address || 'Bengaluru')}
                            </span>
                          </div>
                        </div>

                        <div className="app-status-wrap">
                          {isAwaitingConfirmation ? (
                            <span className="status-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                              ACTION REQUIRED: CONFIRM COMMITMENT
                            </span>
                          ) : (
                            <span className={`status-badge ${app.status || 'submitted'}`}>
                              {(app.status || 'SUBMITTED').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Proposal Pitch */}
                      <div className="app-proposal-quote">
                        <span className="quote-label">Your Proposal &amp; Terms:</span>
                        <p>&quot;{app.proposal}&quot;</p>
                      </div>

                      {/* =========================================================
                          SECTION 7A WORKFLOW BANNER: COMMITMENT & ATTENDANCE
                          ========================================================= */}
                      {isAwaitingConfirmation && (
                        <div
                          style={{
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            padding: '1rem',
                            margin: '1rem 0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                              <h4 style={{ color: '#92400e', fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
                                🎉 Congratulations! The Employer Selected You
                              </h4>
                              <p style={{ color: '#78350f', fontSize: '0.85rem', margin: 0 }}>
                                Please review the agreed date, payment (₹{app.proposedRate}), and location. Confirm your commitment to attend and perform this work.
                              </p>
                            </div>

                            <button
                              type="button"
                              className="btn-save-primary"
                              style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                              onClick={() => setCommitmentApp(app)}
                            >
                              <ShieldCheck size={16} />
                              <span>Confirm / Decline Offer</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Confirmed Job Status Bar */}
                      {isConfirmed && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            padding: '1rem',
                            margin: '1rem 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={18} color="#059669" />
                              <strong style={{ color: '#166534', fontSize: '0.9rem' }}>
                                Job Assignment Confirmed
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                                (Agreed Payout: ₹{app.payment?.amount || app.proposedRate})
                              </span>
                            </div>

                            {/* Attendance status indicators */}
                            <div>
                              {isAttendanceVerified ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    padding: '3px 10px',
                                    borderRadius: '9999px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  <Check size={13} />
                                  Attendance Verified ({new Date(app.attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-primary-sm"
                                  style={{ background: '#2563eb' }}
                                  onClick={() => setCheckInApp(app)}
                                >
                                  <KeyRound size={13} />
                                  <span>Enter Arrival Check-In OTP</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Completion Proof & Two-Way Actions */}
                          <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                            {/* Visual Timeline */}
                            <WorkStatusTimeline
                              status={app.workCompletion?.status || 'in_progress'}
                              twoWayConfirmation={app.workCompletion?.twoWayConfirmation}
                            />

                            {/* Correction Requested Banner */}
                            {['correction_requested', 'revision_requested'].includes(app.workCompletion?.status) && (
                              <div
                                style={{
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '8px',
                                  padding: '0.75rem',
                                  margin: '0.5rem 0',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: 700, fontSize: '0.82rem' }}>
                                  <RotateCcw size={14} />
                                  <span>Employer Requested Corrections:</span>
                                </div>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#78350f' }}>
                                  "{app.workCompletion.revisionNotes || 'Please adjust the deliverables according to feedback.'}"
                                </p>
                              </div>
                            )}

                            {/* Dispute Under Review Banner */}
                            {['dispute_under_review', 'disputed'].includes(app.workCompletion?.status) && (
                              <div
                                style={{
                                  background: '#fff1f2',
                                  border: '1px solid #fecdd3',
                                  borderRadius: '8px',
                                  padding: '0.75rem',
                                  margin: '0.5rem 0',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#be123c', fontWeight: 700, fontSize: '0.82rem' }}>
                                  <AlertTriangle size={14} />
                                  <span>Dispute Under Admin Review:</span>
                                </div>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#881337' }}>
                                  "{app.workCompletion.disputeNotes || 'Dispute opened during completion review. Admin mediation active.'}"
                                </p>
                              </div>
                            )}

                            {/* Action Buttons Row */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                marginTop: '0.5rem',
                              }}
                            >
                              <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                                {['completed_confirmed', 'completed'].includes(app.workCompletion?.status) || app.status === 'completed' ? (
                                  <span style={{ fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={16} /> Work Confirmed &amp; Payment of ₹{app.payment?.amount || app.proposedRate} Released!
                                  </span>
                                ) : ['submitted_for_review', 'resubmitted_for_review'].includes(app.workCompletion?.status) ? (
                                  <span>📋 Deliverables submitted. Waiting for employer review.</span>
                                ) : ['correction_requested', 'revision_requested'].includes(app.workCompletion?.status) ? (
                                  <span style={{ color: '#b45309', fontWeight: 600 }}>Please make corrections and resubmit.</span>
                                ) : ['dispute_under_review', 'disputed'].includes(app.workCompletion?.status) ? (
                                  <span style={{ color: '#be123c', fontWeight: 600 }}>Mediation tribunal review in progress.</span>
                                ) : (
                                  <span>Submit completion report and before/after evidence once finished.</span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {/* Completed & Confirmed actions */}
                                {(['completed_confirmed', 'completed'].includes(app.workCompletion?.status) || app.status === 'completed') && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => setDetailsModalApp(app)}
                                    >
                                      <FileText size={13} />
                                      <span>View Dossier</span>
                                    </button>

                                    {!app.workCompletion?.ratings?.workerRated ? (
                                      <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#0F766E' }}
                                        onClick={() => setRatingModalApp(app)}
                                      >
                                        <Star size={13} fill="#fff" />
                                        <span>Rate Employer</span>
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, padding: '0.35rem' }}>
                                        ✓ Rated
                                      </span>
                                    )}
                                  </>
                                )}

                                {/* Correction requested actions */}
                                {['correction_requested', 'revision_requested'].includes(app.workCompletion?.status) && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-ghost-warning"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => setDisputeModalApp(app)}
                                    >
                                      <AlertTriangle size={13} />
                                      <span>Disagree / Concern</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#D97706', borderColor: '#D97706' }}
                                      onClick={() => setSubmitModalApp(app)}
                                    >
                                      <RotateCcw size={13} />
                                      <span>Fix &amp; Resubmit Work</span>
                                    </button>
                                  </>
                                )}

                                {/* Dispute under review actions */}
                                {['dispute_under_review', 'disputed'].includes(app.workCompletion?.status) && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => setDetailsModalApp(app)}
                                    >
                                      <FileText size={13} />
                                      <span>View Dossier</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-primary"
                                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: '#e11d48', borderColor: '#e11d48' }}
                                      onClick={() => setDisputeModalApp(app)}
                                    >
                                      <AlertTriangle size={13} />
                                      <span>Submit Defense Statement</span>
                                    </button>
                                  </>
                                )}

                                {/* Submitted for review actions */}
                                {['submitted_for_review', 'resubmitted_for_review'].includes(app.workCompletion?.status) && (
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                                    onClick={() => setDetailsModalApp(app)}
                                  >
                                    <FileText size={13} />
                                    <span>View Submitted Proof</span>
                                  </button>
                                )}

                                {/* Work not yet submitted */}
                                {!['completed_confirmed', 'completed', 'submitted_for_review', 'resubmitted_for_review', 'correction_requested', 'revision_requested', 'dispute_under_review', 'disputed'].includes(app.workCompletion?.status) && (
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', background: '#0F766E', color: '#fff', borderColor: '#0F766E' }}
                                    onClick={() => setSubmitModalApp(app)}
                                  >
                                    <CheckSquare size={14} />
                                    <span>Submit Work for Review</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Item Meta Footer */}
                      <div className="app-item-meta-foot">
                        <div className="meta-left-group">
                          <span className="proposed-rate-badge">
                            Offered Rate: <strong>₹{app.proposedRate}</strong>
                          </span>
                          <span className="meta-time-text">
                            <Clock size={13} />
                            Applied{' '}
                            {app.createdAt
                              ? new Date(app.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recently'}
                          </span>
                        </div>

                        <div className="meta-right-action" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-ghost-warning"
                            style={{
                              fontSize: '0.78rem',
                              padding: '3px 8px',
                              color: '#ea580c',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Raise Complaint or Dispute regarding this job"
                            onClick={() => setComplaintApp(app)}
                          >
                            <ShieldAlert size={12} color="#ea580c" />
                            <span>Report Issue</span>
                          </button>

                          {app.status !== 'cancelled' && app.status !== 'completed' && (
                            <button
                              type="button"
                              className="btn-ghost-danger"
                              style={{ fontSize: '0.78rem', padding: '3px 8px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => setCancelApp(app)}
                            >
                              Request Cancellation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-state-icon-box">
                  <FileText size={32} />
                </div>
                <h3>No Applications Found</h3>
                <p>You haven&apos;t submitted any proposals matching this filter tab.</p>
                <Link to="/find-gigs" className="btn-primary">
                  Find Work &amp; Submit Proposals
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL 1: WORKER COMMITMENT CONFIRMATION (Section 7A B)
          ========================================================================= */}
      {commitmentApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setCommitmentApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <ShieldCheck size={22} color="#2563eb" />
                <h3>Confirm Your Job Commitment</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCommitmentApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCommitmentSubmit} className="modal-form-body">
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Job Title:</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{commitmentApp.gig?.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Employer:</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    {commitmentApp.gig?.postedBy?.companyName || commitmentApp.gig?.postedBy?.name || 'Verified Employer'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Agreed Payment:</span>
                  <strong style={{ fontSize: '0.95rem', color: '#059669' }}>₹{commitmentApp.proposedRate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Location / Type:</span>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    {commitmentApp.gig?.jobType || 'On-site'} ({commitmentApp.gig?.address || 'Bengaluru'})
                  </strong>
                </div>
              </div>

              {/* Legal Confirmation Statement */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  fontSize: '0.84rem',
                  color: '#1e40af',
                  lineHeight: '1.5',
                  marginBottom: '1.25rem',
                }}
              >
                <strong>“Commitment Confirmation”</strong>
                <p style={{ margin: '0.35rem 0 0' }}>
                  I confirm that I have reviewed this job&apos;s date, time, location, responsibilities, and agreed payment. I intend to attend and perform the agreed work, subject to platform cancellation and safety policies.
                </p>
              </div>

              <div className="form-group-modern">
                <label>Choose Action *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${commitmentAction === 'confirm' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem' }}
                    onClick={() => setCommitmentAction('confirm')}
                  >
                    Confirm Job
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${commitmentAction === 'clarify' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem' }}
                    onClick={() => setCommitmentAction('clarify')}
                  >
                    Ask Clarification
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${commitmentAction === 'decline' ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.82rem', padding: '0.65rem 0.5rem', color: commitmentAction === 'decline' ? '#ffffff' : '#dc2626' }}
                    onClick={() => setCommitmentAction('decline')}
                  >
                    Decline Job
                  </button>
                </div>
              </div>

              <div className="form-group-modern">
                <label>
                  {commitmentAction === 'confirm' ? 'Confirmation Notes (Optional)' : 'Message / Reason *'}
                </label>
                <textarea
                  rows={3}
                  className="form-input-modern"
                  placeholder={
                    commitmentAction === 'confirm'
                      ? 'e.g. I have prepared the required tools and will arrive 10 minutes early.'
                      : 'Please specify reason or clarification question...'
                  }
                  value={commitmentNotes}
                  onChange={(e) => setCommitmentNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setCommitmentApp(null)}>
                  Close
                </button>
                <button type="submit" className="btn-save-primary" disabled={submittingCommitment}>
                  {submittingCommitment ? 'Saving Response...' : 'Submit Commitment Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ATTENDANCE ARRIVAL OTP CHECK-IN (Section 7A C)
          ========================================================================= */}
      {checkInApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setCheckInApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <KeyRound size={22} color="#2563eb" />
                <h3>Arrival Attendance Check-In</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCheckInApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="modal-form-body">
              <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                Enter the single-use 6-digit attendance code or QR token shown by the authorized employer at the jobsite.
              </p>

              <div className="form-group-modern">
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Single-Use Attendance Code *</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  style={{ fontSize: '1.5rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 800 }}
                  className="form-input-modern"
                  placeholder="e.g. 582194"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>Single-use and timestamped. Protected against replay.</span>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setCheckInApp(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-primary" disabled={submittingCheckIn}>
                  {submittingCheckIn ? 'Verifying...' : 'Verify Arrival Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: WORK COMPLETION PROOF SUBMISSION (Section 7A D)
          ========================================================================= */}
      {completionApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setCompletionApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <CheckSquare size={22} color="#2563eb" />
                <h3>Submit Work Completion Proof</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCompletionApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompletionSubmit} className="modal-form-body">
              <div className="form-group-modern">
                <label>Description of Tasks Completed *</label>
                <textarea
                  rows={4}
                  required
                  className="form-input-modern"
                  placeholder="Detail the completed work, verified test results, and any client instructions followed..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div className="form-group-modern">
                <label>Deliverable Output Link / Documentation URL (Optional)</label>
                <input
                  type="url"
                  className="form-input-modern"
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                />
              </div>

              <div className="form-group-modern">
                <label>Task Checklist Confirmation:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.4rem' }}>
                  {checklistItems.map((item, idx) => (
                    <label
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#f8fafc',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => {
                          const updated = [...checklistItems];
                          updated[idx].completed = e.target.checked;
                          setChecklistItems(updated);
                        }}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>{item.task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setCompletionApp(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-primary" disabled={submittingCompletion}>
                  {submittingCompletion ? 'Submitting...' : 'Submit Proof to Employer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CANCELLATION REQUEST (Section 7A F)
          ========================================================================= */}
      {cancelApp && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setCancelApp(null)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <AlertTriangle size={22} color="#dc2626" />
                <h3>Cancel Assignment</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCancelApp(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="modal-form-body">
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Please provide a transparent reason for cancellation. The employer will be notified immediately.
              </p>

              <div className="form-group-modern">
                <label>Cancellation Reason *</label>
                <textarea
                  rows={3}
                  required
                  className="form-input-modern"
                  placeholder="State the reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setCancelApp(null)}>
                  Back
                </button>
                <button type="submit" className="btn-danger-outline" disabled={submittingCancel}>
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: RAISE COMPLAINT / REPORT ISSUE (Section 10)
          ========================================================================= */}
      <RaiseComplaintModal
        isOpen={!!complaintApp}
        onClose={() => setComplaintApp(null)}
        relatedGig={complaintApp?.gig}
        reportedUser={complaintApp?.gig?.postedBy}
        onSuccess={() => {
          showToast('Complaint registered successfully with reference number.');
          setComplaintApp(null);
        }}
      />

      {/* =========================================================================
          TWO-WAY WORK COMPLETION & CONFIRMATION MODALS
          ========================================================================= */}
      {submitModalApp && (
        <SubmitWorkModal
          application={submitModalApp}
          onClose={() => setSubmitModalApp(null)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchApplications();
          }}
        />
      )}

      {detailsModalApp && (
        <WorkCompletionDetailsModal
          application={detailsModalApp}
          onClose={() => setDetailsModalApp(null)}
          onOpenResubmit={(app) => setSubmitModalApp(app)}
        />
      )}

      {disputeModalApp && (
        <DisputeDetailModal
          application={disputeModalApp}
          currentRole="worker"
          onClose={() => setDisputeModalApp(null)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchApplications();
          }}
        />
      )}

      {ratingModalApp && (
        <JobRatingModal
          application={ratingModalApp}
          currentRole="worker"
          onClose={() => setRatingModalApp(null)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchApplications();
          }}
        />
      )}
    </div>
  );
};

export default MyApplicationsPage;
