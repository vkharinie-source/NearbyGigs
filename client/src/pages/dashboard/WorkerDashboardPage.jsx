import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { workerService } from '../../services/workerService';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import { notificationService } from '../../services/notificationService';
import { earningService } from '../../services/earningService';
import { complaintService } from '../../services/complaintService';
import { safetyService } from '../../services/safetyService';
import { userService } from '../../services/userService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import {
  Briefcase,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Send,
  Star,
  Compass,
  FileText,
  Sparkles,
  ShieldCheck,
  X,
  Loader2,
  Calendar,
  ChevronRight,
  Building2,
  Bookmark,
  DollarSign,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import './Dashboard.css';
import SafeApplicationModal from '../../components/application/SafeApplicationModal';
import SubmitWorkModal from '../../components/work/SubmitWorkModal';

const WorkerDashboardPage = () => {
  const { user } = useAuthContext();
  const { location } = useLocationContext();
  const navigate = useNavigate();

  const [nearbyGigs, setNearbyGigs] = useState([]);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [savedGigs, setSavedGigs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState({
    totalEarned: 0,
    inEscrow: 0,
    pendingReview: 0,
  });

  const [activeTab, setActiveTab] = useState('gigs'); // 'gigs' | 'workers' | 'saved'
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Work Submission Modal State
  const [submitWorkApp, setSubmitWorkApp] = useState(null);

  // Apply Modal State
  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Service Booking Modal State
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [approvingDoc, setApprovingDoc] = useState(false);
  const { setUser } = useAuthContext();

  // Complaint / Grievance Modal State (To send complaint directly to Employer)
  const [complaintApp, setComplaintApp] = useState(null);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('job_condition');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const handleSimulateApproval = async () => {
    try {
      setApprovingDoc(true);
      await safetyService.approveVerification({ status: 'verified' });
      const freshUser = await userService.getUserProfile(user._id);
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
      showToast('🎉 Document verification approved! You can now apply for jobs.');
    } catch (err) {
      alert('Failed to simulate approval.');
    } finally {
      setApprovingDoc(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadWorkerDashboardData = async () => {
    try {
      setLoading(true);

      const [gigsRes, workersRes, myAppsRes, savedGigsRes, notifsRes, earningsRes] =
        await Promise.allSettled([
          gigService.getNearbyGigs({ lat: location.lat, lng: location.lng, radius: 50 }),
          workerService.getNearbyWorkers({ lat: location.lat, lng: location.lng, radius: 50 }),
          applicationService.getMyApplications(),
          gigService.getMySavedGigs(),
          notificationService.getNotifications(),
          earningService.getMyEarnings(),
        ]);

      const gigsList = gigsRes.status === 'fulfilled' ? gigsRes.value?.gigs || [] : [];
      const workersList = workersRes.status === 'fulfilled' ? workersRes.value?.workers || [] : [];
      const myAppsList = myAppsRes.status === 'fulfilled' ? myAppsRes.value?.applications || [] : [];
      const savedGigsList = savedGigsRes.status === 'fulfilled' ? savedGigsRes.value?.gigs || [] : [];
      const notifsList = notifsRes.status === 'fulfilled' ? notifsRes.value?.notifications || [] : [];
      const earningsData = earningsRes.status === 'fulfilled' ? earningsRes.value?.summary : null;

      setNearbyGigs(gigsList);
      setNearbyWorkers(workersList);
      setMyApplications(myAppsList);
      setSavedGigs(savedGigsList);

      if (earningsData) {
        setEarningsSummary(earningsData);
      }

      if (notifsList.length > 0) {
        setActivities(notifsList.slice(0, 5));
      } else {
        const fallbacks = [];
        myAppsList.slice(0, 3).forEach((a) => {
          fallbacks.push({
            _id: a._id,
            title: `Proposal: ${a.gig?.title || 'Gig'}`,
            message: `Status: ${(a.status || 'Submitted').toUpperCase()} (Bid ₹${a.proposedRate})`,
            createdAt: a.createdAt,
          });
        });
        setActivities(fallbacks);
      }
    } catch (err) {
      console.error('Error fetching worker dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerDashboardData();
  }, [location.lat, location.lng]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Apply Modal
  const handleOpenApplyModal = (gigObj) => {
    setSelectedGig(gigObj);
    setProposedRate(gigObj.budgetMin || 500);
    setProposal('');
  };

  // Submit Safe Application with verified criteria
  const handleSafeApplySubmit = async ({ proposedRate: rate, proposal: pitch, tier, criteriaAccepted }) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingApply(true);
    try {
      await applicationService.applyForGig({
        gigId: selectedGig._id,
        proposal: pitch,
        proposedRate: Number(rate),
        estimatedTime: selectedGig.duration || '2-3 Hours',
        suitabilityProof: {
          tier,
          criteriaAccepted,
          availabilityConfirmed: true,
        },
      });
      setSelectedGig(null);
      showToast('🛡️ Verified Proposal Submitted! All safety & eligibility criteria accepted.');
      loadWorkerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Open Book Worker Modal
  const handleOpenRequestModal = (workerObj) => {
    setSelectedWorker(workerObj);
    setOfferedPrice(workerObj.startingPrice || 500);
    setRequestNote('');
  };

  // Submit Book Worker Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingRequest(true);
    try {
      await requestService.createRequest({
        serviceId: selectedWorker._id,
        note: requestNote,
        offeredPrice: Number(offeredPrice),
        requestedDate: 'Today',
      });
      setSelectedWorker(null);
      showToast('Service booking request sent to specialist!');
      loadWorkerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send service booking request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Open Complaint Modal against Employer
  const handleOpenComplaintModal = (app) => {
    setComplaintApp(app);
    setComplaintTitle(`Grievance regarding job: ${app.gig?.title || 'Job Posting'}`);
    setComplaintDesc('');
    setComplaintCategory('job_condition');
  };

  // Submit Complaint to Employer
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintDesc.trim() || !complaintApp) return;
    setSubmittingComplaint(true);
    try {
      await complaintService.createComplaint({
        title: complaintTitle.trim(),
        description: complaintDesc.trim(),
        category: complaintCategory,
        gigId: complaintApp.gig?._id || complaintApp.gig,
        reportedParty: complaintApp.gig?.employer?._id || complaintApp.gig?.employer,
        severity: 'high',
      });
      showToast('⚠️ Grievance filed! Sent immediately to the Employer Dashboard for prompt rectification.');
      setComplaintApp(null);
      loadWorkerDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to file grievance.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Confirmed upcoming work for worker
  const upcomingConfirmedJobs = myApplications.filter(
    (a) => a.commitment?.status === 'confirmed' || a.status === 'accepted'
  );

  // Awaiting confirmation for worker
  const awaitingConfirmationJobs = myApplications.filter(
    (a) => a.commitment?.status === 'awaiting_worker_confirmation'
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
              1. PERSONALIZED WORKER WELCOME BANNER
              ================================================== */}
          <section className="dash-welcome-card animate-fade-in" style={{ borderLeft: '4px solid #0F766E' }}>
            <div className="welcome-text-col">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <div className="welcome-badge-pill" style={{ background: '#E6FFFA', color: '#0F766E', borderColor: '#99F6E4' }}>
                  <Sparkles size={13} />
                  <span>WORKER &amp; TALENT DASHBOARD</span>
                </div>

                {user?.kycStatus === 'verified' && (
                  <span
                    className="welcome-badge-pill"
                    style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}
                  >
                    <ShieldCheck size={13} /> Identity Verified
                  </span>
                )}

                {user?.isStudent && (
                  <span
                    className="welcome-badge-pill"
                    style={{ background: '#ede9fe', color: '#6d28d9', borderColor: '#ddd6fe' }}
                  >
                    <GraduationCap size={13} /> Student Safe
                  </span>
                )}
              </div>

              <h2>
                {getGreeting()}, {user?.name || 'Talent'} 👋
              </h2>
              <p className="welcome-subtext">
                Explore local jobs and track your applications in <strong>{location.address || 'Bengaluru, Karnataka'}</strong>.
              </p>
            </div>

            <div className="welcome-actions-row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link to="/find-gigs" className="btn-primary" style={{ background: '#0F766E', borderColor: '#0F766E' }}>
                <Compass size={16} />
                <span>Find Nearby Gigs</span>
              </Link>

              <Link
                to="/my-applications"
                className="btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#2563eb',
                  borderColor: '#bfdbfe',
                  background: '#fff',
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <FileText size={15} />
                <span>My Applications ({myApplications.length})</span>
              </Link>

              <Link
                to="/safety"
                className="btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  background: '#fff',
                  fontWeight: 600,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <ShieldAlert size={15} color="#2563eb" />
                <span>Safety Center</span>
              </Link>
            </div>
          </section>

          {/* ==================================================
              CATEGORY DOCUMENT VERIFICATION STATUS BANNER (Section 4 & 5)
              ================================================== */}
          <div
            style={{
              background:
                user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                  ? '#f0fdf4'
                  : user?.studentVerificationStatus === 'pending' || user?.kycStatus === 'pending'
                  ? '#fffbeb'
                  : '#f8fafc',
              border: `1.5px solid ${
                user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                  ? '#86efac'
                  : user?.studentVerificationStatus === 'pending' || user?.kycStatus === 'pending'
                  ? '#fde68a'
                  : '#cbd5e1'
              }`,
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              margin: '0.5rem 0 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background:
                    user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                      ? '#dcfce7'
                      : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified' ? (
                  <ShieldCheck size={26} color="#15803d" />
                ) : (
                  <ShieldAlert size={26} color="#b45309" />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Category: {(user?.userType || 'Worker').replace('_', ' ').toUpperCase()} •{' '}
                    {user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                      ? 'Verified & Approved'
                      : user?.studentVerificationStatus === 'pending' || user?.kycStatus === 'pending'
                      ? 'Documents Under Review'
                      : 'Verification Incomplete'}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background:
                        user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                          ? '#bbf7d0'
                          : '#fed7aa',
                      color:
                        user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                          ? '#14532d'
                          : '#9a3412',
                    }}
                  >
                    {user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                      ? 'READY TO APPLY'
                      : 'APPLICATIONS LOCKED'}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                  {user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified'
                    ? 'Your credentials have been verified by an authorized reviewer. You are eligible to apply for jobs and submit proposals.'
                    : 'Required category documents must be approved before you can apply for jobs. Pending verifications cannot submit proposals.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {!(user?.kycStatus === 'verified' || user?.studentVerificationStatus === 'verified') && (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate('/onboarding')}
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    Upload Documents
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSimulateApproval}
                    disabled={approvingDoc}
                    style={{
                      background: '#15803d',
                      borderColor: '#15803d',
                      fontSize: '0.82rem',
                      padding: '6px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Simulate Reviewer / Admin Approval"
                  >
                    {approvingDoc ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Simulate Approval</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ==================================================
              ACTION NEEDED BANNER (Awaiting Confirmation)
              ================================================== */}
          {awaitingConfirmationJobs.length > 0 && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
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
                <h4 style={{ color: '#92400e', fontSize: '1rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
                  ⚡ Action Required: {awaitingConfirmationJobs.length} Job Offer(s) Awaiting Confirmation
                </h4>
                <p style={{ color: '#78350f', fontSize: '0.85rem', margin: 0 }}>
                  You were selected for &quot;{awaitingConfirmationJobs[0].gig?.title}&quot;. Confirm your commitment to secure the assignment.
                </p>
              </div>

              <Link
                to="/my-applications"
                className="btn-save-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                Review &amp; Confirm Offer <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* ==================================================
              2. WORKER KPI METRICS
              ================================================== */}
          <section className="kpi-metrics-grid">
            <div className="kpi-card" onClick={() => navigate('/find-gigs')}>
              <div className="kpi-icon-wrapper icon-blue">
                <Briefcase size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{nearbyGigs.length}</span>
                <span className="kpi-label">Active Gigs Near You</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/my-applications')}>
              <div className="kpi-icon-wrapper icon-emerald">
                <FileText size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{myApplications.length}</span>
                <span className="kpi-label">My Applications</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/my-applications')}>
              <div className="kpi-icon-wrapper icon-indigo">
                <CheckCircle2 size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{upcomingConfirmedJobs.length}</span>
                <span className="kpi-label">Confirmed Jobs</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/safety?tab=earnings')}>
              <div className="kpi-icon-wrapper icon-amber">
                <DollarSign size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">₹{earningsSummary.totalEarned}</span>
                <span className="kpi-label">Verified Payout (₹{earningsSummary.inEscrow} in Escrow)</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>
          </section>

          {/* ==================================================
              3. MY APPLICATIONS & EMPLOYER VERIFICATION TRACKER
              ================================================== */}
          <section className="dash-card">
            <div className="card-section-header" style={{ marginBottom: '1.25rem' }}>
              <div className="title-with-icon">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>My Application &amp; Approval Status</h3>
                  <p className="card-subtitle" style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Important: You can only attend the work site once the Employer verifies your profile and accepts your hire.
                  </p>
                </div>
              </div>
              <Link to="/my-applications" className="link-see-all">
                <span>View all ({myApplications.length})</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {myApplications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {myApplications.slice(0, 4).map((app) => {
                  const isAccepted = app.status === 'accepted' || app.commitment?.status === 'confirmed';
                  const isRejected = app.status === 'rejected';
                  const isPending = !isAccepted && !isRejected;

                  return (
                    <div
                      key={app._id}
                      className={`app-tracker-card ${isAccepted ? 'accepted' : isPending ? 'pending' : 'rejected'}`}
                    >
                      <div className="app-tracker-main-info">
                        <div className="app-tracker-head-row">
                          <span className="badge-category">{app.gig?.category || 'Task'}</span>
                          <h4 className="app-tracker-title">
                            {app.gig?.title || 'Job Opening'}
                          </h4>
                          <span className="app-tracker-bid-badge">
                            Bid: ₹{app.proposedRate}
                          </span>
                        </div>

                        <div className="app-tracker-meta-row">
                          <span>Employer: <strong style={{ color: '#0F172A' }}>{app.gig?.employer?.name || 'Job Poster'}</strong></span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={13} color="#0F766E" />
                            {app.gig?.address || 'Bengaluru'}
                          </span>
                        </div>

                        {/* Status Explanatory Box */}
                        <div className={`app-tracker-status-box ${isAccepted ? 'accepted' : isPending ? 'pending' : 'rejected'}`}>
                          {isPending && (
                            <>
                              <Clock size={14} />
                              <span>Pending Employer Review: Verification in progress. Please wait for employer approval before reporting to work.</span>
                            </>
                          )}
                          {isAccepted && (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Approved &amp; Confirmed! You are authorized to attend. Ask employer for the arrival OTP on site.</span>
                            </>
                          )}
                          {isRejected && (
                            <>
                              <X size={14} />
                              <span>Proposal Not Selected: The client opted for another applicant.</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="app-tracker-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenComplaintModal(app)}
                          title="Report this job or employer for immediate rectification"
                          style={{
                            padding: '7px 12px',
                            fontSize: '0.78rem',
                            color: '#DC2626',
                            border: '1px solid #FECDD3',
                            background: '#FFF1F2',
                            fontWeight: 700,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>Report Employer</span>
                        </button>

                        <Link
                          to="/my-applications"
                          className="btn-primary-sm"
                          style={{
                            padding: '7px 16px',
                            fontSize: '0.8rem',
                            background: '#0F766E',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          <span>View Details</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                <Info size={28} color="#2563eb" style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800 }}>No Proposals Submitted Yet</h4>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: '#64748b' }}>
                  Browse nearby gigs below and apply. Once an employer reviews and accepts your proposal, your confirmed schedule will appear here.
                </p>
                <Link to="/find-gigs" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                  <Compass size={14} /> Browse Nearby Gigs
                </Link>
              </div>
            )}
          </section>

          {/* ==================================================
              UPCOMING CONFIRMED WORK STRIP
              ================================================== */}
          {upcomingConfirmedJobs.length > 0 && (
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-section-header">
                <div className="title-with-icon">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#4F46E5" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Upcoming Confirmed Work</h3>
                    <p className="card-subtitle" style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                      Scheduled job assignments requiring arrival attendance OTP
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                {upcomingConfirmedJobs.map((job) => (
                  <div
                    key={job._id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge-category">{job.gig?.category || 'Task'}</span>
                        <strong style={{ color: '#0F766E', fontSize: '1rem', fontWeight: 800 }}>₹{job.proposedRate}</strong>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#0F172A' }}>{job.gig?.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#0F766E" />
                        <span>{job.gig?.address || 'Indiranagar, Bengaluru'}</span>
                      </p>
                    </div>

                    <div style={{ marginTop: '1.1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: ['completed_confirmed', 'completed'].includes(job.workCompletion?.status)
                            ? '#047857'
                            : ['submitted_for_review', 'resubmitted_for_review'].includes(job.workCompletion?.status)
                            ? '#ca8a04'
                            : ['correction_requested', 'revision_requested'].includes(job.workCompletion?.status)
                            ? '#b45309'
                            : job.attendance?.status === 'attendance_verified'
                            ? '#047857'
                            : '#B45309',
                          background: ['completed_confirmed', 'completed'].includes(job.workCompletion?.status)
                            ? '#ECFDF5'
                            : ['submitted_for_review', 'resubmitted_for_review'].includes(job.workCompletion?.status)
                            ? '#fefce8'
                            : ['correction_requested', 'revision_requested'].includes(job.workCompletion?.status)
                            ? '#fffbeb'
                            : job.attendance?.status === 'attendance_verified'
                            ? '#ECFDF5'
                            : '#FFFBEB',
                          border: '1px solid',
                          borderColor: ['completed_confirmed', 'completed'].includes(job.workCompletion?.status)
                            ? '#A7F3D0'
                            : ['submitted_for_review', 'resubmitted_for_review'].includes(job.workCompletion?.status)
                            ? '#fef08a'
                            : ['correction_requested', 'revision_requested'].includes(job.workCompletion?.status)
                            ? '#fde68a'
                            : job.attendance?.status === 'attendance_verified'
                            ? '#A7F3D0'
                            : '#FDE68A',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {['completed_confirmed', 'completed'].includes(job.workCompletion?.status) ? (
                          <>
                            <CheckCircle2 size={12} /> Confirmed &amp; Paid
                          </>
                        ) : ['submitted_for_review', 'resubmitted_for_review'].includes(job.workCompletion?.status) ? (
                          <>
                            <Clock size={12} /> Review Pending
                          </>
                        ) : ['correction_requested', 'revision_requested'].includes(job.workCompletion?.status) ? (
                          <>
                            <RotateCcw size={12} /> Correction Requested
                          </>
                        ) : job.attendance?.status === 'attendance_verified' ? (
                          <>
                            <CheckCircle2 size={12} /> Checked In
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> Check-In Pending
                          </>
                        )}
                      </span>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!['completed_confirmed', 'completed', 'submitted_for_review', 'resubmitted_for_review'].includes(job.workCompletion?.status) ? (
                          <button
                            type="button"
                            onClick={() => setSubmitWorkApp(job)}
                            className="btn-primary-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              background: '#0F766E',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Submit Work</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <Link
                            to="/my-applications"
                            className="btn-primary-sm"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              background: '#0F766E',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================
              4. WORKER TWO-COLUMN: DISCOVERY TABS & RADAR MAP
              ================================================== */}
          <div className="dashboard-two-column-layout">
            {/* Left Column: Worker Discovery Hub */}
            <section className="dash-card discovery-column-card">
              <div className="discovery-header-tabs">
                <div className="tabs-pill-box">
                  <button
                    className={`tab-btn ${activeTab === 'gigs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gigs')}
                  >
                    <Briefcase size={16} />
                    <span>Nearby Gigs ({nearbyGigs.length})</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'workers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workers')}
                  >
                    <Users size={16} />
                    <span>Specialists ({nearbyWorkers.length})</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                  >
                    <Bookmark size={16} />
                    <span>Saved ({savedGigs.length})</span>
                  </button>
                </div>

                <Link
                  to={activeTab === 'gigs' ? '/find-gigs' : activeTab === 'saved' ? '/find-gigs' : '/find-workers'}
                  className="link-see-all"
                >
                  <span>See all</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* GIGS TAB CONTENT */}
              {activeTab === 'gigs' && (
                <div className="discovery-cards-list">
                  {loading ? (
                    <div className="skeleton-card">
                      <div className="skeleton-shimmer skeleton-title" />
                      <div className="skeleton-shimmer skeleton-line" />
                    </div>
                  ) : nearbyGigs.length > 0 ? (
                    nearbyGigs.slice(0, 5).map((gig) => (
                      <div key={gig._id} className="dash-gig-item">
                        <div className="item-header-row">
                          <span className="badge-category">{gig.category}</span>
                          <span className="budget-tag-pill">
                            ₹{gig.budgetMin} {gig.budgetMax !== gig.budgetMin ? `- ₹${gig.budgetMax}` : ''}
                          </span>
                        </div>

                        <h4 className="item-title">{gig.title}</h4>
                        <p className="item-desc">{gig.description}</p>

                        <div className="item-footer-row">
                          <span className="item-meta-info">
                            <MapPin size={13} color="#2563eb" />
                            {gig.address || 'Bengaluru'}
                          </span>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenApplyModal(gig)}
                          >
                            <span>Apply Proposal</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <Briefcase size={28} />
                      <h3>No Gigs Near Your Immediate Coordinates</h3>
                      <p>Check back shortly or expand search radius to see opportunities.</p>
                      <Link to="/find-gigs" className="btn-primary">
                        Browse All Gigs
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* SPECIALISTS TAB */}
              {activeTab === 'workers' && (
                <div className="discovery-cards-list">
                  {loading ? (
                    <div className="skeleton-card">
                      <div className="skeleton-shimmer skeleton-title" />
                      <div className="skeleton-shimmer skeleton-line" />
                    </div>
                  ) : nearbyWorkers.length > 0 ? (
                    nearbyWorkers.slice(0, 4).map((w) => (
                      <div key={w._id} className="dash-worker-item">
                        <div className="worker-header-group">
                          <div className="worker-avatar-small">
                            {w.worker?.name ? w.worker.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <h4 className="worker-name-heading">{w.worker?.name || 'Local Pro'}</h4>
                            <span className="worker-specialty-sub">{w.title}</span>
                          </div>
                          <div className="rating-pill-sm">
                            <Star size={12} className="star-icon-filled" />
                            <span>{w.worker?.rating || 4.9}</span>
                          </div>
                        </div>

                        <p className="item-desc">{w.description}</p>

                        <div className="item-footer-row">
                          <span className="rate-start-badge">
                            ₹{w.startingPrice} <small>/ start</small>
                          </span>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenRequestModal(w)}
                          >
                            <span>Book Specialist</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <Users size={28} />
                      <h3>No Specialists Found Nearby</h3>
                      <p>Publish your availability to receive bookings from neighborhood clients.</p>
                      <Link to="/profile" className="btn-primary">
                        Set Up Worker Profile
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* SAVED JOBS TAB */}
              {activeTab === 'saved' && (
                <div className="discovery-cards-list">
                  {savedGigs.length > 0 ? (
                    savedGigs.map((sg) => (
                      <div key={sg._id} className="dash-gig-item">
                        <div className="item-header-row">
                          <span className="badge-category">{sg.category}</span>
                          <span className="budget-tag-pill">₹{sg.budgetMin} - ₹{sg.budgetMax}</span>
                        </div>
                        <h4 className="item-title">{sg.title}</h4>
                        <div className="item-footer-row" style={{ marginTop: '0.5rem' }}>
                          <span className="item-meta-info">
                            <MapPin size={13} color="#2563eb" />
                            {sg.address || 'Bengaluru'}
                          </span>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenApplyModal(sg)}
                          >
                            <span>Apply Proposal</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <Bookmark size={28} />
                      <h3>No Saved Bookmarks</h3>
                      <p>Browse gigs and click the bookmark icon to save jobs for later evaluation.</p>
                      <Link to="/find-gigs" className="btn-primary">
                        Find Gigs to Save
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Right Column: Radar Map & Activity */}
            <div className="radar-column-stack">
              <section className="dash-card radar-map-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <MapPin size={20} color="#2563eb" />
                    <div>
                      <h3>Neighborhood Geofenced Radar</h3>
                      <p className="card-subtitle">Real-time geo-pinned requests in your radius</p>
                    </div>
                  </div>
                </div>

                <div className="radar-map-wrapper">
                  <LocationMap
                    center={[location.lat, location.lng]}
                    zoom={12}
                    gigs={nearbyGigs}
                    workers={nearbyWorkers}
                    height="320px"
                  />
                </div>
              </section>

              {/* Recent Activity Feed */}
              <section className="dash-card recent-activity-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <Clock size={20} color="#2563eb" />
                    <div>
                      <h3>Recent Activity</h3>
                      <p className="card-subtitle">Verified status changes &amp; notifications</p>
                    </div>
                  </div>
                </div>

                <div className="activity-feed-list">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act._id} className="activity-row-item">
                        <div className="activity-icon-bullet">
                          <CheckCircle2 size={15} color="#2563eb" />
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
                      <p>No recent activity yet. Submit a proposal to get started.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Multi-Tier Criteria Safe Application Modal */}
          <SafeApplicationModal
            gig={selectedGig}
            user={user}
            isOpen={!!selectedGig}
            onClose={() => setSelectedGig(null)}
            onSubmit={handleSafeApplySubmit}
            isSubmitting={submittingApply}
          />

          {/* Report Employer / File Grievance Modal */}
          {complaintApp && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setComplaintApp(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                style={{ maxWidth: '520px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <ShieldAlert size={20} color="#dc2626" />
                    <h3>Report Employer / File Dispute</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setComplaintApp(null)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleComplaintSubmit} className="modal-form-body">
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.85rem', marginBottom: '1rem', color: '#991b1b', fontSize: '0.82rem' }}>
                    ⚠️ This grievance will immediately trigger an urgent rectification alert on the Employer&apos;s Dashboard with strict SLA resolution requirements.
                  </div>

                  <div className="form-group-modern">
                    <label>Job Title</label>
                    <input
                      type="text"
                      disabled
                      className="form-input-modern"
                      value={complaintApp.gig?.title || 'Job Posting'}
                      style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Grievance Category *</label>
                    <select
                      className="form-input-modern"
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                    >
                      <option value="job_condition">Work Condition / Scope Mismatch</option>
                      <option value="payment_delay">Payment / Escrow Issue</option>
                      <option value="attendance_issue">Attendance / Check-in Problem</option>
                      <option value="unprofessional_behavior">Harassment / Unprofessional Behavior</option>
                      <option value="other">Other Dispute</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Explain the Issue *</label>
                    <textarea
                      rows={4}
                      required
                      className="form-input-modern"
                      placeholder="Describe what occurred with this employer and what rectification you require..."
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setComplaintApp(null)}
                      disabled={submittingComplaint}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingComplaint}
                      style={{ background: '#dc2626', borderColor: '#dc2626' }}
                    >
                      {submittingComplaint ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Filing Grievance...</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>Submit to Employer Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Inline Book Worker Modal */}
          {selectedWorker && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setSelectedWorker(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <Users size={20} color="#2563eb" />
                    <h3>Book Specialist {selectedWorker.worker?.name || 'Local Pro'}</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedWorker(null)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} className="modal-form-body">
                  <div className="info-box-pill" style={{ marginBottom: '1rem' }}>
                    {selectedWorker.title} (Starting at ₹{selectedWorker.startingPrice})
                  </div>

                  <div className="form-group-modern">
                    <label>Offered Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      className="form-input-modern"
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Job Description / Location Note *</label>
                    <textarea
                      rows={3}
                      required
                      className="form-input-modern"
                      placeholder="Describe what you need fixed and your preferred timing..."
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setSelectedWorker(null)}
                      disabled={submittingRequest}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingRequest}
                      style={{ background: '#2563eb', borderColor: '#2563eb' }}
                    >
                      {submittingRequest ? 'Sending...' : 'Send Booking Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TWO-WAY WORK COMPLETION MODAL */}
          {submitWorkApp && (
            <SubmitWorkModal
              application={submitWorkApp}
              onClose={() => setSubmitWorkApp(null)}
              onSuccess={(msg) => {
                setToastMessage(msg);
                // Refresh applications
                applicationService.getMyApplications().then((d) => setMyApplications(d.applications || []));
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default WorkerDashboardPage;
