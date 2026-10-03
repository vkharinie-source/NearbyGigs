import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Compass,
  Users,
  PlusCircle,
  Briefcase,
  FileText,
  Clock,
  MessageSquare,
  Bell,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuthContext();
  const { unreadCount } = useNotificationContext();

  return (
    <aside className="dashboard-sidebar">
      {/* SECTION 1: MAIN NAVIGATION */}
      <div className="sidebar-group">
        <div className="sidebar-label">DISCOVERY & OVERVIEW</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} className="link-icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/find-gigs"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Compass size={18} className="link-icon" />
          <span>Find Gigs</span>
        </NavLink>
        <NavLink
          to="/find-workers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} className="link-icon" />
          <span>Find Workers</span>
        </NavLink>
      </div>

      {/* SECTION 2: MY WORK & GIGS */}
      <div className="sidebar-group">
        <div className="sidebar-label">MY WORK & GIGS</div>
        <NavLink
          to="/create-gig"
          className={({ isActive }) => `sidebar-link highlight-action ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={18} className="link-icon" />
          <span>Post a Gig</span>
        </NavLink>
        <NavLink
          to="/my-gigs"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={18} className="link-icon" />
          <span>My Posted Gigs</span>
        </NavLink>
        <NavLink
          to="/my-services"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ShieldCheck size={18} className="link-icon" />
          <span>My Worker Services</span>
        </NavLink>
        <NavLink
          to="/my-applications"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} className="link-icon" />
          <span>My Applications</span>
        </NavLink>
        <NavLink
          to="/applications/received"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} className="link-icon" />
          <span>Received Proposals</span>
        </NavLink>
        <NavLink
          to="/requests"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Clock size={18} className="link-icon" />
          <span>Service Requests</span>
        </NavLink>
      </div>

      {/* SECTION 3: COMMUNICATION & ACCOUNT */}
      <div className="sidebar-group">
        <div className="sidebar-label">ACCOUNT & MESSAGES</div>
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
              <span className="widget-role">{(user.role || 'customer').toUpperCase()}</span>
            </div>
            <ChevronRight size={16} className="widget-chevron" />
          </NavLink>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
