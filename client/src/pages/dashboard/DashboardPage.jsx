import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { workerService } from '../../services/workerService';
import { requestService } from '../../services/requestService';
import { applicationService } from '../../services/applicationService';
import { notificationService } from '../../services/notificationService';
import { messageService } from '../../services/messageService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import {
  Briefcase,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Send,
  Star,
  Compass,
  FileText,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import './Dashboard.css';

const DashboardPage = () => {
  const { user } = useAuthContext();
  const { location } = useLocationContext();
  const navigate = useNavigate();

  const [nearbyGigs, setNearbyGigs] = useState([]);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    activeGigs: 0,
    applications: 0,
    requests: 0,
    messagesCount: 0,
  });
  const [activeTab, setActiveTab] = useState('gigs'); // 'gigs' or 'workers'
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Request Service Modal State
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [requestDate, setRequestDate] = useState('Today');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Apply Gig Modal State
  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [gigsRes, workersRes, appsRes, reqsRes, notifsRes, convsRes] = await Promise.allSettled([
        gigService.getNearbyGigs({ lat: location.lat, lng: location.lng, radius: 25 }),
        workerService.getNearbyWorkers({ lat: location.lat, lng: location.lng, radius: 25 }),
        applicationService.getMyApplications(),
        requestService.getRequests(),
        notificationService.getNotifications(),
        messageService.getConversations(),
      ]);

      const gigsList = gigsRes.status === 'fulfilled' ? gigsRes.value?.gigs || [] : [];
      const workersList = workersRes.status === 'fulfilled' ? workersRes.value?.workers || [] : [];
      const myApps = appsRes.status === 'fulfilled' ? appsRes.value?.applications || [] : [];
      const myReqs = reqsRes.status === 'fulfilled' ? reqsRes.value?.requests || [] : [];
      const notifs = notifsRes.status === 'fulfilled' ? notifsRes.value?.notifications || [] : [];
      const convs = convsRes.status === 'fulfilled' ? convsRes.value?.conversations || [] : [];

      setNearbyGigs(gigsList);
      setNearbyWorkers(workersList);

      setStats({
        activeGigs: gigsList.filter((g) => g.status === 'open' || g.status === 'in_progress').length,
        applications: myApps.length,
        requests: myReqs.length,
        messagesCount: convs.length,
      });

      if (notifs.length > 0) {
        setActivities(notifs.slice(0, 4));
      } else {
        const fallbacks = [];
        myApps.slice(0, 2).forEach((a) => {
          fallbacks.push({
            _id: a._id,
            title: `Applied to ${a.gig?.title || 'Gig'}`,
            message: `Proposal submitted for ₹${a.proposedRate} (${a.status.toUpperCase()})`,
            createdAt: a.createdAt,
          });
        });
        setActivities(fallbacks);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [location.lat, location.lng]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Request Modal
  const handleOpenRequestModal = (workerObj) => {
    setSelectedWorker(workerObj);
    setOfferedPrice(workerObj.startingPrice || 500);
    setRequestNote('');
    setRequestDate('Today');
  };

  // Submit Service Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingRequest(true);
    try {
      await requestService.createRequest({
        serviceId: selectedWorker._id,
        note: requestNote,
        offeredPrice: Number(offeredPrice),
        requestedDate: requestDate,
      });
      setSelectedWorker(null);
      showToast('Service request sent directly to worker!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send service request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Open Apply Modal
  const handleOpenApplyModal = (gigObj) => {
    setSelectedGig(gigObj);
    setProposedRate(gigObj.budgetMin || 500);
    setProposal('');
  };

  // Submit Gig Proposal
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmittingApply(true);
    try {
      await applicationService.applyForGig({
        gigId: selectedGig._id,
        proposal,
        proposedRate: Number(proposedRate),
        estimatedTime: selectedGig.duration || '2-3 Hours',
      });
      setSelectedGig(null);
      showToast('Proposal submitted successfully!');
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content dashboard-page">
          {/* TOAST ALERT */}
          {toastMessage && (
            <div className="profile-toast animate-slide-down">
              <CheckCircle2 size={18} color="#10b981" />
              <span>{toastMessage}</span>
              <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* ==================================================
              1. WELCOME BANNER
              ================================================== */}
          <section className="dash-welcome-card animate-fade-in">
            <div className="welcome-text-col">
              <div className="welcome-badge-pill">
                <Sparkles size={14} />
                <span>Live Marketplace Radar</span>
              </div>
              <h2>
                {getGreeting()}, {user?.name || 'Friend'} 👋
              </h2>
              <p className="welcome-subtext">
                Here is what is happening around your area in{' '}
                <strong>{location.address || 'Bengaluru, Karnataka'}</strong>.
              </p>
            </div>

            <div className="welcome-actions-row">
              <Link to="/create-gig" className="btn-primary">
                <PlusCircle size={16} />
                <span>Post a Gig</span>
              </Link>
              <Link to="/find-gigs" className="btn-outline">
                <Compass size={16} />
                <span>Find Gigs</span>
              </Link>
            </div>
          </section>

          {/* ==================================================
              2. QUICK KPI METRIC CARDS
              ================================================== */}
          <section className="kpi-metrics-grid">
            <div className="kpi-card" onClick={() => navigate('/find-gigs')}>
              <div className="kpi-icon-wrapper icon-emerald">
                <Briefcase size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{stats.activeGigs}</span>
                <span className="kpi-label">Active Nearby Gigs</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/my-applications')}>
              <div className="kpi-icon-wrapper icon-blue">
                <FileText size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{stats.applications}</span>
                <span className="kpi-label">My Applications</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/requests')}>
              <div className="kpi-icon-wrapper icon-indigo">
                <Clock size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{stats.requests}</span>
                <span className="kpi-label">Service Requests</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>

            <div className="kpi-card" onClick={() => navigate('/messages')}>
              <div className="kpi-icon-wrapper icon-amber">
                <MessageSquare size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{stats.messagesCount}</span>
                <span className="kpi-label">Active Chats</span>
              </div>
              <ArrowUpRight size={18} className="kpi-corner-arrow" />
            </div>
          </section>

          {/* ==================================================
              3. TWO-COLUMN DISCOVERY & RADAR MAP
              ================================================== */}
          <div className="dashboard-two-column-layout">
            {/* Left Column: Recommended Near You */}
            <section className="dash-card discovery-column-card">
              <div className="discovery-header-tabs">
                <div className="tabs-pill-box">
                  <button
                    className={`tab-btn ${activeTab === 'gigs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gigs')}
                  >
                    <Briefcase size={16} />
                    <span>Nearby Gigs ({nearbyGigs.length})</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'workers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workers')}
                  >
                    <Users size={16} />
                    <span>Verified Pros ({nearbyWorkers.length})</span>
                  </button>
                </div>

                <Link
                  to={activeTab === 'gigs' ? '/find-gigs' : '/find-workers'}
                  className="link-see-all"
                >
                  <span>See all</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* GIGS TAB CONTENT */}
              {activeTab === 'gigs' && (
                <div className="discovery-cards-list">
                  {loading ? (
                    <div className="skeleton-card">
                      <div className="skeleton-shimmer skeleton-title" />
                      <div className="skeleton-shimmer skeleton-line" />
                      <div className="skeleton-shimmer skeleton-line-short" />
                    </div>
                  ) : nearbyGigs.length > 0 ? (
                    nearbyGigs.slice(0, 4).map((gig) => (
                      <div key={gig._id} className="dash-gig-item">
                        <div className="item-header-row">
                          <span className="badge-category">{gig.category}</span>
                          <span className="budget-tag-pill">
                            ₹{gig.budgetMin} - ₹{gig.budgetMax}
                          </span>
                        </div>

                        <h4 className="item-title">{gig.title}</h4>
                        <p className="item-desc">{gig.description}</p>

                        <div className="item-footer-row">
                          <span className="item-meta-info">
                            <MapPin size={13} color="#2563eb" />
                            {gig.address || 'Indiranagar'}
                          </span>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenApplyModal(gig)}
                          >
                            <span>Apply Proposal</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <div className="empty-state-icon-box">
                        <Briefcase size={28} />
                      </div>
                      <h3>No Gigs in Immediate Radius</h3>
                      <p>Be the first to post a gig request or expand your search distance.</p>
                      <Link to="/create-gig" className="btn-primary">
                        Post a Gig Free
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* WORKERS TAB CONTENT */}
              {activeTab === 'workers' && (
                <div className="discovery-cards-list">
                  {loading ? (
                    <div className="skeleton-card">
                      <div className="skeleton-shimmer skeleton-title" />
                      <div className="skeleton-shimmer skeleton-line" />
                    </div>
                  ) : nearbyWorkers.length > 0 ? (
                    nearbyWorkers.slice(0, 4).map((w) => (
                      <div key={w._id} className="dash-worker-item">
                        <div className="worker-header-group">
                          <div className="worker-avatar-small">
                            {w.worker?.name ? w.worker.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <h4 className="worker-name-heading">
                              {w.worker?.name || 'Local Pro'}
                            </h4>
                            <span className="worker-specialty-sub">{w.title}</span>
                          </div>
                          <div className="rating-pill-sm">
                            <Star size={12} className="star-icon-filled" />
                            <span>{w.worker?.rating || 4.9}</span>
                          </div>
                        </div>

                        <p className="item-desc">{w.description}</p>

                        <div className="item-footer-row">
                          <span className="rate-start-badge">
                            ₹{w.startingPrice} <small>/ start</small>
                          </span>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenRequestModal(w)}
                          >
                            <span>Request Service</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <div className="empty-state-icon-box">
                        <Users size={28} />
                      </div>
                      <h3>No Workers Found Nearby</h3>
                      <p>Offer your skills and publish a service to receive direct neighborhood bookings.</p>
                      <Link to="/profile" className="btn-primary">
                        Set Up Worker Profile
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Right Column: Interactive Map & Live Activity */}
            <div className="radar-column-stack">
              <section className="dash-card radar-map-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <MapPin size={20} color="#2563eb" />
                    <div>
                      <h3>Neighborhood Radar</h3>
                      <p className="card-subtitle">Real-time geo-pinned requests in Bengaluru</p>
                    </div>
                  </div>
                </div>

                <div className="radar-map-wrapper">
                  <LocationMap
                    center={[location.lat, location.lng]}
                    zoom={12}
                    gigs={nearbyGigs}
                    workers={nearbyWorkers}
                    height="320px"
                  />
                </div>
              </section>

              {/* Recent Activity Card */}
              <section className="dash-card recent-activity-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <Clock size={20} color="#2563eb" />
                    <div>
                      <h3>Recent Activity</h3>
                      <p className="card-subtitle">Your latest milestones & notifications</p>
                    </div>
                  </div>
                </div>

                <div className="activity-feed-list">
                  {activities.length > 0 ? (
                    activities.map((act) => (
                      <div key={act._id} className="activity-row-item">
                        <div className="activity-icon-bullet">
                          <CheckCircle2 size={15} color="#2563eb" />
                        </div>
                        <div className="activity-info">
                          <span className="activity-title-text">{act.title}</span>
                          <span className="activity-message-text">{act.message}</span>
                          <span className="activity-time-stamp">
                            {act.createdAt
                              ? new Date(act.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-activity-text">
                      <Clock size={28} color="#94a3b8" />
                      <p>No recent activity yet. Apply for a gig or post a service to get started.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* ==================================================
              INLINE MODAL: APPLY TO GIG
              ================================================== */}
          {selectedGig && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setSelectedGig(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <Briefcase size={20} color="#2563eb" />
                    <h3>Apply to &quot;{selectedGig.title}&quot;</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedGig(null)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleApplySubmit} className="modal-form-body">
                  <div className="form-group-modern">
                    <label>Gig Budget Range</label>
                    <div className="info-box-pill">
                      ₹{selectedGig.budgetMin} - ₹{selectedGig.budgetMax} • Category: {selectedGig.category}
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label>Your Proposed Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      className="form-input-modern"
                      value={proposedRate}
                      onChange={(e) => setProposedRate(e.target.value)}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Cover Proposal / Pitch *</label>
                    <textarea
                      rows={3}
                      required
                      className="form-input-modern"
                      placeholder="Explain your relevant experience, tools, and availability for this gig..."
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setSelectedGig(null)}
                      disabled={submittingApply}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingApply}
                    >
                      {submittingApply ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Submitting Proposal...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Proposal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================================================
              INLINE MODAL: REQUEST SERVICE
              ================================================== */}
          {selectedWorker && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setSelectedWorker(null)}>
              <div
                className="profile-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <Users size={20} color="#2563eb" />
                    <h3>Book Service with {selectedWorker.worker?.name || 'Local Pro'}</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedWorker(null)}>
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} className="modal-form-body">
                  <div className="form-group-modern">
                    <label>Service Selected</label>
                    <div className="info-box-pill">
                      {selectedWorker.title} (Starting at ₹{selectedWorker.startingPrice})
                    </div>
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group-modern">
                      <label>Offered Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="50"
                        className="form-input-modern"
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(e.target.value)}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label>Preferred Date</label>
                      <select
                        className="form-input-modern"
                        value={requestDate}
                        onChange={(e) => setRequestDate(e.target.value)}
                      >
                        <option value="Today">Today (Urgent)</option>
                        <option value="Tomorrow">Tomorrow</option>
                        <option value="This Weekend">This Weekend</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label>Task Note / Job Description *</label>
                    <textarea
                      rows={3}
                      required
                      className="form-input-modern"
                      placeholder="Describe what you need fixed, your location details, and preferred timing..."
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setSelectedWorker(null)}
                      disabled={submittingRequest}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={submittingRequest}
                    >
                      {submittingRequest ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Booking Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
