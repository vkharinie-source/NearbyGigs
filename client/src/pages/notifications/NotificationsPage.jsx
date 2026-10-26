import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useNotificationContext } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  Briefcase,
  Clock,
  MessageSquare,
  Star,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  QrCode,
  Award,
  AlertTriangle,
  XCircle,
  DollarSign,
  ArrowUpRight,
  FileText,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import './Notifications.css';

const DEFAULT_WELCOME_NOTIFS = [
  {
    _id: 'welcome-notif-1',
    title: 'Welcome to NearbyGigs! 🎉',
    message: 'Your account is verified and ready. Start by exploring nearby gigs or publishing your availability.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    _id: 'welcome-notif-2',
    title: '📍 Proximity Radar Enabled',
    message: 'Your service area has been set. You will receive alerts when new gigs matching your skills are posted nearby.',
    type: 'system',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isDemo: true,
  },
  {
    _id: 'welcome-notif-3',
    title: '⚡ Verified Gigs Matching Your Skills',
    message: 'Clients in your district recently posted web development and technical assistant tasks.',
    type: 'application_received',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isDemo: true,
  },
];

const NotificationsPage = () => {
  const { notifications, markAllRead, markAsRead, fetchNotifications } = useNotificationContext();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('ALL');
  const [localNotifs, setLocalNotifs] = useState([]);

  // Use notifications from context, or default welcome notifs if empty
  const activeNotifs = (notifications && notifications.length > 0)
    ? notifications
    : (localNotifs.length > 0 ? localNotifs : DEFAULT_WELCOME_NOTIFS);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'application_received':
      case 'application_shortlisted':
        return <Briefcase size={18} color="#2563eb" />;
      case 'application_accepted':
      case 'commitment_confirmed':
        return <CheckCircle2 size={18} color="#16a34a" />;
      case 'application_rejected':
      case 'commitment_declined':
      case 'cancellation_confirmed':
        return <XCircle size={18} color="#ef4444" />;
      case 'attendance_otp_generated':
      case 'attendance_verified':
        return <QrCode size={18} color="#0d9488" />;
      case 'attendance_disputed':
      case 'completion_disputed':
        return <AlertTriangle size={18} color="#ea580c" />;
      case 'completion_submitted':
        return <FileText size={18} color="#6366f1" />;
      case 'completion_approved':
        return <Award size={18} color="#10b981" />;
      case 'revision_requested':
        return <Clock size={18} color="#f59e0b" />;
      case 'payment_status_changed':
        return <DollarSign size={18} color="#059669" />;
      case 'sos_alert':
        return <ShieldAlert size={18} color="#dc2626" />;
      case 'review_received':
        return <Star size={18} color="#eab308" />;
      case 'message_received':
        return <MessageSquare size={18} color="#0284c7" />;
      default:
        return <Bell size={18} color="#4f46e5" />;
    }
  };

  const getNotifCategory = (type) => {
    if (!type) return 'SYSTEM';
    if (type.includes('attendance') || type.includes('completion')) return 'ATTENDANCE_PROOF';
    if (type.includes('application') || type.includes('commitment') || type.includes('service_request')) return 'WORK';
    if (type.includes('sos') || type.includes('system') || type.includes('security')) return 'SAFETY_SYSTEM';
    return 'OTHER';
  };

  const filteredNotifs = activeNotifs.filter((n) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !n.read;
    if (filterType === 'WORK') {
      const cat = getNotifCategory(n.type);
      return cat === 'WORK';
    }
    if (filterType === 'ATTENDANCE_PROOF') {
      const cat = getNotifCategory(n.type);
      return cat === 'ATTENDANCE_PROOF';
    }
    if (filterType === 'SAFETY_SYSTEM') {
      const cat = getNotifCategory(n.type);
      return cat === 'SAFETY_SYSTEM';
    }
    return true;
  });

  const handleCardClick = (n) => {
    if (!n.read) {
      if (notifications.some((item) => item._id === n._id)) {
        markAsRead(n._id);
      } else {
        setLocalNotifs((prev) =>
          (prev.length > 0 ? prev : DEFAULT_WELCOME_NOTIFS).map((item) =>
            item._id === n._id ? { ...item, read: true } : item
          )
        );
      }
    }

    // Direct routing based on notification intent
    if (n.type?.includes('attendance') || n.type?.includes('completion') || n.type?.includes('commitment')) {
      if (n.relatedApplicationId) {
        navigate('/my-applications');
      } else {
        navigate('/applications/received');
      }
    } else if (n.type === 'application_received' || n.type === 'application_shortlisted') {
      navigate('/applications/received');
    } else if (n.type?.includes('application')) {
      navigate('/my-applications');
    } else if (n.type === 'message_received') {
      navigate('/messages');
    } else if (n.type === 'sos_alert') {
      navigate('/safety');
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          <div className="page-header-container">
            <div className="page-title-group">
              <div className="welcome-badge-pill" style={{ marginBottom: '0.4rem', width: 'fit-content' }}>
                <Sparkles size={13} />
                <span>ACTIVITY & MILESTONES</span>
              </div>
              <h1>Notification Center</h1>
              <p>Real-time alerts on applications, job commitments, attendance check-ins, completion proofs, and security.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => fetchNotifications && fetchNotifications()}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              {activeNotifs.some((n) => !n.read) && (
                <button onClick={markAllRead} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="status-filter-tabs">
            {[
              { id: 'ALL', label: 'All Alerts' },
              { id: 'UNREAD', label: `Unread (${activeNotifs.filter(n => !n.read).length})` },
              { id: 'WORK', label: 'Gigs & Applications' },
              { id: 'ATTENDANCE_PROOF', label: 'Attendance & Proof' },
              { id: 'SAFETY_SYSTEM', label: 'Safety & System' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`status-tab-btn ${filterType === tab.id ? 'active' : ''}`}
                onClick={() => setFilterType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="notifications-list-container">
            {filteredNotifs.length > 0 ? (
              <div className="notif-cards-stack">
                {filteredNotifs.map((n) => (
                  <div
                    key={n._id}
                    className={`notif-card-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => handleCardClick(n)}
                    style={{ position: 'relative' }}
                  >
                    <div className="notif-icon-circle">{getNotifIcon(n.type)}</div>

                    <div className="notif-content-area">
                      <div className="notif-title-row">
                        <h4>{n.title}</h4>
                        {!n.read && <span className="unread-dot-badge">New</span>}
                        {n.type && (
                          <span className="notif-type-tag">
                            {n.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        )}
                      </div>

                      <p className="notif-message-text">{n.message}</p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="notif-time-ago">
                          <Clock size={13} />
                          <span>
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </span>
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.82rem',
                            color: '#0F766E',
                            fontWeight: 700,
                          }}
                        >
                          View Details <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="empty-state-card"
                style={{
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div
                  className="empty-state-icon-box"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <Bell size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                  No Notifications In This Filter
                </h3>
                <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  You are all caught up on this category. Switch to &quot;All Alerts&quot; to see system notices and onboarding updates.
                </p>
                <button type="button" className="btn-secondary" onClick={() => setFilterType('ALL')}>
                  Show All Notifications
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
