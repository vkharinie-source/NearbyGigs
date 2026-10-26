import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import {
  MapPin,
  Bell,
  User,
  Briefcase,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Compass,
  Users,
  Building2,
  FileText,
  Repeat,
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, choosePurpose } = useAuthContext();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Strict role check
  const isEmployer =
    user?.role === 'employer' || user?.role === 'customer' || user?.purpose === 'post_jobs';

  const handleToggleMode = async () => {
    try {
      setSwitching(true);
      const targetPurpose = isEmployer ? 'find_work' : 'post_jobs';
      if (choosePurpose) {
        await choosePurpose(targetPurpose);
      }
      navigate(isEmployer ? '/worker/dashboard' : '/employer/dashboard');
    } catch (e) {
      navigate(isEmployer ? '/worker/dashboard' : '/employer/dashboard');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-badge" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}>
            <MapPin size={20} color="#FFFFFF" />
          </div>
          <span className="logo-text">
            NEARBY<span className="logo-highlight" style={{ color: '#0F766E' }}>GIG</span>
          </span>
          <span
            className="logo-live-tag"
            style={{
              background: '#E6FFFA',
              color: '#0F766E',
              borderColor: '#99F6E4',
            }}
          >
            {isEmployer ? 'EMPLOYER' : user ? 'WORKER' : 'LIVE'}
          </span>
        </Link>

        {/* Desktop Navigation Links - STRICTLY FILTERED BY ROLE */}
        <nav className="navbar-links">
          {user ? (
            isEmployer ? (
              /* EMPLOYER ONLY NAVIGATION */
              <>
                <Link
                  to="/employer/dashboard"
                  className={`nav-item ${isActive('/employer/dashboard') ? 'active' : ''}`}
                >
                  <Building2 size={16} />
                  <span>Employer Hub</span>
                </Link>
                <Link
                  to="/my-gigs"
                  className={`nav-item ${isActive('/my-gigs') ? 'active' : ''}`}
                >
                  <Briefcase size={16} />
                  <span>My Posted Jobs</span>
                </Link>
                <Link
                  to="/applications/received"
                  className={`nav-item ${isActive('/applications/received') ? 'active' : ''}`}
                >
                  <Users size={16} />
                  <span>Received Proposals</span>
                </Link>
              </>
            ) : (
              /* WORKER ONLY NAVIGATION */
              <>
                <Link
                  to="/worker/dashboard"
                  className={`nav-item ${isActive('/worker/dashboard') ? 'active' : ''}`}
                >
                  <Briefcase size={16} />
                  <span>Worker Hub</span>
                </Link>
                <Link
                  to="/find-gigs"
                  className={`nav-item ${isActive('/find-gigs') ? 'active' : ''}`}
                >
                  <Compass size={16} />
                  <span>Find Gigs</span>
                </Link>
                <Link
                  to="/my-applications"
                  className={`nav-item ${isActive('/my-applications') ? 'active' : ''}`}
                >
                  <FileText size={16} />
                  <span>My Applications</span>
                </Link>
                <Link
                  to="/find-workers"
                  className={`nav-item ${isActive('/find-workers') ? 'active' : ''}`}
                >
                  <Users size={16} />
                  <span>Find Specialists</span>
                </Link>
              </>
            )
          ) : (
            /* PUBLIC / GUEST NAVIGATION */
            <>
              <Link
                to="/find-gigs"
                className={`nav-item ${isActive('/find-gigs') ? 'active' : ''}`}
              >
                <Compass size={16} />
                <span>Find Gigs</span>
              </Link>
              <Link
                to="/find-workers"
                className={`nav-item ${isActive('/find-workers') ? 'active' : ''}`}
              >
                <Users size={16} />
                <span>Find Workers</span>
              </Link>
              <Link
                to="/register?role=employer"
                className="nav-item"
                style={{ color: '#0F766E', fontWeight: 700 }}
              >
                <Building2 size={16} />
                <span>Post a Job</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Switch Portal Button */}
              <button
                type="button"
                onClick={handleToggleMode}
                disabled={switching}
                className="btn-switch-portal"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isEmployer ? '#EFF6FF' : '#ECFDF5',
                  color: isEmployer ? '#1D4ED8' : '#047857',
                  border: `1.5px solid ${isEmployer ? '#BFDBFE' : '#A7F3D0'}`,
                  borderRadius: '10px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
                title={isEmployer ? 'Switch to Worker Panel' : 'Switch to Employer Hub'}
              >
                <Repeat size={14} className={switching ? 'animate-spin' : ''} />
                <span>{isEmployer ? 'Worker Panel' : 'Employer Hub'}</span>
              </button>

              {/* Only Employers have Post a Gig action */}
              {isEmployer ? (
                <Link to="/create-gig" className="btn-post-gig-nav">
                  <PlusCircle size={16} />
                  <span>Post a Gig</span>
                </Link>
              ) : (
                <Link to="/find-gigs" className="btn-post-gig-nav">
                  <Compass size={16} />
                  <span>Explore Gigs</span>
                </Link>
              )}

              <Link
                to="/notifications"
                className="nav-icon-badge"
                title="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="notification-dot">{unreadCount}</span>
                )}
              </Link>

              {/* Profile Link */}
              <Link to="/profile" className="nav-profile-link">
                <div className="avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="profile-name-text">{user.name?.split(' ')[0] || 'Profile'}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="nav-btn-logout"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login" className="btn-login-nav">
                Sign In
              </Link>
              <Link to="/register" className="btn-register-nav">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu animate-slide-down">
          <nav className="mobile-nav-links">
            {user ? (
              isEmployer ? (
                /* EMPLOYER MOBILE MENU */
                <>
                  <Link
                    to="/employer/dashboard"
                    className="mobile-nav-item"
                    style={{ color: '#0F766E', fontWeight: 700 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Building2 size={18} /> Employer Dashboard
                  </Link>
                  <Link
                    to="/create-gig"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PlusCircle size={18} /> Post a New Job
                  </Link>
                  <Link
                    to="/my-gigs"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase size={18} /> My Posted Jobs
                  </Link>
                  <Link
                    to="/applications/received"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users size={18} /> Received Proposals
                  </Link>
                  <Link
                    to="/profile"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} /> Employer Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="mobile-nav-item logout-link"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                /* WORKER MOBILE MENU */
                <>
                  <Link
                    to="/worker/dashboard"
                    className="mobile-nav-item"
                    style={{ color: '#0F766E', fontWeight: 700 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Briefcase size={18} /> Worker Dashboard
                  </Link>
                  <Link
                    to="/find-gigs"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Compass size={18} /> Find Gigs &amp; Apply
                  </Link>
                  <Link
                    to="/my-applications"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText size={18} /> My Applications
                  </Link>
                  <Link
                    to="/find-workers"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users size={18} /> Find Specialists
                  </Link>
                  <Link
                    to="/profile"
                    className="mobile-nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} /> Worker Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="mobile-nav-item logout-link"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              )
            ) : (
              /* GUEST MOBILE MENU */
              <div className="mobile-auth-row">
                <Link
                  to="/login"
                  className="btn-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
