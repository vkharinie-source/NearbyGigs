import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import LocationMap from '../../components/map/LocationMap';
import { workerService } from '../../services/workerService';
import { requestService } from '../../services/requestService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import {
  Search,
  MapPin,
  Star,
  UserCheck,
  Phone,
  Mail,
  Clock,
  Send,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Users,
  Briefcase,
  ChevronRight,
  MessageSquare,
  Crosshair,
} from 'lucide-react';
import './Workers.css';

const FindWorkersPage = () => {
  const { location, requestBrowserLocation, startLiveTracking, isLiveTracking } = useLocationContext();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(15);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);

  // Request Service Modal State
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [requestDate, setRequestDate] = useState('Today');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const categoriesList = ['All', 'Electrical', 'Plumbing', 'Painting', 'Carpentry', 'Cleaning', 'Technology', 'Appliance'];

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await workerService.getNearbyWorkers({
        lat: location.lat,
        lng: location.lng,
        radius,
        category: category !== 'All' ? category : '',
        search,
      });
      setWorkers(data.workers || []);
    } catch (err) {
      console.error('Error fetching nearby workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [location.lat, location.lng, radius, category]);

  const handleLiveGpsClick = async () => {
    try {
      setLocatingGps(true);
      if (startLiveTracking) startLiveTracking();
      await requestBrowserLocation();
      showToast('Live GPS location synchronized successfully!');
    } catch (err) {
      showToast('Could not retrieve browser GPS. Please allow location permissions.');
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWorkers();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenRequestModal = (workerServiceObj) => {
    setSelectedWorker(workerServiceObj);
    setOfferedPrice(workerServiceObj.startingPrice || 500);
    setRequestNote('');
    setRequestDate('Today');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to send a service request.');
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
      showToast('Booking request sent directly to worker!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const formatAvailability = (val) => {
    switch (val) {
      case 'available_now':
        return { label: 'Available Now', cls: 'avail-now' };
      case 'available_today':
        return { label: 'Available Today', cls: 'avail-today' };
      case 'available_week':
        return { label: 'This Week', cls: 'avail-week' };
      default:
        return { label: 'Available', cls: 'avail-today' };
    }
  };

  return (
    <div className="marketplace-page-layout">
      <Navbar />

      <main className="marketplace-main-container">
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

        {/* Filter Toolbar */}
        <section className="marketplace-filter-toolbar">
          <div className="toolbar-top-row">
            <div className="page-title-group">
              <h1>Find Verified Local Specialists</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <p style={{ margin: 0 }}>
                  Showing specialists near <strong>{location.address || 'Bengaluru, Karnataka'}</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleLiveGpsClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Update Current GPS Location"
                >
                  {locatingGps ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />}
                  <span>{locatingGps ? 'Syncing...' : isLiveTracking ? 'Live GPS Active' : 'Live Track GPS'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="toolbar-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search workers by trade or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary-sm">Search</button>
            </form>
          </div>

          <div className="toolbar-bottom-row">
            <div className="category-chips-scroll">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  className={`cat-chip-btn ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="toolbar-controls-right">
              <div className="radius-selector-box">
                <Sliders size={14} />
                <span>Radius: {radius} km</span>
                <input
                  type="range"
                  min="3"
                  max="50"
                  step="2"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Marketplace Content */}
        <div className="marketplace-split-view">
          {/* Left Column: Worker Cards */}
          <div className="marketplace-cards-column">
            <div className="results-count-bar">
              <span>Showing <strong>{workers.length}</strong> verified pros</span>
            </div>

            {loading ? (
              <div className="cards-stack-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-line" />
                    <div className="skeleton-shimmer skeleton-line-short" />
                  </div>
                ))}
              </div>
            ) : workers.length > 0 ? (
              <div className="workers-grid-stack">
                {workers.map((w) => {
                  const avail = formatAvailability(w.worker?.availability || w.availability);
                  return (
                    <div key={w._id} className="worker-card-premium app-card">
                      <div className="worker-card-top-row">
                        <div className="worker-profile-cluster">
                          <div className="worker-avatar-lg">
                            {w.worker?.name ? w.worker.name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div>
                            <div className="worker-name-tag-row">
                              <h3 className="worker-fullname">{w.worker?.name || 'Local Expert'}</h3>
                              <span className="verified-shield-badge">
                                <ShieldCheck size={14} color="#10b981" /> Verified
                              </span>
                            </div>
                            <span className="worker-service-title">{w.title}</span>
                          </div>
                        </div>

                        <div className="worker-price-and-rating">
                          <span className="starting-rate-pill">
                            ₹{w.startingPrice} <small>/ start</small>
                          </span>
                          <div className="rating-pill-sm">
                            <Star size={13} className="star-icon-filled" />
                            <strong>{w.worker?.rating ? Number(w.worker.rating).toFixed(1) : '4.9'}</strong>
                          </div>
                        </div>
                      </div>

                      <p className="worker-desc-text">{w.description}</p>

                      {/* Skills Badges */}
                      {w.skills && w.skills.length > 0 && (
                        <div className="worker-skills-wrap">
                          {w.skills.map((sk, idx) => (
                            <span key={idx} className="skill-mini-tag">{sk}</span>
                          ))}
                        </div>
                      )}

                      <div className="worker-card-footer-row">
                        <div className="worker-meta-details">
                          <span className="meta-dist">
                            <MapPin size={13} color="#2563eb" />
                            {w.distanceKm ? `${w.distanceKm} km away` : 'Bengaluru'}
                          </span>
                          <span className={`avail-status-dot ${avail.cls}`}>
                            <span className="pulse-circle" /> {avail.label}
                          </span>
                        </div>

                        <div className="worker-action-buttons">
                          <button
                            className="btn-outline btn-sm-custom"
                            onClick={() => navigate('/messages')}
                            title="Message Worker"
                          >
                            <MessageSquare size={14} />
                            <span>Chat</span>
                          </button>
                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenRequestModal(w)}
                          >
                            Book Service
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-state-icon-box">
                  <Users size={32} />
                </div>
                <h3>No specialists found in this radius</h3>
                <p>Try expanding your radius or browsing all trade categories.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setCategory('All');
                      setRadius(50);
                      setSearch('');
                      fetchWorkers();
                    }}
                  >
                    Reset Filters & Show All
                  </button>
                  <button
                    className="btn-primary-sm"
                    onClick={handleLiveGpsClick}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Crosshair size={14} />
                    <span>Locate My GPS</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Map */}
          <div className="marketplace-map-column">
            <div className="sticky-map-wrapper">
              <div className="map-badge-header">
                <MapPin size={15} color="#2563eb" />
                <span>Nearby Workers Map</span>
              </div>
              <LocationMap
                center={[location.lat, location.lng]}
                zoom={12}
                workers={workers}
                height="600px"
              />
            </div>
          </div>
        </div>

        {/* Request Service Modal */}
        {selectedWorker && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setSelectedWorker(null)}>
            <div className="profile-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
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
                <div className="info-box-pill">
                  Service: {selectedWorker.title} • Base Rate: ₹{selectedWorker.startingPrice}
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Offered Amount (₹) *</label>
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
                    <label>Requested Date</label>
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
                  <label>Describe the Task & Location Details *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input-modern"
                    placeholder="Provide details about what needs fixing and your specific timing requirements..."
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
  );
};

export default FindWorkersPage;
