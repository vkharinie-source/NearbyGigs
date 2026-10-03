import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { requestService } from '../../services/requestService';
import {
  Clock,
  Check,
  X,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Calendar,
  DollarSign,
  Loader2,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import '../applications/Applications.css';

// Sample fallback booking requests for testing & demonstration
const DEMO_REQUESTS = [
  {
    _id: 'demo-req-1',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 9876543211',
    },
    service: {
      title: 'Master Electrician for Domestic Repairs & Wiring',
      category: 'Electrical',
      startingPrice: 500,
    },
    notes: 'Switchboard in master bedroom is sparking occasionally. Need diagnostic and socket replacement today.',
    address: '100ft Road, Indiranagar, Bengaluru',
    scheduledDate: 'Today, 4:00 PM',
    status: 'pending',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    isDemo: true,
  },
  {
    _id: 'demo-req-2',
    customer: {
      name: 'Kavita Reddy',
      phone: '+91 9876543213',
    },
    service: {
      title: 'Plumbing & Water Pipe Leak Specialist',
      category: 'Plumbing',
      startingPrice: 650,
    },
    notes: 'Kitchen sink drain pipe is overflowing. Need leak sealing and waste coupler replacement.',
    address: 'Marathahalli Main Road, Bengaluru',
    scheduledDate: 'Tomorrow, 11:00 AM',
    status: 'pending',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    isDemo: true,
  },
];

const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests();
      const list = data.requests || [];
      setRequests(list);
      // If user has 0 real bookings, show demo bookings so the page is active
      if (list.length === 0) {
        setShowDemo(true);
      }
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setShowDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      if (id.startsWith('demo-')) {
        setRequests((prev) =>
          prev.map((req) => (req._id === id ? { ...req, status } : req))
        );
      } else {
        await requestService.updateRequestStatus(id, status);
        fetchRequests();
      }
    } catch (err) {
      alert('Failed to update request status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const displayedList = requests.length > 0 ? requests : (showDemo ? DEMO_REQUESTS : []);

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
                <span>CLIENT BOOKINGS & ORDERS</span>
              </div>
              <h1>Service Requests & Bookings</h1>
              <p>Manage incoming customer service requests, track time slots, and confirm appointments.</p>
            </div>

            <div className="header-action-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/create-service" className="btn-primary" style={{ padding: '0.65rem 1.15rem' }}>
                <PlusCircle size={16} /> Post Worker Availability
              </Link>
            </div>
          </div>

          {/* Demo Mode Notice Banner */}
          {requests.length === 0 && showDemo && (
            <div className="app-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={16} color="#2563eb" />
                <span style={{ fontSize: '0.88rem', color: '#1e40af' }}>
                  <strong>Demo Mode Active:</strong> Showing sample customer bookings so you can preview confirming and managing service requests.
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? 'Hide Demo Data' : 'Show Demo Data'}
              </button>
            </div>
          )}

          <div className="applications-container">
            {loading ? (
              <div className="cards-stack-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-line" />
                  </div>
                ))}
              </div>
            ) : displayedList.length > 0 ? (
              <div className="applications-grid-stack">
                {displayedList.map((req) => (
                  <div key={req._id} className="app-card received-proposal-card">
                    <div className="proposal-card-top">
                      <div className="applicant-user-block">
                        <div className="applicant-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                          {req.customer?.name ? req.customer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="applicant-name-row">
                            <h4>{req.customer?.name || 'Customer'}</h4>
                            <span className="badge-tag badge-category">
                              {req.service?.category || 'Service'}
                            </span>
                            {req.isDemo && (
                              <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700' }}>
                                SAMPLE
                              </span>
                            )}
                          </div>
                          <span className="proposal-for-gig">
                            Booked Service: <strong>{req.service?.title || 'Service Booking'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="proposal-price-status">
                        <span className="proposed-amount-pill">
                          ₹{req.service?.startingPrice || 500}
                        </span>
                        <span className={`status-badge ${req.status || 'pending'}`}>
                          {(req.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="proposal-content-box">
                      <span className="quote-label">Customer Request Notes:</span>
                      <p>&quot;{req.notes || 'Looking for fast service visit.'}&quot;</p>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.65rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#475569' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={14} color="#2563eb" /> {req.address}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="#2563eb" /> Scheduled: <strong>{req.scheduledDate}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="proposal-card-footer">
                      <span className="proposal-time-meta">
                        <Clock size={13} />
                        Requested{' '}
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </span>

                      <div className="proposal-action-btns">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              className="btn-reject-action"
                              onClick={() => handleStatusUpdate(req._id, 'rejected')}
                              disabled={updatingId === req._id}
                            >
                              <X size={15} /> Decline
                            </button>
                            <button
                              className="btn-accept-action"
                              onClick={() => handleStatusUpdate(req._id, 'accepted')}
                              disabled={updatingId === req._id}
                            >
                              <Check size={15} /> Accept Booking
                            </button>
                          </>
                        ) : (
                          <span className="action-resolved-label" style={{ color: req.status === 'accepted' ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                            {req.status === 'accepted' ? '✓ Accepted Booking' : '✗ Declined Booking'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div className="empty-state-icon-box" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Clock size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>No Service Requests Yet</h3>
                <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  When nearby homeowners and clients discover your published availability and book your service, their appointment times and notes will appear here.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/create-service" className="btn-primary">
                    <PlusCircle size={16} /> Post Worker Availability
                  </Link>
                  <button type="button" className="btn-secondary" onClick={() => setShowDemo(true)}>
                    <Sparkles size={16} /> Load Sample Bookings
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServiceRequestsPage;
