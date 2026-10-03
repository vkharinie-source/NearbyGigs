import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import '../applications/Applications.css';

const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestService.getRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching service requests:', err);
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
      await requestService.updateRequestStatus(id, status);
      fetchRequests();
    } catch (err) {
      alert('Failed to update request status.');
    } finally {
      setUpdatingId(null);
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
              <h1>Service Requests & Bookings</h1>
              <p>Manage incoming customer service requests and track your bookings.</p>
            </div>
          </div>

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
            ) : requests.length > 0 ? (
              <div className="applications-grid-stack">
                {requests.map((req) => (
                  <div key={req._id} className="app-card received-proposal-card">
                    <div className="proposal-card-top">
                      <div className="applicant-user-block">
                        <div className="applicant-avatar">
                          {req.customer?.name ? req.customer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="applicant-name-row">
                            <h4>{req.customer?.name || 'Customer'}</h4>
                            <span className="badge-tag badge-category">
                              {req.service?.category || 'Service'}
                            </span>
                          </div>
                          <span className="proposal-for-gig">
                            Service: <strong>{req.service?.title || 'Direct Booking'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="proposal-price-status">
                        <span className="proposed-amount-pill">
                          ₹{req.offeredPrice || 500}
                        </span>
                        <span className={`status-badge ${req.status || 'pending'}`}>
                          {req.status || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    <div className="proposal-content-box">
                      <span className="quote-label">Customer Task Details:</span>
                      <p>&quot;{req.note}&quot;</p>
                    </div>

                    <div className="proposal-card-footer">
                      <div className="meta-left-group">
                        <span className="proposal-time-meta">
                          <Calendar size={13} /> Requested for: <strong>{req.requestedDate || 'Today'}</strong>
                        </span>
                      </div>

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
                          <span className="action-resolved-label">
                            Status: <strong>{req.status.toUpperCase()}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-state-icon-box">
                  <Clock size={32} />
                </div>
                <h3>No service requests yet</h3>
                <p>When nearby customers book your published services, the booking details will appear here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServiceRequestsPage;
