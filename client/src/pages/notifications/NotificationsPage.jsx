import React, { useState } from 'react';
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
} from 'lucide-react';
import './Notifications.css';

const DEFAULT_WELCOME_NOTIFS = [
  {
    _id: 'welcome-notif-1',
    title: 'Welcome to NearbyGig! 🎉',
    message: 'Your account is verified and ready. Start by exploring nearby gigs or publishing your availability.',
    type: 'system',
    read: false,
    createdAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    _id: 'welcome-notif-2',
    title: '📍 Proximity Radar Enabled',
    message: 'Your location has been set to Bengaluru. You will receive alerts when new tasks are posted within 15km.',
    type: 'system',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isDemo: true,
  },
  {
    _id: 'welcome-notif-3',
    title: '⚡ Gigs Available in Your Area',
    message: 'Clients in Indiranagar and Koramangala recently posted Electrical and Plumbing tasks.',
    type: 'application_received',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isDemo: true,
  },
];

const NotificationsPage = () => {
  const { notifications, markAllRead, markAsRead, fetchNotifications } = useNotificationContext();
  const [filterType, setFilterType] = useState('ALL');
  const [localNotifs, setLocalNotifs] = useState([]);

  // Use notifications from context, or default welcome notifs if empty
  const activeNotifs = (notifications && notifications.length > 0)
    ? notifications
    : (localNotifs.length > 0 ? localNotifs : DEFAULT_WELCOME_NOTIFS);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'application_received':
      case 'application_accepted':
      case 'application_rejected':
        return <Briefcase size={18} color="#2563eb" />;
      case 'service_request_received':
      case 'service_request_accepted':
      case 'service_request_rejected':
        return <Clock size={18} color="#4f46e5" />;
      case 'review_received':
        return <Star size={18} color="#eab308" />;
      case 'message_received':
        return <MessageSquare size={18} color="#10b981" />;
      default:
        return <Bell size={18} color="#2563eb" />;
    }
  };

  const filteredNotifs = filterType === 'ALL'
    ? activeNotifs
    : activeNotifs.filter((n) => {
        if (filterType === 'APPLICATIONS') return n.type?.includes('application');
        if (filterType === 'REQUESTS') return n.type?.includes('service_request');
        if (filterType === 'REVIEWS') return n.type?.includes('review');
        return true;
      });

  const handleMarkLocalRead = (id) => {
    if (notifications.some(n => n._id === id)) {
      markAsRead(id);
    } else {
      setLocalNotifs(prev =>
        (prev.length > 0 ? prev : DEFAULT_WELCOME_NOTIFS).map(n =>
          n._id === id ? { ...n, read: true } : n
        )
      );
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
              <h1>Activity Notifications</h1>
              <p>Real-time milestone alerts on your gig proposals, bookings, and reviews.</p>
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
                <button onClick={markAllRead} className="btn-secondary">
                  <CheckCircle2 size={16} /> Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="status-filter-tabs">
            {['ALL', 'APPLICATIONS', 'REQUESTS', 'REVIEWS'].map((ft) => (
              <button
                key={ft}
                className={`status-tab-btn ${filterType === ft ? 'active' : ''}`}
                onClick={() => setFilterType(ft)}
              >
                {ft}
              </button>
            ))}
          </div>

          <div className="notifications-list-container">
            {filteredNotifs.length > 0 ? (
              <div className="notif-cards-stack">
                {filteredNotifs.map((n) => (
                  <div
                    key={n._id}
                    className={`app-card notif-card-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => !n.read && handleMarkLocalRead(n._id)}
                  >
                    <div className="notif-icon-circle">{getNotifIcon(n.type)}</div>

                    <div className="notif-content-area">
                      <div className="notif-title-row">
                        <h4>{n.title}</h4>
                        {!n.read && <span className="unread-dot-badge">New</span>}
                      </div>

                      <p className="notif-message-text">{n.message}</p>

                      <span className="notif-time-ago">
                        <Clock size={12} />
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div className="empty-state-icon-box" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Bell size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>No Notifications In This Filter</h3>
                <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  You are all caught up on this category. Switch to &quot;ALL&quot; to see system alerts and onboarding updates.
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
