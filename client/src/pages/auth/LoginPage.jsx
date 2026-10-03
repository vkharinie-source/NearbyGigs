import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
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
  Check,
} from 'lucide-react';
import './Auth.css';

const LoginPage = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register } = useAuthContext();
  const { location } = useLocationContext();

  // Tab state: 'login' | 'register'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'register' ? 'register' : initialTab
  );

  useEffect(() => {
    const param = searchParams.get('tab');
    if (param === 'register' || param === 'login') {
      setActiveTab(param);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [searchParams, initialTab]);

  // Sync tab with URL if needed
  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    setError('');
    setSuccessMsg('');
    setSearchParams({ tab: newTab });
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regRole, setRegRole] = useState('worker');
  const [regFormData, setRegFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    skills: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Suggested skills for quick select
  const quickSkills = ['Electrical', 'Plumbing', 'Carpentry', 'Home Cleaning', 'Appliance Repair', 'Painting'];

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
      await login({ email: loginEmail.trim(), password: loginPassword });
      navigate('/dashboard');
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
      setError('Please enter a valid email address.');
      return;
    }

    if (!regFormData.password || regFormData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const skillsArray = regFormData.skills
        ? regFormData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await register({
        name: regFormData.name.trim(),
        email: regFormData.email.trim(),
        password: regFormData.password,
        phone: regFormData.phone.trim(),
        role: regRole,
        skills: skillsArray,
        location: {
          type: 'Point',
          coordinates: [location?.lng || 77.5946, location?.lat || 12.9716],
          address: location?.address || 'Bengaluru, Karnataka',
        },
      });

      // Show success feedback and switch to sign in view with email prefilled
      setSuccessMsg(
        `Account created for ${regFormData.name}! You can now sign in below, or go straight to your dashboard.`
      );
      setLoginEmail(regFormData.email.trim());
      setActiveTab('login');
      setSearchParams({ tab: 'login' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo credentials
  const handleQuickDemo = (demoEmail, demoPass) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setError('');
  };

  // Add skill pill to skills input
  const handleAddSkillPill = (skill) => {
    const currentList = regFormData.skills
      ? regFormData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!currentList.includes(skill)) {
      const updated = [...currentList, skill].join(', ');
      setRegFormData({ ...regFormData, skills: updated });
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
                <span>NEARBYGIG PLATFORM</span>
              </div>

              <h2>Local gigs and trusted talent at your fingertips.</h2>
              <p>
                Connect with verified neighborhood service professionals and home gig opportunities in real time.
              </p>

              <div className="auth-feature-list">
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Radius-based proximity matching within kilometers</span>
                </div>
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Direct peer-to-peer messaging and transparent bids</span>
                </div>
                <div className="auth-feature-item">
                  <CheckCircle2 size={18} color="#38bdf8" />
                  <span>Zero upfront fees & verified reviews</span>
                </div>
              </div>
            </div>

            <div className="auth-hero-stats">
              <div className="hero-stat-item">
                <strong>1,500+</strong>
                <span>Nearby Gigs</span>
              </div>
              <div className="hero-stat-item">
                <strong>4.9 ★</strong>
                <span>Avg Rating</span>
              </div>
              <div className="hero-stat-item">
                <strong>100%</strong>
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="auth-form-panel">
            {/* Top Interactive Segmented Tab Switcher */}
            <div className="auth-tab-bar" role="tablist">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('login')}
                role="tab"
                aria-selected={activeTab === 'login'}
              >
                <LogIn size={17} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('register')}
                role="tab"
                aria-selected={activeTab === 'register'}
              >
                <User size={17} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Form Headers */}
            <div className="auth-form-header">
              {activeTab === 'login' ? (
                <>
                  <h3>Welcome Back</h3>
                  <p>Enter your email and password to access your account</p>
                </>
              ) : (
                <>
                  <h3>Create an Account</h3>
                  <p>Join NearbyGig to hire talent or start earning locally</p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-alert-error animate-slide-down">
                <span>{error}</span>
              </div>
            )}

            {/* Success Message (After Registration) */}
            {successMsg && (
              <div className="auth-alert-success animate-slide-down">
                <div className="success-title-row">
                  <CheckCircle2 size={18} />
                  <span>Account Registered!</span>
                </div>
                <span>{successMsg}</span>
                <button
                  type="button"
                  className="btn-direct-dashboard"
                  onClick={() => navigate('/dashboard')}
                >
                  Enter Dashboard Directly <ArrowRight size={14} />
                </button>
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
                    <label>Password</label>
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

                  <button
                    type="submit"
                    className="btn-auth-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={18} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Test Buttons */}
                <div className="demo-accounts-strip">
                  <span className="demo-title">Quick Demo Login:</span>
                  <div className="demo-buttons-row">
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('rahul@example.com', 'password123')}
                    >
                      <Briefcase size={13} color="#818cf8" />
                      Rahul (Worker)
                    </button>
                    <button
                      type="button"
                      className="demo-account-pill"
                      onClick={() => handleQuickDemo('priya@example.com', 'password123')}
                    >
                      <Users size={13} color="#818cf8" />
                      Priya (Customer)
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
                {/* Role Selector */}
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
                      <strong>I Want to Work</strong>
                      <span>Offer services & earn</span>
                    </div>
                  </div>

                  <div
                    className={`role-select-box ${regRole === 'customer' ? 'selected' : ''}`}
                    onClick={() => setRegRole('customer')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="role-icon-wrap">
                      <Users size={18} />
                    </div>
                    <div className="role-text-wrap">
                      <strong>I Want to Hire</strong>
                      <span>Post gigs & find pros</span>
                    </div>
                  </div>
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
                          placeholder="e.g. Arun Kumar"
                          value={regFormData.name}
                          onChange={(e) =>
                            setRegFormData({ ...regFormData, name: e.target.value })
                          }
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label>Phone Number</label>
                      <div className="input-with-icon">
                        <Phone size={18} className="input-icon" />
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          value={regFormData.phone}
                          onChange={(e) =>
                            setRegFormData({ ...regFormData, phone: e.target.value })
                          }
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label>Email Address *</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={regFormData.email}
                        onChange={(e) =>
                          setRegFormData({ ...regFormData, email: e.target.value })
                        }
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label>Password *</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                        value={regFormData.password}
                        onChange={(e) =>
                          setRegFormData({ ...regFormData, password: e.target.value })
                        }
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="input-action-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {regRole === 'worker' && (
                    <div className="form-group-modern">
                      <label>Your Skills / Specialties (Optional)</label>
                      <div className="input-with-icon">
                        <Layers size={18} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. Electrical, Plumbing, Cleaning"
                          value={regFormData.skills}
                          onChange={(e) =>
                            setRegFormData({ ...regFormData, skills: e.target.value })
                          }
                        />
                      </div>
                      <div className="skills-pills-row">
                        {quickSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className="skill-pill-btn"
                            onClick={() => handleAddSkillPill(skill)}
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-auth-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Create My Account</span>
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
    </div>
  );
};

export default LoginPage;
