import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import {
  MapPin,
  Bell,
  User,
  Briefcase,
  MessageSquare,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Search,
  ShieldCheck,
  Compass,
  Users,
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuthContext();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-badge">
            <MapPin size={20} color="#ffffff" />
          </div>
          <span className="logo-text">
            NEARBY<span className="logo-highlight">GIG</span>
          </span>
          <span className="logo-live-tag">LIVE</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links">
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
          {user && (
            <Link
              to="/dashboard"
              className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <Briefcase size={16} />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/create-gig" className="btn-post-gig-nav">
                <PlusCircle size={16} />
                <span>Post a Gig</span>
              </Link>

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

              <Link to="/messages" className="nav-icon-badge" title="Messages">
                <MessageSquare size={19} />
              </Link>

              {/* User Dropdown Pill */}
              <div className="user-profile-menu">
                <Link to="/profile" className="user-avatar-btn">
                  <div className="avatar-circle">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-info-text">
                    <span className="user-name">{user.name || 'My Account'}</span>
                    <span className="user-role-badge">
                      {(user.role || 'user').toUpperCase()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="btn-logout"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-nav-buttons">
              <Link to="/login" className="btn-login-nav">
                Log In
              </Link>
              <Link to="/register" className="btn-register-nav">
                Create Account
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-slide-down">
          <nav className="mobile-nav-links">
            <Link
              to="/find-gigs"
              className="mobile-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Compass size={18} /> Find Gigs
            </Link>
            <Link
              to="/find-workers"
              className="mobile-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users size={18} /> Find Workers
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase size={18} /> Dashboard
                </Link>
                <Link
                  to="/create-gig"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle size={18} /> Post a Gig
                </Link>
                <Link
                  to="/profile"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={18} /> My Profile
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

export { Navbar };
export default Navbar;
