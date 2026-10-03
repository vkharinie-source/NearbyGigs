import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { applicationService } from '../../services/applicationService';
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
} from 'lucide-react';
import './Gigs.css';

const FindGigsPage = () => {
  const { location } = useLocationContext();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 15);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'budget', 'newest'
  const [toastMessage, setToastMessage] = useState(null);

  // Apply Modal State
  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenApplyModal = (gig) => {
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
      showToast('Proposal submitted successfully to the customer!');
      fetchGigs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingApply(false);
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

        {/* Filter & Search Toolbar */}
        <section className="marketplace-filter-toolbar">
          <div className="toolbar-top-row">
            <div className="page-title-group">
              <h1>Find Local Gigs Nearby</h1>
              <p>
                Browse live jobs within <strong>{radius} km</strong> of {location.address || 'Bengaluru, Karnataka'}.
              </p>
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
                      <span className="badge-category">{gig.category}</span>
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
                          {gig.distanceKm ? `${gig.distanceKm} km away • ` : ''}{gig.address || 'Indiranagar'}
                        </span>
                        <span className="meta-time">
                          <Clock size={13} />
                          {gig.duration || 'Flexible'}
                        </span>
                      </div>

                      <button
                        className="btn-primary-sm"
                        onClick={() => handleOpenApplyModal(gig)}
                      >
                        Apply Proposal
                      </button>
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
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCategory('All');
                    setRadius(30);
                    setSearch('');
                  }}
                >
                  Reset Filters
                </button>
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

        {/* Apply Modal */}
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
                <div className="info-box-pill">
                  Client Budget: ₹{selectedGig.budgetMin} - ₹{selectedGig.budgetMax} • Schedule: {selectedGig.date || 'Today'}
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
                    placeholder="Describe your tools, background, and when you can arrive..."
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
      </main>
    </div>
  );
};

export default FindGigsPage;
