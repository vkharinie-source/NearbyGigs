import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { authService } from '../../services/authService';
import {
  Mail,
  Lock,
  LogIn,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Users,
  User,
  Phone,
  Layers,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Calendar,
  Globe,
  MapPin,
  KeyRound,
  X,
  HelpCircle,
  Building2,
  GraduationCap,
  UserCheck,
  Award,
  FileText,
  ShieldAlert,
  Check,
} from 'lucide-react';
import './Auth.css';

const LoginPage = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, login, register } = useAuthContext();
  const { location } = useLocationContext();

  // Tab state: 'login' | 'register'
  const tabFromUrl = searchParams.get('tab');
  const roleFromUrl = searchParams.get('role');
  const pendingGigId = searchParams.get('gigId') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingApplyGigId') : null);
  const pendingGigTitle = searchParams.get('gigTitle') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingApplyGigTitle') : null);

  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'register' || roleFromUrl || searchParams.get('from') === 'apply' ? 'register' : initialTab
  );

  // Register form state
  const [regRole, setRegRole] = useState(roleFromUrl === 'customer' ? 'customer' : 'worker');
  const [workerProfileType, setWorkerProfileType] = useState('college_student'); // 'college_student' | 'school_student' | 'professional'
  const [regFormData, setRegFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    country: 'India',
    address: location?.address || 'Bengaluru, Karnataka',
    skills: '',
    termsAccepted: false,
    // College Student Details
    collegeName: '',
    collegeCourse: '',
    collegeYear: 2,
    collegeRollNumber: '',
    studentGuardianName: '',
    studentGuardianPhone: '',
    // School Student Details
    schoolName: '',
    schoolGrade: '',
    parentName: '',
    parentPhone: '',
    // Professional Details
    aadhaarNumber: '',
    experienceYears: 3,
    tradeCertification: '',
    // Employer Security Details
    companyName: '',
    companyRegistration: '',
    businessCategory: 'Facility & Maintenance Services',
    safetyEscrowPledge: true,
  });

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: reset
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Status feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const quickSkills = ['Electrical', 'Plumbing', 'Carpentry', 'Home Cleaning', 'Appliance Repair', 'Tutoring', 'Tech Support'];

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const roleParam = searchParams.get('role');
    if (tabParam === 'register' || tabParam === 'login') {
      setActiveTab(tabParam);
    } else if (roleParam) {
      setActiveTab('register');
    }

    if (roleParam === 'customer' || roleParam === 'worker') {
      setRegRole(roleParam);
    }
  }, [searchParams]);

  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    setError('');
    setSuccessMsg('');
    setSearchParams({ tab: newTab });
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginEmail.trim() || !emailRegex.test(loginEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!loginPassword) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const data = await login({ email: loginEmail.trim(), password: loginPassword });
      
      const targetApplyId = pendingGigId || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingApplyGigId') : null);
      if (targetApplyId) {
        navigate(`/find-gigs?applyGigId=${targetApplyId}`);
        return;
      }

      // Check whether user is employer/hirer or worker:
      const isEmployer =
        data.user?.role === 'employer' ||
        data.user?.purpose === 'post_jobs' ||
        data.user?.role === 'customer' ||
        data.user?.userType === 'employer';
      if (isEmployer) {
        navigate('/employer/dashboard');
      } else if (!data.user?.purpose || (data.user.purpose === 'find_work' && !data.user?.onboardingCompleted)) {
        navigate('/choose-purpose');
      } else {
        navigate('/worker/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFormData.name.trim()) {
      setError('Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regFormData.email.trim() || !emailRegex.test(regFormData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!regFormData.phone.trim()) {
      setError('Mobile number is required for verified communication.');
      return;
    }

    if (!regFormData.dateOfBirth) {
      setError('Date of birth is required for legal age & safety verification.');
      return;
    }

    if (!regFormData.password || regFormData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regFormData.password !== regFormData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!regFormData.termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    try {
      setLoading(true);
      const isEmployerRole = regRole === 'customer' || regRole === 'employer';
      const skillsArray = !isEmployerRole && regFormData.skills
        ? regFormData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      let userType = 'professional';
      let role = 'worker';
      let isStudent = false;
      let collegeData = undefined;
      let schoolData = undefined;
      let guardianData = undefined;
      let emergencyContactsData = undefined;

      if (isEmployerRole) {
        userType = 'employer';
        role = 'employer';
      } else {
        if (workerProfileType === 'college_student') {
          userType = 'college_student';
          role = 'student_worker';
          isStudent = true;
          collegeData = {
            name: regFormData.collegeName.trim() || 'RV College of Engineering',
            course: regFormData.collegeCourse.trim() || 'B.E. Computer Science',
            year: Number(regFormData.collegeYear) || 2,
            rollNumber: regFormData.collegeRollNumber.trim() || 'STU-' + Math.floor(1000 + Math.random() * 9000),
          };
          guardianData = {
            name: regFormData.studentGuardianName.trim() || 'Guardian Contact',
            phone: regFormData.studentGuardianPhone.trim() || regFormData.phone.trim(),
            relationship: 'Parent',
            isVerified: true,
          };
          emergencyContactsData = [
            {
              name: regFormData.studentGuardianName.trim() || 'Guardian Contact',
              phone: regFormData.studentGuardianPhone.trim() || regFormData.phone.trim(),
              relationship: 'Parent',
            },
          ];
        } else if (workerProfileType === 'school_student') {
          userType = 'school_student';
          role = 'worker';
          isStudent = true;
          schoolData = {
            name: regFormData.schoolName.trim() || 'National Public School',
            grade: regFormData.schoolGrade.trim() || '11th Grade',
            daytimeAvailability: 'After School (3 PM - 7 PM)',
            parentConsentVerified: true,
          };
          guardianData = {
            name: regFormData.parentName.trim() || 'Parent Guardian',
            phone: regFormData.parentPhone.trim() || regFormData.phone.trim(),
            relationship: 'Parent',
            isVerified: true,
          };
          emergencyContactsData = [
            {
              name: regFormData.parentName.trim() || 'Parent Guardian',
              phone: regFormData.parentPhone.trim() || regFormData.phone.trim(),
              relationship: 'Parent',
            },
          ];
        } else {
          userType = 'professional';
          role = 'worker';
          isStudent = false;
        }
      }

      await register({
        name: regFormData.name.trim(),
        email: regFormData.email.trim(),
        password: regFormData.password,
        confirmPassword: regFormData.confirmPassword,
        phone: regFormData.phone.trim(),
        dateOfBirth: regFormData.dateOfBirth,
        country: regFormData.country,
        role,
        purpose: isEmployerRole ? 'post_jobs' : 'find_work',
        userType,
        isStudent,
        college: collegeData,
        school: schoolData,
        guardian: guardianData,
        emergencyContacts: emergencyContactsData,
        skills: skillsArray,
        experience: Number(regFormData.experienceYears) || (workerProfileType === 'professional' ? 3 : 1),
        aadhaar: regFormData.aadhaarNumber.trim(),
        maskedAadhaar: regFormData.aadhaarNumber ? `XXXX-XXXX-${regFormData.aadhaarNumber.trim().slice(-4)}` : 'XXXX-XXXX-9012',
        companyName: isEmployerRole ? (regFormData.companyName.trim() || `${regFormData.name.trim()} Facility`) : '',
        companyRegistration: isEmployerRole ? (regFormData.companyRegistration.trim() || 'CIN-REG-' + Math.floor(100000 + Math.random() * 900000)) : '',
        businessCategory: isEmployerRole ? regFormData.businessCategory : '',
        termsAccepted: true,
        location: {
          type: 'Point',
          coordinates: [location?.lng || 77.5946, location?.lat || 12.9716],
          address: regFormData.address || location?.address || 'Bengaluru, Karnataka',
        },
      });

      // Account created successfully! User must sign in first before accessing dashboard
      const registeredEmail = regFormData.email.trim();
      setLoginEmail(registeredEmail);
      setLoginPassword('');
      setActiveTab('login');
      setSearchParams({ tab: 'login' });
      setSuccessMsg('Account created successfully! Please sign in with your email and password to access your dashboard.');
      setError('');
      setRegFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkillPill = (skill) => {
    const currentList = regFormData.skills
      ? regFormData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!currentList.includes(skill)) {
      const updated = [...currentList, skill].join(', ');
      setRegFormData({ ...regFormData, skills: updated });
    }
  };

  // Quick Demo Login helper
  const handleQuickDemo = (demoEmail, demoPass) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setError('');
  };

  // Forgot password flow
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!forgotEmail) {
      setForgotError('Please enter your email.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      setForgotMessage(res.message || 'Reset token generated.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to request reset.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!resetToken || !newPassword) {
      setForgotError('Token and new password are required.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await authService.resetPassword({ token: resetToken, newPassword });
      setForgotMessage(res.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setLoginEmail(forgotEmail);
        setActiveTab('login');
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-layout">
      <Navbar />

      <div className="auth-container-center">
        <div className="auth-card-wrapper animate-scale-up">
          {/* Left Hero Panel */}
          <div className="auth-hero-panel">
            <div>
              <div className="hero-panel-badge">
                <Sparkles size={14} />
                <span>NEARBYGIGS MARKETPLACE</span>
              </div>

              <h2>Connect. Work. Earn. With verified safety.</h2>
              <p>
                A modern local gig marketplace with student safety protections, verified employer badges, attendance proof, and guaranteed escrow earnings.
              </p>

              <div className="auth-feature-list">
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Verified Identity &amp; Smart Legal Age Safeguards</span>
                </div>
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Job Commitment, Arrival OTP &amp; Completion Proof</span>
                </div>
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Real-time Geofenced Opportunities &amp; Fair Escrow</span>
                </div>
              </div>
            </div>

            <div className="auth-hero-stats">
              <div className="hero-stat-item">
                <strong>1,500+</strong>
                <span>Nearby Gigs</span>
              </div>
              <div className="hero-stat-item">
                <strong>100%</strong>
                <span>Safety First</span>
              </div>
              <div className="hero-stat-item">
                <strong>4.9 ★</strong>
                <span>Rated Gigs</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="auth-form-panel">
            {/* Application Context Banner if user clicked Apply on a gig */}
            {pendingGigTitle && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#166534',
                  fontSize: '0.9rem',
                }}
              >
                <Briefcase size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d' }}>
                    Applying For Job
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    "{pendingGigTitle}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '2px' }}>
                    {activeTab === 'register' ? 'Create your free account below to submit your proposal!' : 'Sign in to your account to submit your proposal!'}
                  </div>
                </div>
              </div>
            )}

            {/* Top Segmented Tab Switcher */}
            <div className="auth-tab-bar" role="tablist">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('login')}
              >
                <LogIn size={17} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('register')}
              >
                <User size={17} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Form Headers */}
            <div className="auth-form-header">
              {activeTab === 'login' ? (
                <>
                  <h3>Welcome Back to NearbyGigs</h3>
                  <p>Enter your credentials to access your personalized dashboard</p>
                </>
              ) : (
                <>
                  <h3>Register for NearbyGigs</h3>
                  <p>Create a secure profile to find local work or hire vetted specialists</p>
                </>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="auth-alert-error animate-slide-down">
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert-success animate-slide-down">
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}


            {/* ================= SIGN IN TAB ================= */}
            {activeTab === 'login' && (
              <div className="animate-fade-in">
                <form onSubmit={handleLoginSubmit} className="auth-form-body">
                  <div className="form-group-modern">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setShowForgotModal(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="input-action-btn"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-auth-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        <span>Sign In to Dashboard</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Test Strip */}
                <div className="demo-accounts-strip">
                  <span className="demo-title">Quick Demo Login:</span>
                  <div className="demo-buttons-row">
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('vkharinie@gmail.com', 'password123')}
                      style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
                    >
                      <User size={13} color="#38bdf8" />
                      Harinie (You)
                    </button>
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('arun@example.com', 'password123')}
                    >
                      <Briefcase size={13} color="#818cf8" />
                      Arun (Worker)
                    </button>
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('rahul@example.com', 'password123')}
                    >
                      <User size={13} color="#818cf8" />
                      Rahul (Student)
                    </button>
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('priya@example.com', 'password123')}
                    >
                      <Users size={13} color="#818cf8" />
                      Priya (Employer)
                    </button>
                  </div>
                </div>

                <div className="auth-footer-prompt">
                  <span>Don&apos;t have an account yet? </span>
                  <button
                    type="button"
                    className="auth-link-bold"
                    onClick={() => handleTabSwitch('register')}
                  >
                    Create a free account <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ================= CREATE ACCOUNT TAB ================= */}
            {activeTab === 'register' && (
              <div className="animate-fade-in">
                {/* Initial Role Option */}
                <div className="role-switcher-grid">
                  <div
                    className={`role-select-box ${regRole === 'worker' ? 'selected' : ''}`}
                    onClick={() => setRegRole('worker')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="role-icon-wrap">
                      <Briefcase size={18} />
                    </div>
                    <div className="role-text-wrap">
                      <strong>Find Work / Offer Skills</strong>
                      <span>Students &amp; Professionals</span>
                    </div>
                  </div>

                  <div
                    className={`role-select-box ${regRole === 'customer' || regRole === 'employer' ? 'selected' : ''}`}
                    onClick={() => setRegRole('employer')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="role-icon-wrap">
                      <Users size={18} />
                    </div>
                    <div className="role-text-wrap">
                      <strong>Post Jobs &amp; Hire</strong>
                      <span>Shops &amp; Businesses</span>
                    </div>
                  </div>
                </div>

                {/* Clear Destination Helper Strip */}
                <div
                  style={{
                    background: regRole === 'employer' || regRole === 'customer' ? 'rgba(5, 150, 105, 0.12)' : 'rgba(37, 99, 235, 0.1)',
                    border: `1px solid ${regRole === 'employer' || regRole === 'customer' ? '#059669' : '#3b82f6'}`,
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: regRole === 'employer' || regRole === 'customer' ? '#34d399' : '#93c5fd', fontWeight: 600 }}>
                    {regRole === 'employer' || regRole === 'customer'
                      ? '🏢 Employer Mode Active: Registers account for the Employer Management Hub.'
                      : '💼 Worker Mode Active: Registers account for the Worker & Gigs Dashboard.'}
                  </span>
                </div>

                <form onSubmit={handleRegisterSubmit} className="auth-form-body">
                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Full Name *</label>
                      <div className="input-with-icon">
                        <User size={18} className="input-icon" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Harinie Kumar"
                          value={regFormData.name}
                          onChange={(e) => setRegFormData({ ...regFormData, name: e.target.value })}
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>Mobile Number *</label>
                      <div className="input-with-icon">
                        <Phone size={18} className="input-icon" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 9876543210"
                          value={regFormData.phone}
                          onChange={(e) => setRegFormData({ ...regFormData, phone: e.target.value })}
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Email Address *</label>
                      <div className="input-with-icon">
                        <Mail size={18} className="input-icon" />
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={regFormData.email}
                          onChange={(e) => setRegFormData({ ...regFormData, email: e.target.value })}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>Date of Birth * (Legal Age Check)</label>
                      <div className="input-with-icon">
                        <Calendar size={18} className="input-icon" />
                        <input
                          type="date"
                          required
                          value={regFormData.dateOfBirth}
                          onChange={(e) => setRegFormData({ ...regFormData, dateOfBirth: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Password *</label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Min 6 characters"
                          value={regFormData.password}
                          onChange={(e) => setRegFormData({ ...regFormData, password: e.target.value })}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="input-action-btn"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                        >
                          {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>Confirm Password *</label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter password"
                          value={regFormData.confirmPassword}
                          onChange={(e) => setRegFormData({ ...regFormData, confirmPassword: e.target.value })}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="input-action-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Country</label>
                      <div className="input-with-icon">
                        <Globe size={18} className="input-icon" />
                        <input
                          type="text"
                          value={regFormData.country}
                          onChange={(e) => setRegFormData({ ...regFormData, country: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>Neighborhood Location</label>
                      <div className="input-with-icon">
                        <MapPin size={18} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. Indiranagar, Bengaluru"
                          value={regFormData.address}
                          onChange={(e) => setRegFormData({ ...regFormData, address: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skills / Trade Inputs for Worker */}
                  {regRole === 'worker' && (
                    <div className="form-group-modern" style={{ marginTop: '0.5rem' }}>
                      <label>Your Skills / Interests (Optional)</label>
                      <div className="input-with-icon">
                        <Layers size={18} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. Electrical, WiFi Config, Smart Home, Tutoring, Plumbing"
                          value={regFormData.skills}
                          onChange={(e) => setRegFormData({ ...regFormData, skills: e.target.value })}
                        />
                      </div>
                      <div className="skills-pills-row">
                        {quickSkills.map((sk) => (
                          <button
                            key={sk}
                            type="button"
                            className="skill-pill-btn"
                            onClick={() => handleAddSkillPill(sk)}
                          >
                            + {sk}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Terms & Privacy acceptance */}
                  <div className="form-group-modern" style={{ marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <input
                        type="checkbox"
                        checked={regFormData.termsAccepted}
                        onChange={(e) => setRegFormData({ ...regFormData, termsAccepted: e.target.checked })}
                        style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#2563eb' }}
                      />
                      <span>
                        I agree to the NearbyGigs <strong style={{ color: '#ffffff' }}>Terms of Service</strong> and <strong style={{ color: '#ffffff' }}>Privacy Policy</strong>, including student safety regulations and age eligibility checks.
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="btn-auth-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>
                          {regRole === 'employer' || regRole === 'customer'
                            ? 'Create Account & Setup Business Profile →'
                            : 'Create Account & Setup Criteria →'}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer-prompt">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    className="auth-link-bold"
                    onClick={() => handleTabSwitch('login')}
                  >
                    Sign in here <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      {showForgotModal && (
        <div className="profile-modal-overlay animate-fade-in" onClick={() => setShowForgotModal(false)}>
          <div
            className="profile-modal-card animate-scale-up"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <KeyRound size={20} color="#2563eb" />
                <h3>Reset Password</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-form-body">
              {forgotError && <div className="auth-alert-error">{forgotError}</div>}
              {forgotMessage && <div className="auth-alert-success">{forgotMessage}</div>}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest}>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>
                    Enter your registered account email to generate a secure password reset token.
                  </p>
                  <div className="form-group-modern">
                    <label>Account Email</label>
                    <input
                      type="email"
                      required
                      className="form-input-modern"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
                    <button type="button" className="btn-cancel" onClick={() => setShowForgotModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save-primary" disabled={forgotLoading}>
                      {forgotLoading ? 'Processing...' : 'Request Reset Token'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit}>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '1rem' }}>
                    Enter the reset token along with your new password.
                  </p>
                  <div className="form-group-modern">
                    <label>Reset Token</label>
                    <input
                      type="text"
                      required
                      className="form-input-modern"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset token"
                    />
                  </div>
                  <div className="form-group-modern">
                    <label>New Password (min 6 characters)</label>
                    <input
                      type="password"
                      required
                      className="form-input-modern"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
                    <button type="button" className="btn-cancel" onClick={() => setForgotStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn-save-primary" disabled={forgotLoading}>
                      {forgotLoading ? 'Resetting...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
