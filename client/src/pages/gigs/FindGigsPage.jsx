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
  Bookmark,
  BookmarkCheck,
  Building2,
  Layers,
  GraduationCap,
  Info,
  HelpCircle,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import './Gigs.css';
import SafeApplicationModal from '../../components/application/SafeApplicationModal';

const FindGigsPage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation, startLiveTracking, isLiveTracking } = useLocationContext();
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 50);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('distance');
  const [workTypeFilter, setWorkTypeFilter] = useState('All'); // All | On-site | Remote | Hybrid
  const [studentOnly, setStudentOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  const [toastMessage, setToastMessage] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [savedGigsSet, setSavedGigsSet] = useState(new Set());

  // Apply Modal State
  const [selectedGig, setSelectedGig] = useState(null);
  const [proposal, setProposal] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true);
  const [submittingApply, setSubmittingApply] = useState(false);

  // Eligibility Explanation Modal State
  const [activeEligibilityInfo, setActiveEligibilityInfo] = useState(null);

  // Auth Prompt Modal State (when non-registered user clicks Apply Now)
  const [authPromptGig, setAuthPromptGig] = useState(null);

  // Report Modal State
  const [reportingGig, setReportingGig] = useState(null);
  const [reportReason, setReportReason] = useState('safety_concern');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const categoriesList = [
    'All',
    'Electrical',
    'Plumbing',
    'Painting',
    'Carpentry',
    'Cleaning',
    'Technology',
    'Tutoring',
    'Appliance',
    'Campus',
  ];

  const fetchGigs = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = {
        lat: location.lat,
        lng: location.lng,
        radius,
        category: category !== 'All' ? category : '',
        search,
        studentOnly: studentOnly ? 'true' : 'false',
        verifiedOnly: verifiedOnly ? 'true' : 'false',
      };

      if (workTypeFilter !== 'All') queryParams.jobType = workTypeFilter;
      if (minPay) queryParams.minBudget = minPay;
      if (maxPay) queryParams.maxBudget = maxPay;
      if (experienceLevel) queryParams.experienceLevel = experienceLevel;

      const data = await gigService.getNearbyGigs(queryParams);

      let results = data.gigs || [];
      if (sortBy === 'budget') {
        results.sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
      } else if (sortBy === 'newest') {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setGigs(results);

      // Track saved gigs
      const savedIds = new Set();
      results.forEach((g) => {
        if (g.isSaved) savedIds.add(g._id);
      });
      setSavedGigsSet(savedIds);
    } catch (err) {
      console.error('Error fetching nearby gigs:', err);
      setError('Unable to load active jobs. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [
    location.lat,
    location.lng,
    radius,
    category,
    sortBy,
    workTypeFilter,
    studentOnly,
    verifiedOnly,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGigs();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

  // Save / Bookmark Gig
  const handleToggleSaveGig = async (gigId, e) => {
    e?.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const isCurrentlySaved = savedGigsSet.has(gigId);
    try {
      if (isCurrentlySaved) {
        await gigService.unsaveGig(gigId);
        setSavedGigsSet((prev) => {
          const next = new Set(prev);
          next.delete(gigId);
          return next;
        });
        showToast('Job removed from saved bookmarks.');
      } else {
        await gigService.saveGig(gigId);
        setSavedGigsSet((prev) => new Set(prev).add(gigId));
        showToast('Job saved to your bookmarks!');
      }
    } catch (err) {
      showToast('Could not update saved status.');
    }
  };

  // Open Apply Modal
  const handleOpenApplyModal = (gig) => {
    if (!user) {
      try {
        sessionStorage.setItem('pendingApplyGigId', gig._id);
        sessionStorage.setItem('pendingApplyGigTitle', gig.title);
      } catch (e) {}
      setAuthPromptGig(gig);
      return;
    }

    if (user.role === 'customer' || user.purpose === 'post_jobs') {
      alert('You are currently in Employer mode. Switch to Worker mode or create a worker profile to apply for jobs.');
      return;
    }

    if (!user.onboardingCompleted) {
      showToast('Please select your applicant category and upload verification proof before applying.');
      navigate(`/onboarding?purpose=find_work&applyGigId=${gig._id}`);
      return;
    }

    // Check if not eligible or verification required (Strict Verification Gate)
    if (gig.eligibility && !gig.eligibility.isEligible) {
      setActiveEligibilityInfo({
        gigTitle: gig.title,
        eligibility: gig.eligibility,
      });
      return;
    }

    setSelectedGig(gig);
    setProposedRate(gig.budgetMin || 500);
    setProposal('');
    setPortfolioLink('');
    setCertificateName('');
    setAvailabilityConfirmed(true);
  };

  // Automatically reopen apply modal if user returned from registering or logging in
  useEffect(() => {
    if (user && gigs.length > 0) {
      const applyIdFromUrl = searchParams.get('applyGigId');
      let applyIdFromSession = null;
      try {
        applyIdFromSession = sessionStorage.getItem('pendingApplyGigId');
      } catch (e) {}
      const targetGigId = applyIdFromUrl || applyIdFromSession;
      if (targetGigId) {
        const targetGig = gigs.find((g) => g._id === targetGigId);
        if (targetGig) {
          try {
            sessionStorage.removeItem('pendingApplyGigId');
            sessionStorage.removeItem('pendingApplyGigTitle');
          } catch (e) {}
          handleOpenApplyModal(targetGig);
        }
      }
    }
  }, [user, gigs, searchParams]);

  // Submit Application with Suitability Proof & Verified Criteria
  const handleSafeApplySubmit = async ({ proposedRate: rate, proposal: pitch, tier, criteriaAccepted }) => {
    if (!user) {
      alert('Please sign in to submit a proposal.');
      return;
    }
    setSubmittingApply(true);
    try {
      const suitabilityProof = {
        coverMessage: pitch,
        tier,
        criteriaAccepted,
        availabilityConfirmed: true,
        portfolioLinks: portfolioLink ? [{ title: 'Work Sample', url: portfolioLink }] : [],
        certifications: certificateName ? [{ name: certificateName, issuer: 'Verified Holder' }] : [],
      };

      await applicationService.applyForGig({
        gigId: selectedGig._id,
        proposal: pitch,
        proposedRate: Number(rate),
        estimatedTime: selectedGig.duration || '2-3 Hours',
        suitabilityProof,
      });

      setSelectedGig(null);
      showToast('🛡️ Verified Proposal Submitted! All safety & eligibility criteria accepted.');
      fetchGigs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Submit Report
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
      showToast('Report submitted for safety investigation.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Helper for rendering Eligibility Badges
  const renderEligibilityBadge = (eligibility) => {
    if (!eligibility) return null;

    let badgeClass = 'badge-eligible';
    let icon = <CheckCircle2 size={13} color="#059669" />;
    let text = eligibility.status;

    if (eligibility.status === 'Requires Verification') {
      badgeClass = 'badge-verification';
      icon = <ShieldAlert size={13} color="#d97706" />;
    } else if (eligibility.status === 'Additional Information Required') {
      badgeClass = 'badge-info-needed';
      icon = <Info size={13} color="#2563eb" />;
    } else if (eligibility.status === 'Not Eligible for This Job') {
      badgeClass = 'badge-ineligible';
      icon = <X size={13} color="#dc2626" />;
    }

    return (
      <button
        type="button"
        className={`eligibility-badge-btn ${badgeClass}`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveEligibilityInfo({
            gigTitle: 'Eligibility Analysis',
            eligibility,
          });
        }}
        title="Click to view eligibility breakdown"
      >
        {icon}
        <span>{text}</span>
      </button>
    );
  };

  return (
    <div className="marketplace-page-layout">
      <Navbar />

      <main className="marketplace-main-container">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="profile-toast animate-slide-down">
            <CheckCircle2 size={18} color="#10b981" />
            <span>{toastMessage}</span>
            <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Community Safety Banner */}
        <div className="safety-first-banner animate-fade-in">
          <div className="safety-banner-icon">
            <ShieldCheck size={24} color="#2563eb" />
          </div>
          <div className="safety-banner-text">
            <h4>Verified Gig Marketplace &amp; Smart Eligibility</h4>
            <p>
              All listings are checked for lawful compliance, fair rates, and student safety curfews. Verified worker commitment and single-use arrival OTPs ensure safe task completion.
            </p>
          </div>
          {(!user || user.kycStatus !== 'verified') && (
            <button
              className="btn-safety-verify-action"
              onClick={() => {
                if (!user) navigate('/login?tab=register&role=worker');
                else navigate('/onboarding');
              }}
            >
              <Sparkles size={14} />
              <span>Complete Verification</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Search & Location Toolbar */}
        <section className="marketplace-toolbar-card">
          <div className="toolbar-top-row">
            <div className="location-pill-wrap">
              <MapPin size={16} className="loc-pin-icon" />
              <div className="loc-info-text">
                <span className="loc-label">SEARCH AREA</span>
                <span className="loc-sep">•</span>
                <span className="loc-val">{location.address || 'Bengaluru, Karnataka'}</span>
              </div>
              <button
                type="button"
                onClick={handleLiveGpsClick}
                disabled={locatingGps}
                className="live-gps-pill-btn"
              >
                {locatingGps ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />}
                <span>{locatingGps ? 'Locating...' : isLiveTracking ? 'Live GPS Active' : 'Live GPS'}</span>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="toolbar-search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs by title, skills (e.g. Electrical, Python, Tutoring)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary-sm" style={{ background: '#0F766E', color: '#FFFFFF', borderRadius: '8px', padding: '6px 14px', fontWeight: 700 }}>Search</button>
            </form>
          </div>

          {/* Category Chips Scroll */}
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
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
              </div>

              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="distance">Sort: Closest Distance</option>
                <option value="budget">Sort: Highest Pay</option>
                <option value="newest">Sort: Recently Posted</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Strip */}
          <div className="toolbar-advanced-strip">
            {/* Work Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
              <span>Work Type:</span>
              <select
                className="sort-dropdown"
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Student-eligible checkbox */}
            <label className="filter-pill-label">
              <input
                type="checkbox"
                checked={studentOnly}
                onChange={(e) => setStudentOnly(e.target.checked)}
                style={{ accentColor: '#0F766E' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <GraduationCap size={14} color="#0F766E" /> Student Eligible
              </span>
            </label>

            {/* Verified Employers only */}
            <label className="filter-pill-label">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                style={{ accentColor: '#0F766E' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#0F766E" /> Verified Employers Only
              </span>
            </label>
          </div>
        </section>

        {/* Two-Column Marketplace View */}
        <div className="marketplace-split-view">
          {/* Left Column: Job Cards List */}
          <div className="marketplace-cards-column">
            <div className="results-count-bar">
              <span>
                Found <strong style={{ color: '#0F172A' }}>{gigs.length}</strong> active jobs in your area
              </span>
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
                {gigs.map((gig) => {
                  const isSaved = savedGigsSet.has(gig._id);
                  return (
                    <div key={gig._id} className="gig-card-premium animate-fade-in">
                      <div className="gig-card-head">
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="badge-category">{gig.category}</span>
                          <span
                            className="badge-category"
                            style={{
                              background: gig.jobType === 'Remote' ? '#F0FDFA' : '#F1F5F9',
                              color: gig.jobType === 'Remote' ? '#0F766E' : '#334155',
                              borderColor: gig.jobType === 'Remote' ? '#CCFBF1' : '#E2E8F0',
                            }}
                          >
                            {gig.jobType || 'On-site'}
                          </span>

                          {gig.isVerifiedEmployer && (
                            <span
                              className="badge-category"
                              style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}
                            >
                              <ShieldCheck size={12} /> Verified Employer
                            </span>
                          )}

                          {gig.isNightGig && (
                            <span
                              className="badge-category"
                              style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}
                            >
                              <Moon size={12} /> Night Work
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="gig-price-range">
                            ₹{gig.budgetMin} {gig.budgetMax !== gig.budgetMin ? `- ₹${gig.budgetMax}` : ''}
                            <small style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginLeft: '3px' }}>
                              /{gig.salaryType || 'Fixed'}
                            </small>
                          </span>

                          {/* Save Job Bookmark Button */}
                          <button
                            type="button"
                            className="icon-btn-ghost"
                            onClick={(e) => handleToggleSaveGig(gig._id, e)}
                            title={isSaved ? 'Remove from saved' : 'Save job'}
                            style={{ color: isSaved ? '#0F766E' : '#94A3B8' }}
                          >
                            {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                          </button>
                        </div>
                      </div>

                      <h3 className="gig-card-title">{gig.title}</h3>
                      <p className="gig-card-description">{gig.description}</p>

                      {/* Required Skills */}
                      {gig.requiredSkills && gig.requiredSkills.length > 0 && (
                        <div className="gig-skills-chips">
                          {gig.requiredSkills.map((sk, idx) => (
                            <span key={idx} className="skill-mini-tag">{sk}</span>
                          ))}
                        </div>
                      )}

                      {/* Employer & Details Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          margin: '0.75rem 0',
                          padding: '0.5rem 0',
                          borderTop: '1px solid #F1F5F9',
                          borderBottom: '1px solid #F1F5F9',
                          fontSize: '0.82rem',
                          color: '#64748B',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0F172A' }}>
                          <Building2 size={13} color="#0F766E" />
                          {gig.postedBy?.companyName || gig.postedBy?.name || 'Local Employer'}
                        </span>
                        <span>•</span>
                        <span>Schedule: <strong style={{ color: '#0F172A' }}>{gig.time || gig.duration || 'Flexible'}</strong></span>
                        {gig.applicantsCount !== undefined && (
                          <>
                            <span>•</span>
                            <span>{gig.applicantsCount} {gig.applicantsCount === 1 ? 'applicant' : 'applicants'}</span>
                          </>
                        )}
                      </div>

                      {/* Eligibility Status Badge */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        {renderEligibilityBadge(gig.eligibility)}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="gig-card-foot">
                        <div className="foot-meta-group">
                          <span className="meta-loc" title={gig.address}>
                            <MapPin size={13} color="#0F766E" />
                            {gig.distanceKm ? `${gig.distanceKm} km away • ` : ''}{gig.address || 'Bengaluru'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="icon-btn-ghost"
                            title="Report Job"
                            onClick={() => setReportingGig(gig)}
                            style={{ color: '#94a3b8' }}
                          >
                            <Flag size={14} />
                          </button>

                          <button
                            className="btn-primary-sm"
                            onClick={() => handleOpenApplyModal(gig)}
                          >
                            Apply Now
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
                  <Compass size={32} />
                </div>
                <h3>No jobs matching your criteria</h3>
                <p>Try expanding your radius, clearing category filters, or searching for other skills.</p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setCategory('All');
                    setRadius(50);
                    setSearch('');
                    setWorkTypeFilter('All');
                    setStudentOnly(false);
                    setVerifiedOnly(false);
                    fetchGigs();
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Interactive Radar Map */}
          <div className="marketplace-map-column">
            <div className="sticky-map-wrapper">
              <div className="map-badge-header">
                <MapPin size={15} color="#2563eb" />
                <span>Geofenced Radar Map</span>
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

        {/* =========================================================================
            SAFE & SECURE MULTI-TIER APPLICATION MODAL
            ========================================================================= */}
        <SafeApplicationModal
          gig={selectedGig}
          user={user}
          isOpen={!!selectedGig}
          onClose={() => setSelectedGig(null)}
          onSubmit={handleSafeApplySubmit}
          isSubmitting={submittingApply}
        />

        {/* =========================================================================
            ELIGIBILITY EXPLANATION MODAL (Section 4)
            ========================================================================= */}
        {activeEligibilityInfo && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setActiveEligibilityInfo(null)}>
            <div
              className="profile-modal-card animate-scale-up"
              style={{ maxWidth: '520px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-title">
                  <ShieldCheck size={20} color="#2563eb" />
                  <h3>Smart Eligibility Breakdown</h3>
                </div>
                <button className="modal-close-btn" onClick={() => setActiveEligibilityInfo(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-form-body">
                <div
                  style={{
                    background:
                      activeEligibilityInfo.eligibility.status === 'Eligible to Apply'
                        ? '#ecfdf5'
                        : activeEligibilityInfo.eligibility.status === 'Not Eligible for This Job'
                        ? '#fef2f2'
                        : '#eff6ff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                    Status: {activeEligibilityInfo.eligibility.status}
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0, lineHeight: '1.5' }}>
                    {activeEligibilityInfo.eligibility.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Evaluation Factors:
                  </h5>

                  {activeEligibilityInfo.eligibility.reasons &&
                    activeEligibilityInfo.eligibility.reasons.map((r, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#1e293b',
                          background: '#f8fafc',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                        }}
                      >
                        <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{r}</span>
                      </div>
                    ))}
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {activeEligibilityInfo.eligibility.status === 'Requires Verification' && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: '#0F766E', borderColor: '#0F766E', padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                      onClick={() => {
                        setActiveEligibilityInfo(null);
                        navigate('/onboarding');
                      }}
                    >
                      Verify Documents Now <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                    onClick={() => setActiveEligibilityInfo(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
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
                  <h3>Report Job: {reportingGig.title}</h3>
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
                    <option value="underage_violation">Underage Hazard Violation</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Details *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-input-modern"
                    placeholder="Provide details about why this listing violates safety standards..."
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

        {/* REGISTRATION REQUIRED MODAL */}
        {authPromptGig && (
          <div className="profile-modal-overlay animate-fade-in" onClick={() => setAuthPromptGig(null)}>
            <div
              className="profile-modal-card animate-scale-up"
              style={{ maxWidth: '480px', textAlign: 'center', padding: '2rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
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
                  boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.25)',
                }}
              >
                <UserCheck size={32} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginBottom: '0.75rem',
                }}
              >
                ACCOUNT REQUIRED
              </div>

              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
                Register to Apply for this Job
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                You must register as a verified worker or student on NearbyGigs before submitting a job proposal.
              </p>

              {/* Job snippet preview */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                  Target Job
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '3px', marginBottom: '6px' }}>
                  {authPromptGig.title}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#475569', flexWrap: 'wrap' }}>
                  <span>Rate: <strong style={{ color: '#059669' }}>₹{authPromptGig.budgetMin} - ₹{authPromptGig.budgetMax}</strong></span>
                  <span>•</span>
                  <span>Schedule: <strong>{authPromptGig.time || authPromptGig.duration || 'Flexible'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-save-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem' }}
                  onClick={() => {
                    try {
                      sessionStorage.setItem('pendingApplyGigId', authPromptGig._id);
                      sessionStorage.setItem('pendingApplyGigTitle', authPromptGig.title);
                    } catch (e) {}
                    navigate(`/register?from=apply&gigId=${authPromptGig._id}&gigTitle=${encodeURIComponent(authPromptGig.title)}&role=worker`);
                  }}
                >
                  <Sparkles size={16} />
                  <span>Register Free Account &amp; Apply</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.92rem', background: '#ffffff', border: '1px solid #cbd5e1' }}
                  onClick={() => {
                    try {
                      sessionStorage.setItem('pendingApplyGigId', authPromptGig._id);
                      sessionStorage.setItem('pendingApplyGigTitle', authPromptGig.title);
                    } catch (e) {}
                    navigate(`/login?tab=login&from=apply&gigId=${authPromptGig._id}&gigTitle=${encodeURIComponent(authPromptGig.title)}`);
                  }}
                >
                  Already have an account? Sign In
                </button>

                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '0.5rem',
                  }}
                  onClick={() => setAuthPromptGig(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FindGigsPage;
