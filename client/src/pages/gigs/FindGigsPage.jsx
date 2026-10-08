import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { applicationService } from '../../services/applicationService';
import { reportService } from '../../services/reportService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import {
  Search,
  MapPin,
  Filter,
  Star,
  Clock,
  Briefcase,
  Send,
  Check,
  Compass,
  DollarSign,
  ChevronRight,
  Sliders,
  CheckCircle2,
  X,
  Loader2,
  PlusCircle,
  Calendar,
  Crosshair,
  ShieldCheck,
  ShieldAlert,
  Moon,
  AlertTriangle,
  Flag,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import './Gigs.css';

const FindGigsPage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation, startLiveTracking, isLiveTracking } = useLocationContext();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 25);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('distance');
  const [toastMessage, setToastMessage] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);

  // Safety Gate Modal State
  const [showGateModal, setShowGateModal] = useState(false);

  // Apply Modal State
  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

  // Report Modal State
  const [reportingGig, setReportingGig] = useState(null);
  const [reportReason, setReportReason] = useState('safety_concern');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const categoriesList = ['All', 'Electrical', 'Plumbing', 'Painting', 'Carpentry', 'Cleaning', 'Technology', 'Appliance'];

  const fetchGigs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await gigService.getNearbyGigs({
        lat: location.lat,
        lng: location.lng,
        radius,
        category: category !== 'All' ? category : '',
        search,
      });

      let results = data.gigs || [];
      if (sortBy === 'budget') {
        results.sort((a, b) => b.budgetMax - a.budgetMax);
      } else if (sortBy === 'newest') {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setGigs(results);
    } catch (err) {
      console.error('Error fetching nearby gigs:', err);
      setError('Unable to load gigs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [location.lat, location.lng, radius, category, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGigs();
  };

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isWorkerUnverified = user && (user.role === 'worker' || user.role === 'student_worker') && user.kycStatus !== 'VERIFIED';

  const handleOpenApplyModal = (gig) => {
    if (!user) {
      navigate('/login?tab=login&from=find-gigs');
      return;
    }
    if (user.role === 'customer') {
      alert('Employer accounts cannot apply for gigs. Please post a gig or switch to a worker account.');
      return;
    }
    if (isWorkerUnverified) {
      setSelectedGig(gig);
      setShowGateModal(true);
      return;
    }
    setSelectedGig(gig);
    setProposedRate(gig.budgetMin || 500);
    setProposal('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to submit a proposal.');
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
      showToast('Proposal submitted successfully! Check Safety Center for status.');
      fetchGigs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingGig) return;
    setSubmittingReport(true);
    try {
      await reportService.createReport({
        targetType: 'gig',
        targetId: reportingGig._id,
        targetTitle: reportingGig.title,
        reason: reportReason,
        details: reportDetails,
      });
      setReportingGig(null);
      setReportDetails('');
      showToast('Report submitted for admin review.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
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

        {/* SAFETY FIRST MARKETPLACE BANNER */}
        <div className="safety-first-banner animate-fade-in">
          <div className="safety-banner-icon">
            <ShieldCheck size={22} color="#2563eb" />
          </div>
          <div className="safety-banner-text">
            <h4>Safety-First Community Standard Active</h4>
            <p>
              To keep our local gig ecosystem 100% trustworthy and secure, all workers must complete Identity &amp; Safety Verification before applying for gigs.
            </p>
          </div>
          {(!user || user.kycStatus !== 'VERIFIED') && (
            <button
              className="btn-safety-verify-action"
              onClick={() => {
                if (!user) navigate('/login?tab=register&role=worker');
                else navigate('/onboarding?role=worker');
              }}
            >
              <Sparkles size={14} />
              <span>Complete Safety Steps</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Toolbar Hero Filter Header */}
        <section className="marketplace-toolbar-card">
          <div className="toolbar-top-row">
            <div className="location-pill-wrap">
              <MapPin size={16} className="loc-pin-icon" />
              <div className="loc-info-text">
                <span className="loc-label">CURRENT SEARCH LOCATION</span>
                <span className="loc-val">{location.address || 'Bengaluru, Karnataka'}</span>
              </div>
              <div style={{ marginLeft: '12px' }}>
                <button
                  type="button"
                  onClick={handleLiveGpsClick}
                  disabled={locatingGps}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isLiveTracking ? '#ecfdf5' : '#eff6ff',
                    border: `1px solid ${isLiveTracking ? '#6ee7b7' : '#bfdbfe'}`,
                    color: isLiveTracking ? '#059669' : '#2563eb',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
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
                placeholder="Search gigs by title or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary-sm">Search</button>
            </form>
          </div>

          {/* Category Chips & Controls */}
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

              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="distance">Sort by: Closest First</option>
                <option value="budget">Sort by: Budget (High-Low)</option>
                <option value="newest">Sort by: Recently Posted</option>
              </select>
            </div>
          </div>
        </section>

        {/* Two-Column Marketplace Content */}
        <div className="marketplace-split-view">
          {/* Left: Scrollable Gig Cards */}
          <div className="marketplace-cards-column">
            <div className="results-count-bar">
              <span>Showing <strong>{gigs.length}</strong> active gigs</span>
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
            ) : gigs.length > 0 ? (
              <div className="gigs-grid-stack">
                {gigs.map((gig) => (
                  <div key={gig._id} className="gig-card-premium">
                    <div className="gig-card-head">
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge-category">{gig.category}</span>
                        {gig.isVerifiedEmployer && (
                          <span className="badge-category" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                            <ShieldCheck size={12} /> Verified Employer
                          </span>
                        )}
                        {gig.isNightGig && (
                          <span className="badge-category" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>
                            <Moon size={12} /> Night Work Alert
                          </span>
                        )}
                      </div>
                      <span className="gig-price-range">
                        ₹{gig.budgetMin} - ₹{gig.budgetMax}
                      </span>
                    </div>

                    <h3 className="gig-card-title">{gig.title}</h3>
                    <p className="gig-card-description">{gig.description}</p>

                    {gig.requiredSkills && gig.requiredSkills.length > 0 && (
                      <div className="gig-skills-chips">
                        {gig.requiredSkills.map((sk, idx) => (
                          <span key={idx} className="skill-mini-tag">{sk}</span>
                        ))}
                      </div>
                    )}

                    <div className="gig-card-foot">
                      <div className="foot-meta-group">
                        <span className="meta-loc" title={gig.address}>
                          <MapPin size={13} color="#2563eb" />
                          {gig.distanceKm ? `${gig.distanceKm} km away • ` : ''}{gig.address || 'Bengaluru'}
                        </span>
                        <span className="meta-time">
                          <Clock size={13} />
                          {gig.time || gig.duration || 'Flexible'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="icon-btn-ghost"
                          title="Report Gig"
                          onClick={() => setReportingGig(gig)}
                          style={{ color: '#94a3b8' }}
                        >
                          <Flag size={14} />
                        </button>
                        <button
                          className="btn-primary-sm"
                          onClick={() => handleOpenApplyModal(gig)}
                        >
                          Apply Proposal
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-state-icon-box">
                  <Compass size={32} />
                </div>
                <h3>No gigs match your filters</h3>
                <p>Try increasing your search radius or clearing your category filters to view more opportunities.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setCategory('All');
                      setRadius(50);
                      setSearch('');
                      fetchGigs();
                    }}
                  >
                    Reset Filters & Show All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sticky Interactive Map */}
          <div className="marketplace-map-column">
            <div className="sticky-map-wrapper">
              <div className="map-badge-header">
                <MapPin size={15} color="#2563eb" />
                <span>Interactive Discovery Map</span>
              </div>
              <LocationMap
                center={[location.lat, location.lng]}
                zoom={12}
                gigs={gigs}
                height="600px"
              />
            </div>
          </div>
        </div>

        {/* Apply Modal with Night Work Safety Alert */}
        {selectedGig && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setSelectedGig(null)}>
            <div className="profile-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-title">
                  <Briefcase size={20} color="#2563eb" />
                  <h3>Submit Proposal: {selectedGig.title}</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setSelectedGig(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="modal-form-body">
                {/* Night Work Safety Alert Banner */}
                {selectedGig.isNightGig && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      color: '#92400e',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Moon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>🌙 Night Work Safety Alert:</strong>
                      <p style={{ margin: '0.2rem 0 0' }}>
                        This gig is scheduled during evening/night hours ({selectedGig.time || 'Late Evening'}). For student safety, your emergency contact or verified parent/guardian will receive safety status notifications upon work session start.
                      </p>
                    </div>
                  </div>
                )}

                <div className="info-box-pill">
                  Client Budget: ₹{selectedGig.budgetMin} - ₹{selectedGig.budgetMax} • Schedule: {selectedGig.date || 'Today'} ({selectedGig.time || 'Flexible'})
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
                  <label>Proposal Pitch / How you will complete it *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input-modern"
                    placeholder="Describe your tools, background, and safety preparation..."
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
                        <span>Sending Proposal...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportingGig && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setReportingGig(null)}>
            <div className="profile-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-title">
                  <Flag size={20} color="#dc2626" />
                  <h3>Report Gig: {reportingGig.title}</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setReportingGig(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="modal-form-body">
                <div className="form-group-modern">
                  <label>Reason *</label>
                  <select
                    className="form-input-modern"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="safety_concern">Safety Concern</option>
                    <option value="fraud_or_scam">Fraud / Scam Suspicion</option>
                    <option value="suspicious_employer">Suspicious Employer</option>
                    <option value="underage_violation">Underage Hazard</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Details *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input-modern"
                    placeholder="Provide details about why this gig is suspicious or unsafe..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setReportingGig(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-danger-outline" disabled={submittingReport}>
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SAFETY VERIFICATION GATE MODAL */}
        {showGateModal && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setShowGateModal(false)}>
            <div className="profile-modal-card safety-gate-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-title">
                  <ShieldAlert size={22} color="#2563eb" />
                  <h3>Safety &amp; Identity Verification Required</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setShowGateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-form-body">
                <p className="safety-gate-intro">
                  NearbyGigs enforces safety measures first. Before you can submit proposals or unlock contact details for <strong>{selectedGig?.title || 'this gig'}</strong>, please complete our quick safety verification.
                </p>

                <div className="safety-gate-features-grid">
                  <div className="safety-gate-feature-item">
                    <div className="safety-icon-circle"><ShieldCheck size={18} color="#10b981" /></div>
                    <div>
                      <strong>Masked Aadhaar KYC Privacy</strong>
                      <p>Verify your identity safely without exposing raw government IDs.</p>
                    </div>
                  </div>

                  <div className="safety-gate-feature-item">
                    <div className="safety-icon-circle"><Lock size={18} color="#2563eb" /></div>
                    <div>
                      <strong>Emergency SOS &amp; Work Session Safety</strong>
                      <p>Real-time distress alert network and live guardian safety notifications.</p>
                    </div>
                  </div>

                  <div className="safety-gate-feature-item">
                    <div className="safety-icon-circle"><CheckCircle2 size={18} color="#8b5cf6" /></div>
                    <div>
                      <strong>Skill &amp; Background Certification</strong>
                      <p>Show employers you are certified for the job with zero unverified spam.</p>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-cancel" onClick={() => setShowGateModal(false)}>
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    className="btn-save-primary"
                    onClick={() => {
                      setShowGateModal(false);
                      navigate('/onboarding?role=worker');
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Complete Verification Now</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FindGigsPage;
