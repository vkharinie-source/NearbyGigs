import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Compass,
  Users,
  PlusCircle,
  Briefcase,
  Building2,
  FileText,
  Clock,
  MessageSquare,
  Bell,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
  Repeat,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, choosePurpose } = useAuthContext();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  // Strict role check: locked to either Employer or Worker
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
    <aside className="dashboard-sidebar">
      {/* Active Dedicated Portal Header (NO SWITCHER - Strictly Locked to Role) */}
      <div
        style={{
          margin: '0.25rem 0.5rem 0.75rem',
          padding: '0.75rem 0.9rem',
          borderRadius: '12px',
          background: isEmployer ? 'rgba(5, 150, 105, 0.18)' : 'rgba(15, 118, 110, 0.28)',
          border: isEmployer ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid rgba(45, 212, 191, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isEmployer ? '#059669' : '#0F766E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          {isEmployer ? <Building2 size={20} /> : <Briefcase size={20} />}
        </div>
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: isEmployer ? '#34D399' : '#5EEAD4',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {isEmployer ? 'Employer Portal' : 'Worker Portal'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
            {isEmployer ? 'Posting & Hiring Only' : 'Job Seeking & Earning Only'}
          </div>
        </div>
      </div>

      {/* Quick Switch Portal Button */}
      <div style={{ margin: '0 0.5rem 0.85rem' }}>
        <button
          type="button"
          onClick={handleToggleMode}
          disabled={switching}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: isEmployer ? 'rgba(59, 130, 246, 0.16)' : 'rgba(16, 185, 129, 0.16)',
            color: isEmployer ? '#93C5FD' : '#6EE7B7',
            border: isEmployer ? '1px solid rgba(96, 165, 250, 0.35)' : '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={isEmployer ? 'Switch to Worker Panel' : 'Switch to Employer Hub'}
        >
          <Repeat size={14} className={switching ? 'animate-spin' : ''} />
          <span>{isEmployer ? 'Switch to Worker Panel' : 'Switch to Employer Hub'}</span>
        </button>
      </div>

      {/* ==============================================================
          PORTAL 1: STRICT EMPLOYER & HIRING HUB (ONLY POSTING & HIRING)
          ============================================================== */}
      {isEmployer ? (
        <div className="sidebar-group animate-fade-in">
          <div className="sidebar-label">
            HIRING &amp; JOB MANAGEMENT
          </div>
          <NavLink
            to="/employer/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Building2 size={18} className="link-icon" />
            <span>Employer Dashboard</span>
          </NavLink>
          <NavLink
            to="/create-gig"
            className={({ isActive }) => `sidebar-link highlight-action ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={18} className="link-icon" />
            <span>Post a New Job</span>
          </NavLink>
          <NavLink
            to="/my-gigs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Briefcase size={18} className="link-icon" />
            <span>My Posted Jobs</span>
          </NavLink>
          <NavLink
            to="/applications/received"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} className="link-icon" />
            <span>Review &amp; Approve Candidates</span>
          </NavLink>
          <NavLink
            to="/my-complaints"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={18} className="link-icon" color="#F87171" />
            <span>Rectify Issues &amp; Disputes</span>
          </NavLink>
        </div>
      ) : (
        /* ==============================================================
            PORTAL 2: STRICT WORKER & EARNING HUB (ONLY FINDING WORK)
            ============================================================== */
        <div className="sidebar-group animate-fade-in">
          <div className="sidebar-label">
            WORK &amp; EARN HUB
          </div>
          <NavLink
            to="/worker/dashboard"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} className="link-icon" />
            <span>Worker Dashboard</span>
          </NavLink>
          <NavLink
            to="/find-gigs"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Compass size={18} className="link-icon" />
            <span>Find Gigs &amp; Apply</span>
          </NavLink>
          <NavLink
            to="/my-applications"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} className="link-icon" />
            <span>My Applications &amp; Status</span>
          </NavLink>
          <NavLink
            to="/find-workers"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} className="link-icon" />
            <span>Find Specialists</span>
          </NavLink>
          <NavLink
            to="/safety?tab=earnings"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} className="link-icon" color="#059669" />
            <span>My Earnings &amp; Escrow</span>
          </NavLink>
          <NavLink
            to="/my-complaints"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={18} className="link-icon" color="#dc2626" />
            <span>Report Grievances / Issues</span>
          </NavLink>
          <NavLink
            to="/safety"
            className={({ isActive }) => `sidebar-link safety-hub-link ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} className="link-icon" color="#10b981" />
            <span>Safety Center &amp; SOS</span>
          </NavLink>
        </div>
      )}

      {/* ADMIN ARBITRATION TRIBUNAL (Only for Admin role) */}
      {user?.role === 'admin' && (
        <div className="sidebar-group animate-fade-in">
          <div className="sidebar-label">ADMIN ARBITRATION</div>
          <NavLink
            to="/admin/disputes"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={18} className="link-icon" style={{ color: '#e11d48' }} />
            <span>Dispute Tribunal</span>
          </NavLink>
        </div>
      )}

      {/* ==============================================================
          COMMON SECTION: MESSAGES, NOTIFICATIONS & SETTINGS
          ============================================================== */}
      <div className="sidebar-group">
        <div className="sidebar-label">COMMUNICATION</div>
        <NavLink
          to="/messages"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={18} className="link-icon" />
          <span>Messages</span>
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Bell size={18} className="link-icon" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="sidebar-badge-count">{unreadCount}</span>
          )}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={18} className="link-icon" />
          <span>My Profile</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} className="link-icon" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* BOTTOM USER PROFILE CARD */}
      {user && (
        <div className="sidebar-footer-user">
          <NavLink to="/profile" className="user-profile-widget">
            <div className="widget-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="widget-details">
              <span className="widget-name">{user.name || 'User'}</span>
              <span className="widget-role">
                {isEmployer ? 'EMPLOYER (HIRER)' : user.isStudent ? 'STUDENT WORKER' : 'TALENT (WORKER)'}
              </span>
            </div>
            <ChevronRight size={16} className="widget-chevron" />
          </NavLink>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
