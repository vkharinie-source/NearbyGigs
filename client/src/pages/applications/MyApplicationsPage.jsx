import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { applicationService } from '../../services/applicationService';
import {
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
  ChevronRight,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import './Applications.css';

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Error fetching my applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = filter === 'ALL'
    ? applications
    : applications.filter((a) => a.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          <div className="page-header-container">
            <div className="page-title-group">
              <h1>My Gig Applications</h1>
              <p>Track the status of all gig proposals and offers you have submitted.</p>
            </div>

            <Link to="/find-gigs" className="btn-primary">
              <Briefcase size={16} />
              <span>Explore More Gigs</span>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="status-filter-tabs">
            {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                className={`status-tab-btn ${filter === st ? 'active' : ''}`}
                onClick={() => setFilter(st)}
              >
                {st}
                <span className="tab-count">
                  {st === 'ALL'
                    ? applications.length
                    : applications.filter((a) => a.status?.toLowerCase() === st.toLowerCase()).length}
                </span>
              </button>
            ))}
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
            ) : filteredApps.length > 0 ? (
              <div className="applications-grid-stack">
                {filteredApps.map((app) => (
                  <div key={app._id} className="app-card application-item-card">
                    <div className="app-item-top-row">
                      <div className="app-gig-info">
                        <span className="badge-category">{app.gig?.category || 'General'}</span>
                        <h3 className="app-gig-title">{app.gig?.title || 'Home Gig Request'}</h3>
                      </div>
                      <div className="app-status-wrap">
                        <span className={`status-badge ${app.status || 'pending'}`}>
                          {app.status || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    <div className="app-proposal-quote">
                      <span className="quote-label">Your Proposal:</span>
                      <p>&quot;{app.proposal}&quot;</p>
                    </div>

                    <div className="app-item-meta-foot">
                      <div className="meta-left-group">
                        <span className="proposed-rate-badge">
                          Offered: <strong>₹{app.proposedRate}</strong>
                        </span>
                        <span className="meta-time-text">
                          <Clock size={13} />
                          {app.createdAt
                            ? new Date(app.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                      </div>

                      <div className="meta-right-action">
                        {app.status === 'accepted' && (
                          <span className="accepted-congrats-pill">
                            <CheckCircle2 size={14} color="#059669" /> Client Accepted
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
                  <FileText size={32} />
                </div>
                <h3>No applications found</h3>
                <p>You haven&apos;t submitted any gig applications matching this filter status.</p>
                <Link to="/find-gigs" className="btn-primary">
                  Browse Nearby Gigs
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyApplicationsPage;
