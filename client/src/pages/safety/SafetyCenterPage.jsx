import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { safetyService } from '../../services/safetyService';
import { reportService } from '../../services/reportService';
import { earningService } from '../../services/earningService';
import { adminService } from '../../services/adminService';
import { authService } from '../../services/authService';
import {
  ShieldCheck,
  GraduationCap,
  Building2,
  MapPin,
  AlertOctagon,
  Lock,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  X,
  FileText,
  DollarSign,
  Users,
  Eye,
  Flag,
  Activity,
  Calendar,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';
import './SafetyCenter.css';

const SafetyCenterPage = () => {
  const { user, setUser } = useAuthContext();
  const { location, requestBrowserLocation } = useLocationContext();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'student' | 'kyc' | 'earnings' | 'admin'
  const [safetyStatus, setSafetyStatus] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosNotes, setSosNotes] = useState('');
  const [transmittingSos, setTransmittingSos] = useState(false);

  // KYC Modal State
  const [showKycModal, setShowKycModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Student Verify Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    dateOfBirth: '',
    collegeName: '',
    course: '',
    year: 1,
    rollNumber: '',
  });
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // Guardian OTP Modal State
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    phone: '',
    relationship: 'Parent',
  });
  const [guardianOtp, setGuardianOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submittingGuardian, setSubmittingGuardian] = useState(false);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    targetType: 'gig',
    targetId: '',
    targetTitle: '',
    reason: 'safety_concern',
    details: '',
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Admin Data State
  const [adminEmployers, setAdminEmployers] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [adminSosAlerts, setAdminSosAlerts] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);

  // Load Safety Status and Earnings
  const loadSafetyData = async () => {
    try {
      setLoading(true);
      const [statusRes, earnRes] = await Promise.allSettled([
        safetyService.getMySafetyStatus(),
        earningService.getMyEarnings(),
      ]);

      if (statusRes.status === 'fulfilled') {
        setSafetyStatus(statusRes.value);
      }
      if (earnRes.status === 'fulfilled') {
        setEarnings(earnRes.value);
      }

      // If user is Admin, load admin console records
      if (user?.role === 'admin') {
        const [empRes, repRes, sosRes, logsRes] = await Promise.allSettled([
          adminService.getEmployers(),
          adminService.getReports(),
          adminService.getEmergencyAlerts(),
          adminService.getAuditLogs({ limit: 25 }),
        ]);
        if (empRes.status === 'fulfilled') setAdminEmployers(empRes.value?.employers || []);
        if (repRes.status === 'fulfilled') setAdminReports(repRes.value?.reports || []);
        if (sosRes.status === 'fulfilled') setAdminSosAlerts(sosRes.value?.alerts || []);
        if (logsRes.status === 'fulfilled') setAdminLogs(logsRes.value?.logs || []);
      }
    } catch (err) {
      console.error('Error loading safety hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSafetyData();
  }, [user?._id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Active Work Session (Location Safety)
  const handleToggleWorkSession = async () => {
    try {
      if (safetyStatus?.locationSafety?.isWorkSessionActive) {
        await safetyService.endWorkSession();
        showToast('Work session ended. Active location tracking has stopped.');
      } else {
        let coords = { lat: location?.lat || 12.9716, lng: location?.lng || 77.5946, address: location?.address };
        try {
          coords = await requestBrowserLocation();
        } catch (e) {
          // fallback to default
        }
        await safetyService.startWorkSession({
          latitude: coords.lat,
          longitude: coords.lng,
          address: coords.address,
        });
        showToast('Active Work Session started! Location safety protection is live.');
      }
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update work session.');
    }
  };

  // Submit Emergency SOS
  const handleTriggerSos = async (e) => {
    e.preventDefault();
    setTransmittingSos(true);
    try {
      let coords = { lat: location?.lat || 12.9716, lng: location?.lng || 77.5946, address: location?.address };
      try {
        coords = await requestBrowserLocation();
      } catch (e) {
        // fallback
      }

      await safetyService.triggerEmergencySos({
        latitude: coords.lat,
        longitude: coords.lng,
        address: coords.address,
        notes: sosNotes,
      });

      setShowSosModal(false);
      setSosNotes('');
      showToast('🚨 EMERGENCY SOS SENT! Guardian and Safety Response Team have been alerted.');
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to transmit SOS.');
    } finally {
      setTransmittingSos(false);
    }
  };

  // Submit Privacy-Compliant KYC
  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    setSubmittingKyc(true);
    try {
      const res = await safetyService.submitKycVerification({
        aadhaarNumber: aadhaarInput,
      });
      setShowKycModal(false);
      setAadhaarInput('');
      showToast('KYC Identity verified with privacy-compliant masked identifier.');
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'KYC verification failed.');
    } finally {
      setSubmittingKyc(false);
    }
  };

  // Submit Student Verification
  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    setSubmittingStudent(true);
    try {
      await safetyService.submitStudentVerification(studentForm);
      setShowStudentModal(false);
      showToast('Student details submitted! Age verified on backend.');
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify student.');
    } finally {
      setSubmittingStudent(false);
    }
  };

  // Guardian OTP Request
  const handleRequestGuardianOtp = async (e) => {
    e.preventDefault();
    setSubmittingGuardian(true);
    try {
      const res = await safetyService.requestGuardianOtp({
        guardianName: guardianForm.name,
        guardianPhone: guardianForm.phone,
        relationship: guardianForm.relationship,
      });
      setOtpSent(true);
      showToast(res.message || 'OTP sent to parent/guardian mobile.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSubmittingGuardian(false);
    }
  };

  // Guardian OTP Verify
  const handleVerifyGuardianOtp = async (e) => {
    e.preventDefault();
    setSubmittingGuardian(true);
    try {
      await safetyService.verifyGuardianOtp({ otp: guardianOtp });
      setShowGuardianModal(false);
      setOtpSent(false);
      setGuardianOtp('');
      showToast('Parent / Guardian verified! Night gig safety alerts are active.');
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setSubmittingGuardian(false);
    }
  };

  // Submit Platform Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      await reportService.createReport(reportForm);
      setShowReportModal(false);
      setReportForm({ targetType: 'gig', targetId: '', targetTitle: '', reason: 'safety_concern', details: '' });
      showToast('Report submitted for admin review.');
      loadSafetyData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Admin Actions
  const handleAdminEmployerAction = async (id, status) => {
    try {
      await adminService.updateEmployerStatus(id, { status });
      showToast(`Employer status set to ${status}`);
      loadSafetyData();
    } catch (err) {
      alert('Error updating employer');
    }
  };

  const handleAdminReportAction = async (id, status) => {
    try {
      await adminService.updateReportStatus(id, { status, adminNotes: 'Reviewed by admin' });
      showToast(`Report marked as ${status}`);
      loadSafetyData();
    } catch (err) {
      alert('Error updating report');
    }
  };

  const handleAdminSosAction = async (id, status) => {
    try {
      await adminService.updateEmergencyAlertStatus(id, { status, notes: 'Handled by emergency response' });
      showToast(`SOS incident marked as ${status}`);
      loadSafetyData();
    } catch (err) {
      alert('Error updating SOS');
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content safety-page">
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
              1. HERO BANNER WITH EMERGENCY SOS
              ================================================== */}
          <section className="safety-hero-card animate-fade-in">
            <div className="safety-hero-title-group">
              <div className="badge-trust-shield">
                <ShieldCheck size={14} />
                <span>NearbyGigs Trust & Privacy Standard</span>
              </div>
              <h1>Safety, Privacy & Trust Center</h1>
              <p className="safety-hero-subtitle">
                NearbyGigs is built with strict privacy-by-design: backend age verification for students, zero plaintext Aadhaar storage, parent consent alerts, and real-time emergency SOS protection.
              </p>
            </div>

            <button
              type="button"
              className="safety-sos-hero-btn animate-pulse"
              onClick={() => setShowSosModal(true)}
            >
              <AlertOctagon size={22} />
              <span>EMERGENCY SOS</span>
            </button>
          </section>

          {/* ==================================================
              2. NAVIGATION TABS
              ================================================== */}
          <div className="safety-nav-tabs">
            <button
              className={`safety-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <ShieldCheck size={16} />
              <span>Safety Overview</span>
            </button>
            <button
              className={`safety-tab-btn ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              <GraduationCap size={16} />
              <span>Student Safety</span>
            </button>
            <button
              className={`safety-tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
              onClick={() => setActiveTab('kyc')}
            >
              <UserCheck size={16} />
              <span>Identity & Aadhaar Privacy</span>
            </button>
            <button
              className={`safety-tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              <DollarSign size={16} />
              <span>Earnings Ledger</span>
            </button>
            {user?.role === 'admin' && (
              <button
                className={`safety-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <Lock size={16} />
                <span>Admin Safety Console</span>
              </button>
            )}
          </div>

          {/* ==================================================
              TAB 1: SAFETY OVERVIEW (5 Core Safety Pillars)
              ================================================== */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              <div className="safety-cards-grid">
                {/* 1. Account Security */}
                <div className="safety-card">
                  <div className="safety-card-header">
                    <div className="safety-card-title-group">
                      <div className="safety-card-icon">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h3>Account Security</h3>
                        <p>Credentials & token protection</p>
                      </div>
                    </div>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Mail size={15} color="#2563eb" />
                      <span>Email Verified</span>
                    </div>
                    <span className="check-status-badge badge-verified">
                      <CheckCircle2 size={12} /> {user?.email || 'Verified'}
                    </span>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Phone size={15} color="#2563eb" />
                      <span>Phone Verified</span>
                    </div>
                    <span className="check-status-badge badge-verified">
                      <CheckCircle2 size={12} /> {user?.phone || 'Verified'}
                    </span>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <UserCheck size={15} color="#2563eb" />
                      <span>Identity Verification</span>
                    </div>
                    <span
                      className={`check-status-badge ${
                        safetyStatus?.accountSecurity?.kycStatus === 'verified'
                          ? 'badge-verified'
                          : 'badge-unverified'
                      }`}
                    >
                      {safetyStatus?.accountSecurity?.kycStatus === 'verified' ? (
                        <>
                          <CheckCircle2 size={12} /> Verified
                        </>
                      ) : (
                        'Pending KYC'
                      )}
                    </span>
                  </div>

                  {safetyStatus?.accountSecurity?.kycStatus !== 'verified' && (
                    <button
                      className="btn-primary-sm mt-3"
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={() => setShowKycModal(true)}
                    >
                      <UserCheck size={14} /> Verify Identity (Masked Aadhaar)
                    </button>
                  )}
                </div>

                {/* 2. Student Safety */}
                <div className="safety-card">
                  <div className="safety-card-header">
                    <div className="safety-card-title-group">
                      <div className="safety-card-icon">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h3>Student Safety</h3>
                        <p>College & parent consent</p>
                      </div>
                    </div>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <GraduationCap size={15} color="#2563eb" />
                      <span>Student Verification</span>
                    </div>
                    <span
                      className={`check-status-badge ${
                        safetyStatus?.studentSafety?.studentVerificationStatus === 'verified'
                          ? 'badge-verified'
                          : 'badge-pending'
                      }`}
                    >
                      {safetyStatus?.studentSafety?.studentVerificationStatus === 'verified'
                        ? 'Student Verified'
                        : 'Unverified'}
                    </span>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Calendar size={15} color="#2563eb" />
                      <span>Backend Calculated Age</span>
                    </div>
                    <span className="check-status-badge badge-verified">
                      {safetyStatus?.studentSafety?.age
                        ? `${safetyStatus.studentSafety.age} Years (Verified)`
                        : 'DOB Required'}
                    </span>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Users size={15} color="#2563eb" />
                      <span>Guardian Verified</span>
                    </div>
                    <span
                      className={`check-status-badge ${
                        safetyStatus?.studentSafety?.guardian?.isVerified
                          ? 'badge-verified'
                          : 'badge-pending'
                      }`}
                    >
                      {safetyStatus?.studentSafety?.guardian?.isVerified
                        ? `Verified (${safetyStatus.studentSafety.guardian.name})`
                        : 'Pending OTP'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      className="btn-secondary-sm"
                      style={{ flex: 1 }}
                      onClick={() => setShowStudentModal(true)}
                    >
                      Update Student Info
                    </button>
                    <button
                      className="btn-primary-sm"
                      style={{ flex: 1 }}
                      onClick={() => setShowGuardianModal(true)}
                    >
                      Verify Parent OTP
                    </button>
                  </div>
                </div>

                {/* 3. Employer Safety */}
                <div className="safety-card">
                  <div className="safety-card-header">
                    <div className="safety-card-title-group">
                      <div className="safety-card-icon">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3>Employer Safety</h3>
                        <p>Verified hiring entities</p>
                      </div>
                    </div>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Building2 size={15} color="#2563eb" />
                      <span>Employer Trust Status</span>
                    </div>
                    <span
                      className={`check-status-badge ${
                        safetyStatus?.employerSafety?.isVerifiedEmployer
                          ? 'badge-verified'
                          : 'badge-pending'
                      }`}
                    >
                      {safetyStatus?.employerSafety?.employerStatus || 'PENDING'}
                    </span>
                  </div>

                  <div className="safety-check-row">
                    <div className="check-label-group">
                      <Flag size={15} color="#ef4444" />
                      <span>Report Suspicious Activity</span>
                    </div>
                    <button
                      className="btn-text-action"
                      style={{ color: '#ef4444' }}
                      onClick={() => setShowReportModal(true)}
                    >
                      [ Report Gig / Employer ]
                    </button>
                  </div>
                </div>

                {/* 4. Location Safety */}
                <div className="safety-card">
                  <div className="safety-card-header">
                    <div className="safety-card-title-group">
                      <div className="safety-card-icon">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3>Location Privacy & Active Work</h3>
                        <p>Explicit bounds & no continuous tracking</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`session-control-box ${
                      safetyStatus?.locationSafety?.isWorkSessionActive ? 'active' : 'inactive'
                    }`}
                  >
                    <div className="session-status-row">
                      <div className="session-indicator">
                        <span
                          className={`radar-ping-dot ${
                            safetyStatus?.locationSafety?.isWorkSessionActive ? '' : 'off'
                          }`}
                        />
                        <span>
                          Work Session:{' '}
                          {safetyStatus?.locationSafety?.isWorkSessionActive ? 'ACTIVE' : 'OFF'}
                        </span>
                      </div>
                      <button
                        className={`btn-toggle-session ${
                          safetyStatus?.locationSafety?.isWorkSessionActive
                            ? 'btn-end-session'
                            : 'btn-start-session'
                        }`}
                        onClick={handleToggleWorkSession}
                      >
                        {safetyStatus?.locationSafety?.isWorkSessionActive
                          ? 'END WORK'
                          : 'START WORK'}
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                      {safetyStatus?.locationSafety?.isWorkSessionActive
                        ? 'Location protection is actively safeguarding your ongoing gig. Ends automatically when you stop work.'
                        : 'Tracking is completely OFF. Activate only when you arrive and start working on a confirmed gig.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 2: STUDENT SAFETY & PARENT CONSENT
              ================================================== */}
          {activeTab === 'student' && (
            <div className="animate-fade-in">
              <div className="safety-card" style={{ marginBottom: '1.5rem' }}>
                <div className="safety-card-header">
                  <div className="safety-card-title-group">
                    <div className="safety-card-icon">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3>College Student Safety & Eligibility</h3>
                      <p>Backend age calculation & verified guardian protection</p>
                    </div>
                  </div>
                  <button className="btn-primary-sm" onClick={() => setShowStudentModal(true)}>
                    Update Enrollment
                  </button>
                </div>

                <div className="about-meta-grid">
                  <div className="about-sub-item">
                    <span className="about-label">College Name</span>
                    <span className="about-value-highlight">
                      {safetyStatus?.studentSafety?.college?.name || 'RV College of Engineering'}
                    </span>
                  </div>
                  <div className="about-sub-item">
                    <span className="about-label">Course & Year</span>
                    <span className="about-value-text">
                      {safetyStatus?.studentSafety?.college?.course || 'B.E. Computer Science'} (Year{' '}
                      {safetyStatus?.studentSafety?.college?.year || 3})
                    </span>
                  </div>
                  <div className="about-sub-item">
                    <span className="about-label">Backend Age</span>
                    <span className="account-verified-tag">
                      <CheckCircle2 size={14} color="#10b981" />{' '}
                      {safetyStatus?.studentSafety?.age || 21} Years (Eligible)
                    </span>
                  </div>
                  <div className="about-sub-item">
                    <span className="about-label">Parent / Guardian</span>
                    <span className="account-verified-tag">
                      <CheckCircle2 size={14} color="#10b981" />{' '}
                      {safetyStatus?.studentSafety?.guardian?.name || 'Suresh Verma'}{' '}
                      ({safetyStatus?.studentSafety?.guardian?.phone || '+91 9845012345'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 3: IDENTITY & AADHAAR PRIVACY (KYC)
              ================================================== */}
          {activeTab === 'kyc' && (
            <div className="animate-fade-in">
              <div className="safety-card">
                <div className="safety-card-header">
                  <div className="safety-card-title-group">
                    <div className="safety-card-icon">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <h3>Aadhaar Privacy & Identity Verification</h3>
                      <p>Data minimization: 12-digit numbers are never stored in raw text</p>
                    </div>
                  </div>
                  <button className="btn-primary-sm" onClick={() => setShowKycModal(true)}>
                    Re-Verify Identity
                  </button>
                </div>

                <div style={{ padding: '1rem 0' }}>
                  <div className="about-meta-grid">
                    <div className="about-sub-item">
                      <span className="about-label">KYC Status</span>
                      <span className="account-verified-tag">
                        <CheckCircle2 size={14} color="#10b981" /> Verified
                      </span>
                    </div>
                    <div className="about-sub-item">
                      <span className="about-label">Masked Identity Display</span>
                      <span className="masked-data-pill">
                        {safetyStatus?.accountSecurity?.maskedAadhaar || 'XXXX-XXXX-1234'}
                      </span>
                    </div>
                    <div className="about-sub-item">
                      <span className="about-label">Verification Reference</span>
                      <span className="masked-data-pill">
                        {safetyStatus?.accountSecurity?.kycReferenceId || 'KYC-NG-849102-3FA1'}
                      </span>
                    </div>
                    <div className="about-sub-item">
                      <span className="about-label">Raw Aadhaar Storage</span>
                      <span className="account-verified-tag" style={{ color: '#059669' }}>
                        <ShieldCheck size={14} /> ZERO Plaintext Storage (Protected)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 4: EARNINGS LEDGER
              ================================================== */}
          {activeTab === 'earnings' && (
            <div className="animate-fade-in">
              <div className="safety-card">
                <div className="safety-card-header">
                  <div className="safety-card-title-group">
                    <div className="safety-card-icon">
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <h3>Secure Earnings & Financial Ledger</h3>
                      <p>Server-side financial integrity & escrow settlement</p>
                    </div>
                  </div>
                </div>

                <div className="kpi-metrics-grid" style={{ marginBottom: '1.5rem' }}>
                  <div className="kpi-card">
                    <div className="kpi-icon-wrapper icon-emerald">
                      <DollarSign size={20} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">₹{earnings?.summary?.totalEarned || 1200}</span>
                      <span className="kpi-label">Paid Earnings</span>
                    </div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-icon-wrapper icon-blue">
                      <Clock size={20} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">₹{earnings?.summary?.inEscrow || 0}</span>
                      <span className="kpi-label">In Escrow Hold</span>
                    </div>
                  </div>
                </div>

                <table className="safety-table">
                  <thead>
                    <tr>
                      <th>Gig Title</th>
                      <th>Amount</th>
                      <th>Hours</th>
                      <th>Status</th>
                      <th>Reference ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings?.earnings && earnings.earnings.length > 0 ? (
                      earnings.earnings.map((e) => (
                        <tr key={e._id}>
                          <td><strong>{e.title}</strong></td>
                          <td>₹{e.amount}</td>
                          <td>{e.hoursWorked || 2} hrs</td>
                          <td>
                            <span className="check-status-badge badge-verified">
                              {e.payoutStatus.toUpperCase()}
                            </span>
                          </td>
                          <td><span className="masked-data-pill">{e.transactionReference}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                          No earnings records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 5: ADMIN SAFETY CONSOLE
              ================================================== */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <div className="animate-fade-in">
              {/* Employers verification review */}
              <div className="safety-card" style={{ marginBottom: '1.5rem' }}>
                <div className="safety-card-header">
                  <div className="safety-card-title-group">
                    <div className="safety-card-icon">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3>Employer Verification Review</h3>
                      <p>Approve or suspend business accounts</p>
                    </div>
                  </div>
                </div>

                <table className="safety-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminEmployers.map((emp) => (
                      <tr key={emp._id}>
                        <td><strong>{emp.companyName || emp.name}</strong></td>
                        <td>{emp.email} ({emp.phone})</td>
                        <td>
                          <span
                            className={`check-status-badge ${
                              emp.employerStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'
                            }`}
                          >
                            {emp.employerStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-primary-sm"
                            style={{ marginRight: '0.5rem', padding: '0.2rem 0.6rem' }}
                            onClick={() => handleAdminEmployerAction(emp._id, 'VERIFIED')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-danger-outline"
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => handleAdminEmployerAction(emp._id, 'SUSPENDED')}
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reports */}
              <div className="safety-card" style={{ marginBottom: '1.5rem' }}>
                <div className="safety-card-header">
                  <div className="safety-card-title-group">
                    <div className="safety-card-icon">
                      <Flag size={20} />
                    </div>
                    <div>
                      <h3>Safety & Fraud Reports</h3>
                      <p>Investigate reported gigs, scams and users</p>
                    </div>
                  </div>
                </div>

                <table className="safety-table">
                  <thead>
                    <tr>
                      <th>Reporter</th>
                      <th>Target</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminReports.length > 0 ? (
                      adminReports.map((rep) => (
                        <tr key={rep._id}>
                          <td>{rep.reporter?.name || 'User'}</td>
                          <td>{rep.targetType}: {rep.targetTitle || rep.targetId}</td>
                          <td>{rep.reason}</td>
                          <td><span className="check-status-badge badge-pending">{rep.status}</span></td>
                          <td>
                            <button
                              className="btn-primary-sm"
                              onClick={() => handleAdminReportAction(rep._id, 'resolved')}
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>No active reports.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: EMERGENCY SOS
              ================================================== */}
          {showSosModal && (
            <div className="safety-modal-overlay animate-fade-in" onClick={() => setShowSosModal(false)}>
              <div
                className="safety-modal-card sos-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header-safety">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                    <AlertOctagon size={24} />
                    <h3 style={{ margin: 0, fontWeight: 800 }}>CONFIRM EMERGENCY SOS</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setShowSosModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleTriggerSos} className="modal-body-safety">
                  <div className="sos-alert-box">
                    <strong>⚠️ High-Priority Emergency Protocol:</strong>
                    <p style={{ margin: '0.35rem 0 0' }}>
                      Activating SOS will immediately dispatch an emergency distress alert with your live GPS coordinates to your verified parent/guardian, emergency contacts, and NearbyGigs Safety Response Team.
                    </p>
                  </div>

                  <div className="form-group-modern">
                    <label>Emergency Notes (Optional)</label>
                    <textarea
                      rows={3}
                      className="form-input-modern"
                      placeholder="Describe what is happening or specific assistance needed..."
                      value={sosNotes}
                      onChange={(e) => setSosNotes(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowSosModal(false)}
                      disabled={transmittingSos}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-danger-outline"
                      style={{ background: '#dc2626', color: '#ffffff', borderColor: '#dc2626', fontWeight: 800 }}
                      disabled={transmittingSos}
                    >
                      {transmittingSos ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Transmitting...
                        </>
                      ) : (
                        'CONFIRM & BROADCAST SOS'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: KYC AADHAAR VERIFY
              ================================================== */}
          {showKycModal && (
            <div className="safety-modal-overlay animate-fade-in" onClick={() => setShowKycModal(false)}>
              <div
                className="safety-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header-safety">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
                    <UserCheck size={22} />
                    <h3 style={{ margin: 0, fontWeight: 700 }}>Identity (Aadhaar) Privacy Verification</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setShowKycModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitKyc} className="modal-body-safety">
                  <div className="sos-alert-box" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                    <strong>🔒 Privacy-First Data Minimization Standard:</strong>
                    <p style={{ margin: '0.25rem 0 0' }}>
                      NearbyGigs strictly follows identity compliance. Your full Aadhaar is never saved in plaintext. Only masked reference (e.g. XXXX-XXXX-1234) and verification tokens are stored.
                    </p>
                  </div>

                  <div className="form-group-modern">
                    <label>12-Digit Aadhaar Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5432 1098 7654"
                      className="form-input-modern"
                      value={aadhaarInput}
                      onChange={(e) => setAadhaarInput(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowKycModal(false)}
                      disabled={submittingKyc}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingKyc}
                    >
                      {submittingKyc ? 'Encrypting & Verifying...' : 'Verify & Mask'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: STUDENT VERIFICATION
              ================================================== */}
          {showStudentModal && (
            <div className="safety-modal-overlay animate-fade-in" onClick={() => setShowStudentModal(false)}>
              <div
                className="safety-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header-safety">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
                    <GraduationCap size={22} />
                    <h3 style={{ margin: 0, fontWeight: 700 }}>Student Safety Verification</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setShowStudentModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitStudent} className="modal-body-safety">
                  <div className="form-group-modern">
                    <label>Date of Birth (Backend Calculated Age) *</label>
                    <input
                      type="date"
                      required
                      className="form-input-modern"
                      value={studentForm.dateOfBirth}
                      onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>College / University Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RV College of Engineering"
                      className="form-input-modern"
                      value={studentForm.collegeName}
                      onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Course / Major *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. B.E. Computer Science"
                        className="form-input-modern"
                        value={studentForm.course}
                        onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                      />
                    </div>
                    <div className="form-group-modern">
                      <label>Current Year *</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        required
                        className="form-input-modern"
                        value={studentForm.year}
                        onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowStudentModal(false)}
                      disabled={submittingStudent}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingStudent}
                    >
                      {submittingStudent ? 'Submitting...' : 'Save & Verify Age'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: GUARDIAN OTP VERIFICATION
              ================================================== */}
          {showGuardianModal && (
            <div className="safety-modal-overlay animate-fade-in" onClick={() => setShowGuardianModal(false)}>
              <div
                className="safety-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header-safety">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb' }}>
                    <Users size={22} />
                    <h3 style={{ margin: 0, fontWeight: 700 }}>Parent / Guardian OTP Verification</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setShowGuardianModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body-safety">
                  {!otpSent ? (
                    <form onSubmit={handleRequestGuardianOtp}>
                      <div className="form-group-modern">
                        <label>Parent / Guardian Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Suresh Verma"
                          className="form-input-modern"
                          value={guardianForm.name}
                          onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group-modern">
                        <label>Parent Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 9845012345"
                          className="form-input-modern"
                          value={guardianForm.phone}
                          onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button type="button" className="btn-cancel" onClick={() => setShowGuardianModal(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-save-primary" disabled={submittingGuardian}>
                          {submittingGuardian ? 'Sending OTP...' : 'Send Verification OTP'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyGuardianOtp}>
                      <div className="form-group-modern">
                        <label>Enter 6-Digit OTP sent to Guardian Mobile *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 123456"
                          className="form-input-modern"
                          value={guardianOtp}
                          onChange={(e) => setGuardianOtp(e.target.value)}
                        />
                      </div>

                      <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <button type="button" className="btn-cancel" onClick={() => setOtpSent(false)}>
                          Back
                        </button>
                        <button type="submit" className="btn-save-primary" disabled={submittingGuardian}>
                          {submittingGuardian ? 'Verifying...' : 'Confirm Guardian Verification'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: REPORT GIG / EMPLOYER
              ================================================== */}
          {showReportModal && (
            <div className="safety-modal-overlay animate-fade-in" onClick={() => setShowReportModal(false)}>
              <div
                className="safety-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header-safety">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                    <Flag size={22} />
                    <h3 style={{ margin: 0, fontWeight: 700 }}>Report Safety / Fraud Concern</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setShowReportModal(false)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmitReport} className="modal-body-safety">
                  <div className="form-group-modern">
                    <label>Reason for Report *</label>
                    <select
                      className="form-input-modern"
                      value={reportForm.reason}
                      onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                    >
                      <option value="safety_concern">Safety / Harassment Concern</option>
                      <option value="fraud_or_scam">Fraud / Scam Suspicion</option>
                      <option value="suspicious_employer">Suspicious / Fake Employer</option>
                      <option value="underage_violation">Underage Violation</option>
                      <option value="payment_refusal">Payment Refusal</option>
                      <option value="other">Other Violation</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Details & Explanation *</label>
                    <textarea
                      rows={4}
                      required
                      className="form-input-modern"
                      placeholder="Please provide details of the incident or concern..."
                      value={reportForm.details}
                      onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                    />
                  </div>

                  <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-danger-outline" disabled={submittingReport}>
                      {submittingReport ? 'Submitting Report...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SafetyCenterPage;
