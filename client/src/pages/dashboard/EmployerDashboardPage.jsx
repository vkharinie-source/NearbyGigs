import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { workerService } from '../../services/workerService';
import { applicationService } from '../../services/applicationService';
import { notificationService } from '../../services/notificationService';
import { complaintService } from '../../services/complaintService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  X,
  Loader2,
  ChevronRight,
  Check,
  KeyRound,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import './Dashboard.css';
import ReviewWorkModal from '../../components/work/ReviewWorkModal';

const EmployerDashboardPage = () => {
  const { user } = useAuthContext();
  const { location } = useLocationContext();
  const navigate = useNavigate();

  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Work Review Modal State (Two-Way Work Verification)
  const [reviewWorkApp, setReviewWorkApp] = useState(null);

  // Attendance Code Modal State (Employer verification)
  const [activeCodeApp, setActiveCodeApp] = useState(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [codeExpiry, setCodeExpiry] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [receivedApplications, setReceivedApplications] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [activities, setActivities] = useState([]);

  // Complaint & Rectification State
  const [complaints, setComplaints] = useState([]);
  const [rectifyingComplaint, setRectifyingComplaint] = useState(null);
  const [rectificationText, setRectificationText] = useState('');
  const [submittingRectification, setSubmittingRectification] = useState(false);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadEmployerDashboardData = async () => {
    try {
      setLoading(true);

      const [workersRes, receivedAppsRes, myGigsRes, notifsRes, complaintsRes] =
        await Promise.allSettled([
          workerService.getNearbyWorkers({ lat: location.lat, lng: location.lng, radius: 50 }),
          applicationService.getReceivedApplications(),
          gigService.getMyGigs(),
          notificationService.getNotifications(),
          complaintService.getMyComplaints(),
        ]);

      const workersList = workersRes.status === 'fulfilled' ? workersRes.value?.workers || [] : [];
      const receivedAppsList = receivedAppsRes.status === 'fulfilled' ? receivedAppsRes.value?.applications || [] : [];
      const myGigsList = myGigsRes.status === 'fulfilled' ? myGigsRes.value?.gigs || [] : [];
      const notifsList = notifsRes.status === 'fulfilled' ? notifsRes.value?.notifications || [] : [];
      const complaintsData = complaintsRes.status === 'fulfilled' ? complaintsRes.value?.complaints || [] : [];

      setNearbyWorkers(workersList);
      setReceivedApplications(receivedAppsList);
      setMyGigs(myGigsList);
      setComplaints(complaintsData);

      if (notifsList.length > 0) {
        setActivities(notifsList.slice(0, 5));
      } else {
        const fallbacks = [];
        receivedAppsList.slice(0, 3).forEach((a) => {
          fallbacks.push({
            _id: a._id,
            title: `Applicant: ${a.applicant?.name || 'Candidate'}`,
            message: `Applied for ${a.gig?.title || 'Job'} (Proposed ₹${a.proposedRate})`,
            createdAt: a.createdAt,
          });
        });
        setActivities(fallbacks);
      }
    } catch (err) {
      console.error('Error fetching employer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployerDashboardData();
  }, [location.lat, location.lng]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Employer handlers
  const handleApproveApplication = async (appId) => {
    try {
      setUpdatingAppId(appId);
      await applicationService.updateApplicationStatus(appId, 'accepted');
      showToast('🎉 Candidate approved! They have been notified to confirm commitment.');
      loadEmployerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve candidate.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleDeclineApplication = async (appId) => {
    try {
      setUpdatingAppId(appId);
      await applicationService.updateApplicationStatus(appId, 'rejected');
      showToast('Proposal declined.');
      loadEmployerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline proposal.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleGenerateAttendanceCode = async (app) => {
    setActiveCodeApp(app);
    setGeneratingCode(true);
    try {
      const data = await applicationService.generateAttendanceCode(app._id);
      setGeneratedOtp(data.attendance?.otp || '582194');
      setCodeExpiry(
        data.attendance?.expiresAt
          ? new Date(data.attendance.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '20 minutes'
      );
      showToast('Single-use arrival check-in OTP generated for worker attendance.');
      loadEmployerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate attendance code.');
      setActiveCodeApp(null);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleOpenRectify = (complaint) => {
    setRectifyingComplaint(complaint);
    setRectificationText('');
  };

  const handleSubmitRectification = async (e) => {
    e?.preventDefault();
    if (!rectificationText.trim() || !rectifyingComplaint) return;
    try {
      setSubmittingRectification(true);
      await complaintService.resolveComplaint(rectifyingComplaint._id, {
        resolutionSummary: rectificationText.trim(),
        correctiveAction: 'Issue rectified and resolution directly confirmed between parties.',
      });
      showToast(`Complaint [${rectifyingComplaint.complaintId}] rectified and marked resolved!`);
      setRectifyingComplaint(null);
      setRectificationText('');
      loadEmployerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rectification.');
    } finally {
      setSubmittingRectification(false);
    }
  };

  // Pending candidate proposals for employer to review and approve
  const pendingReceivedApps = receivedApplications.filter(
    (a) => a.status === 'submitted' || a.status === 'under_review' || a.status === 'pending'
  );

  // Confirmed hired candidates for employer
  const confirmedHiredApps = receivedApplications.filter(
    (a) => a.commitment?.status === 'confirmed' || a.status === 'accepted'
  );

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content dashboard-page">
          {/* TOAST ALERT */}
          {toastMessage && (
            <div className="profile-toast animate-slide-down">
              <CheckCircle2 size={18} color="#10b981" />
              <span>{toastMessage}</span>
              <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* ==================================================
              1. PERSONALIZED EMPLOYER WELCOME BANNER
              ================================================== */}
          <section className="dash-welcome-card animate-fade-in" style={{ borderLeft: '4px solid #0F766E' }}>
            <div className="welcome-text-col">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <div className="welcome-badge-pill" style={{ background: '#E6FFFA', color: '#0F766E', borderColor: '#99F6E4' }}>
                  <Sparkles size={13} />
                  <span>EMPLOYER &amp; HIRING MANAGEMENT HUB</span>
                </div>

                {user?.kycStatus === 'verified' && (
                  <span
                    className="welcome-badge-pill"
                    style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}
                  >
                    <ShieldCheck size={13} /> Verified Employer
                  </span>
                )}
              </div>

              <h2>
                {getGreeting()}, {user?.name || 'Employer'} 👋
              </h2>
              <p className="welcome-subtext">
                Manage job postings, review applicant proposals, and verify on-site worker attendance in <strong>{location.address || 'Bengaluru, Karnataka'}</strong>.
              </p>
            </div>

            <div className="welcome-actions-row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/create-gig" className="btn-primary" style={{ background: '#0F766E', borderColor: '#0F766E' }}>
                <PlusCircle size={16} />
                <span>Post a New Job</span>
              </Link>

              <Link
                to="/my-complaints"
                className="btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                  background: '#fff',
                  fontWeight: 600,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <ShieldAlert size={15} color="#dc2626" />
                <span>Complaints &amp; Disputes ({complaints.length})</span>
              </Link>
            </div>
          </section>

          {/* ==================================================
              ACTION NEEDED BANNER (Proposals Pending Review)
              ================================================== */}
          {pendingReceivedApps.length > 0 && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '14px',
                padding: '1.25rem',
                margin: '0.5rem 0 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h4 style={{ color: '#166534', fontSize: '1rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
                  ⚡ Action Required: {pendingReceivedApps.length} Candidate Proposal(s) Awaiting Your Review
                </h4>
                <p style={{ color: '#15803d', fontSize: '0.85rem', margin: 0 }}>
                  Candidates have applied to your active jobs. Review their bids and approve them to initiate work assignments.
                </p>
              </div>

              <Link
                to="/applications/received"
                className="btn-save-primary"
                style={{ background: '#0F766E', borderColor: '#0F766E', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                Review All Proposals ({receivedApplications.length})
              </Link>
            </div>
          )}

          {/* ==================================================
              2. EMPLOYER KPI METRICS
              ================================================== */}
          <section className="kpi-metrics-grid">
            <div className="kpi-card" onClick={() => navigate('/my-gigs')}>
              <div className="kpi-icon-wrapper icon-emerald">
                <Building2 size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{myGigs.length}</span>
                <span className="kpi-label">My Posted Jobs</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/applications/received')}>
              <div className="kpi-icon-wrapper icon-blue">
                <Users size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{receivedApplications.length}</span>
                <span className="kpi-label">Applications Received</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/applications/received')}>
              <div className="kpi-icon-wrapper icon-indigo">
                <Clock size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{confirmedHiredApps.length}</span>
                <span className="kpi-label">Confirmed Assignments</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/applications/received')}>
              <div className="kpi-icon-wrapper icon-amber">
                <FileCheck size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">
                  {
                    receivedApplications.filter((a) =>
                      ['submitted_for_review', 'resubmitted_for_review', 'completion_submitted'].includes(
                        a.workCompletion?.status
                      )
                    ).length
                  }
                </span>
                <span className="kpi-label">Work Proofs to Review</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>
          </section>

          {/* ==================================================
              REVIEW COMPLETED WORK (SECTION 3: TWO-WAY WORKFLOW)
              ================================================== */}
          {receivedApplications.filter((a) =>
            ['submitted_for_review', 'resubmitted_for_review', 'completion_submitted'].includes(
              a.workCompletion?.status
            )
          ).length > 0 && (
            <section className="dash-card animate-fade-in" style={{ borderLeft: '4px solid #F59E0B', marginBottom: '1.5rem' }}>
              <div className="card-section-header" style={{ marginBottom: '1rem' }}>
                <div className="title-with-icon">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      Review Completed Work
                    </h3>
                    <p className="card-subtitle" style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Workers have submitted completion proofs and photo evidence. Review to Accept, Request Correction, or Raise Dispute.
                    </p>
                  </div>
                </div>

                <span className="work-status-badge status-submitted_for_review">
                  {receivedApplications.filter((a) =>
                    ['submitted_for_review', 'resubmitted_for_review', 'completion_submitted'].includes(
                      a.workCompletion?.status
                    )
                  ).length} Awaiting Verification
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {receivedApplications
                  .filter((a) =>
                    ['submitted_for_review', 'resubmitted_for_review', 'completion_submitted'].includes(
                      a.workCompletion?.status
                    )
                  )
                  .map((app) => (
                    <div
                      key={app._id}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #FDE68A',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: '4px' }}>
                            {app.gig?.title || 'Job Assignment'}
                          </span>
                          <strong style={{ color: '#0F766E', fontSize: '1rem', fontWeight: 800 }}>
                            ₹{app.payment?.amount || app.proposedRate}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.5rem 0' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                            {app.applicant?.name?.charAt(0) || 'W'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                              {app.applicant?.name || 'Assigned Worker'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              Submitted: {app.workCompletion?.submittedAt ? new Date(app.workCompletion.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </div>
                          </div>
                        </div>

                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.84rem', color: '#475569', background: '#F8FAFC', padding: '0.65rem', borderRadius: '6px', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{app.workCompletion?.taskDescription || 'Worker submitted task deliverables.'}"
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                          <span>📸 {(app.workCompletion?.beforePhotos?.length || 0) + (app.workCompletion?.afterPhotos?.length || 0)} Proof Photos</span>
                          <span>•</span>
                          <span>🔗 {app.workCompletion?.deliverableLinks?.length || 0} Links</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-work-primary"
                          onClick={() => setReviewWorkApp(app)}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                        >
                          <ShieldCheck size={15} />
                          <span>Review Completed Work</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* ==================================================
              3. EMPLOYER TWO-COLUMN: MANAGEMENT & RADAR MAP
              ================================================== */}
          <div className="dashboard-two-column-layout">
            {/* Left Column: Employer Management Hub */}
            <section className="dash-card discovery-column-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Section 1: Candidate Applications Awaiting Approval */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        Candidate Proposals to Review &amp; Approve
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Only approved candidates are authorized to attend and start your job
                      </p>
                    </div>
                  </div>

                  <Link to="/applications/received" className="link-see-all">
                    <span>View all ({receivedApplications.length})</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {pendingReceivedApps.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pendingReceivedApps.map((app) => (
                      <div
                        key={app._id}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #fed7aa',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1rem',
                              }}
                            >
                              {app.applicant?.name ? app.applicant.name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                                  {app.applicant?.name || 'Local Worker'}
                                </strong>
                                {app.applicant?.kycStatus === 'verified' && (
                                  <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    Verified
                                  </span>
                                )}
                                {app.applicant?.isStudent && (
                                  <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    Student
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                                Applied for: <strong style={{ color: '#1e293b' }}>{app.gig?.title || 'Your Job Posting'}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ background: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.95rem', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                              Bid: ₹{app.proposedRate}
                            </span>
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', marginBottom: '0.85rem', borderLeft: '3px solid #f59e0b' }}>
                          &quot;{app.proposal}&quot;
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeclineApplication(app._id)}
                            disabled={updatingAppId === app._id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#64748b',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <X size={14} color="#dc2626" />
                            <span>Decline</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveApplication(app._id)}
                            disabled={updatingAppId === app._id}
                            style={{
                              background: '#059669',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.45rem 1.15rem',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                            }}
                          >
                            {updatingAppId === app._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={15} />
                            )}
                            <span>Verify &amp; Confirm Hire (Authorize Work)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.75rem', textAlign: 'center' }}>
                    <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      All Candidate Proposals Evaluated
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                      No pending applicant proposals. When workers apply for your posted jobs, their proposals will appear here for your review and approval before they can attend the job.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2: My Posted Jobs */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        My Posted Jobs ({myGigs.length})
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Active jobs and applicant counts
                      </p>
                    </div>
                  </div>

                  <Link to="/my-gigs" className="link-see-all">
                    <span>Manage All</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {myGigs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {myGigs.slice(0, 4).map((gig) => (
                      <div
                        key={gig._id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                            <span className="badge-category">{gig.category}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: gig.status === 'open' ? '#ecfdf5' : '#f1f5f9', color: gig.status === 'open' ? '#059669' : '#64748b' }}>
                              {(gig.status || 'OPEN').toUpperCase()}
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                            {gig.title}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            <MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />
                            {gig.address || 'Bengaluru'} • ₹{gig.budgetMin} - ₹{gig.budgetMax}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            to={`/applications/received?gigId=${gig._id}`}
                            className="btn-outline"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                          >
                            <Users size={13} />
                            <span>View Proposals ({gig.applicantsCount || 0})</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                    <Building2 size={28} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800 }}>No Posted Jobs Yet</h4>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b' }}>
                      Post a job opening to connect with skilled neighborhood workers and students.
                    </p>
                    <Link to="/create-gig" className="btn-primary" style={{ background: '#059669', borderColor: '#059669', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <PlusCircle size={14} /> Post Your First Job
                    </Link>
                  </div>
                )}
              </div>

              {/* Section 3: Confirmed & Hired Workers */}
              {confirmedHiredApps.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Confirmed &amp; Hired Workers ({confirmedHiredApps.length})
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Approved workers ready to arrive for job assignments
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {confirmedHiredApps.map((hired) => (
                      <div
                        key={hired._id}
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#166534' }}>
                            {hired.applicant?.name || 'Worker'}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#475569', marginLeft: '6px' }}>
                            for &quot;{hired.gig?.title}&quot;
                          </span>
                          <div style={{ fontSize: '0.78rem', color: hired.attendance?.status === 'attendance_verified' ? '#059669' : '#d97706', fontWeight: 700, marginTop: '2px' }}>
                            {hired.attendance?.status === 'attendance_verified' ? '✓ Checked In & Working' : '⏳ Arrival Attendance Check-In Pending'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {hired.attendance?.status !== 'attendance_verified' && (
                            <button
                              type="button"
                              className="btn-primary-sm"
                              onClick={() => handleGenerateAttendanceCode(hired)}
                              style={{ background: '#059669', borderColor: '#059669', padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                            >
                              <KeyRound size={12} />
                              <span>Generate Arrival OTP</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Live Complaints & Issues to Rectify (Employer Hub) */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        Job Issues &amp; Rectification Center
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                        Complaints raised regarding jobs or workers — rectify and resolve directly
                      </p>
                    </div>
                  </div>

                  <Link to="/my-complaints" className="link-see-all">
                    <span>View All ({complaints.length})</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {complaints.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {complaints.map((c) => {
                      const isPending = c.status !== 'resolved' && c.status !== 'closed';
                      return (
                        <div
                          key={c._id}
                          style={{
                            background: '#ffffff',
                            border: isPending ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '1rem',
                            boxShadow: isPending ? '0 2px 8px rgba(220, 38, 38, 0.08)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                            <div>
                              <span
                                style={{
                                  background: isPending ? '#fef2f2' : '#ecfdf5',
                                  color: isPending ? '#dc2626' : '#059669',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {c.status.replace(/_/g, ' ')}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>
                                Ref: {c.complaintId}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                            {c.title}
                          </h4>
                          <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                            {c.description}
                          </p>

                          <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem' }}>
                            <strong>Complainant: </strong> {c.complainant?.name || 'User'} &nbsp;|&nbsp; 
                            <strong> Reported: </strong> {c.reportedParty?.name || 'Target'}
                          </div>

                          {c.resolutionSummary && (
                            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#065f46', marginBottom: '0.75rem' }}>
                              <strong>Resolution / Rectification: </strong> {c.resolutionSummary}
                            </div>
                          )}

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleOpenRectify(c)}
                              style={{
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <Check size={14} /> Rectify &amp; Resolve Complaint
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                    <CheckCircle2 size={20} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    No active complaints or issues reported on your posted jobs.
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Radar Map of Specialists & Recent Activity */}
            <div className="radar-column-stack">
              <section className="dash-card radar-map-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <MapPin size={20} color="#059669" />
                    <div>
                      <h3>Specialists Available Near You</h3>
                      <p className="card-subtitle">Real-time geo-pinned specialists ready to work</p>
                    </div>
                  </div>
                </div>

                <div className="radar-map-wrapper">
                  <LocationMap
                    center={[location.lat, location.lng]}
                    zoom={12}
                    workers={nearbyWorkers}
                    height="320px"
                  />
                </div>
              </section>

              {/* Recent Activity Feed */}
              <section className="dash-card recent-activity-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <Clock size={20} color="#059669" />
                    <div>
                      <h3>Recent Hiring Activity</h3>
                      <p className="card-subtitle">Candidate updates &amp; alerts</p>
                    </div>
                  </div>
                </div>

                <div className="activity-feed-list">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act._id} className="activity-row-item">
                        <div className="activity-icon-bullet" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <CheckCircle2 size={15} color="#059669" />
                        </div>
                        <div className="activity-info">
                          <span className="activity-title-text">{act.title}</span>
                          <span className="activity-message-text">{act.message}</span>
                          <span className="activity-time-stamp">
                            {act.createdAt
                              ? new Date(act.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-activity-text">
                      <Clock size={28} color="#94a3b8" />
                      <p>No recent activity yet. When candidates apply to your jobs, updates will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Attendance Code Modal (Employer) */}
          {activeCodeApp && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setActiveCodeApp(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                style={{ maxWidth: '420px', textAlign: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <KeyRound size={20} color="#059669" />
                    <h3>Arrival Attendance Code</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setActiveCodeApp(null)}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem 0' }}>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Share this 6-digit OTP with <strong>{activeCodeApp.applicant?.name || 'the worker'}</strong> when they arrive on-site to verify attendance:
                  </p>

                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '2px dashed #86efac',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'inline-block',
                      letterSpacing: '8px',
                      fontSize: '2.2rem',
                      fontWeight: 900,
                      color: '#15803d',
                      fontFamily: 'monospace',
                      marginBottom: '1rem',
                    }}
                  >
                    {generatedOtp}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Code valid until {codeExpiry}
                  </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn-save-primary"
                    style={{ background: '#059669', borderColor: '#059669', width: '100%', justifyContent: 'center' }}
                    onClick={() => setActiveCodeApp(null)}
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rectify & Resolve Complaint Modal */}
          {rectifyingComplaint && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setRectifyingComplaint(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                style={{ maxWidth: '500px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <ShieldAlert size={20} color="#dc2626" />
                    <h3>Rectify &amp; Resolve Complaint</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setRectifyingComplaint(null)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitRectification} style={{ padding: '1rem 0 0' }}>
                  <div style={{ background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '3px solid #dc2626' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#991b1b', display: 'block' }}>
                      {rectifyingComplaint.title}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                      {rectifyingComplaint.description}
                    </span>
                  </div>

                  <div className="form-group-modern">
                    <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      Rectification &amp; Resolution Notes *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="form-textarea-modern"
                      placeholder="Explain how the issue was fixed, work corrected, or agreed settlement..."
                      value={rectificationText}
                      onChange={(e) => setRectificationText(e.target.value)}
                      style={{ width: '100%', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setRectifyingComplaint(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRectification || !rectificationText.trim()}
                      className="btn-save-primary"
                      style={{ background: '#059669', borderColor: '#059669' }}
                    >
                      {submittingRectification ? 'Submitting...' : 'Confirm & Mark Rectified'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* REVIEW COMPLETED WORK MODAL */}
          {reviewWorkApp && (
            <ReviewWorkModal
              application={reviewWorkApp}
              onClose={() => setReviewWorkApp(null)}
              onSuccess={(msg) => {
                showToast(msg);
                loadEmployerDashboardData();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default EmployerDashboardPage;
