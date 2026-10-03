import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationMap from '../../components/map/LocationMap';
import Navbar from '../../components/navbar/Navbar';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
import { gigService } from '../../services/gigService';
import { workerService } from '../../services/workerService';
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  ShieldCheck,
  Star,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
  Compass,
  PlusCircle,
  Sparkles,
  Award,
  Layers,
  Phone,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation } = useLocationContext();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [nearbyGigs, setNearbyGigs] = useState([]);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);
  const [loadingRealData, setLoadingRealData] = useState(true);

  // Fetch real nearby gigs and workers from MongoDB on mount
  useEffect(() => {
    const loadLivePreviews = async () => {
      try {
        setLoadingRealData(true);
        const [gigsData, workersData] = await Promise.allSettled([
          gigService.getNearbyGigs({ lat: location.lat, lng: location.lng, radius: 25 }),
          workerService.getNearbyWorkers({ lat: location.lat, lng: location.lng, radius: 25 }),
        ]);

        if (gigsData.status === 'fulfilled') {
          setNearbyGigs(gigsData.value?.gigs?.slice(0, 3) || []);
        }
        if (workersData.status === 'fulfilled') {
          setNearbyWorkers(workersData.value?.workers?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('Error fetching landing preview data:', err);
      } finally {
        setLoadingRealData(false);
      }
    };

    loadLivePreviews();
  }, [location.lat, location.lng]);

  const categories = [
    { name: 'Electrical', desc: 'Wiring, switches & appliances', icon: '⚡', gigs: '140+ Gigs' },
    { name: 'Plumbing', desc: 'Pipe fitting, taps & drainage', icon: '🔧', gigs: '95+ Gigs' },
    { name: 'Painting', desc: 'Wall painting & waterproofing', icon: '🎨', gigs: '80+ Gigs' },
    { name: 'Carpentry', desc: 'Furniture repairs & woodwork', icon: '🪚', gigs: '65+ Gigs' },
    { name: 'Cleaning', desc: 'Deep cleaning & sanitization', icon: '✨', gigs: '120+ Gigs' },
    { name: 'Technology', desc: 'WiFi, smart devices & IT fixes', icon: '💻', gigs: '85+ Gigs' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
    navigate(`/find-gigs?${params.toString()}`);
  };

  return (
    <div className="landing-layout">
      <Navbar />

      {/* ==================================================
          1. HERO SECTION
          ================================================== */}
      <section className="landing-hero-section">
        <div className="landing-hero-bg-shapes">
          <div className="hero-shape shape-1" />
          <div className="hero-shape shape-2" />
        </div>

        <div className="landing-hero-container">
          <div className="hero-content-col">
            <div className="hero-badge-pill animate-fade-in">
              <Sparkles size={15} color="#2563eb" />
              <span>Hyperlocal Gig & Service Network</span>
            </div>

            <h1 className="hero-headline">
              Find Local Work. <br />
              Find Trusted Talent. <br />
              <span className="hero-gradient-text">Right Nearby.</span>
            </h1>

            <p className="hero-subtext">
              NearbyGig connects neighbors and verified local professionals within
              kilometers for fast electrical, plumbing, painting, IT support, and home services.
            </p>

            {/* Interactive Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hero-search-box">
              <div className="search-input-group">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="What service or gig do you need? (e.g. Electrical wiring)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="search-category-select">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Painting">Painting</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <button type="submit" className="btn-hero-search">
                <span>Explore Nearby</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Quick CTAs and Stats */}
            <div className="hero-cta-row">
              <Link to="/find-gigs" className="btn-hero-primary">
                <Compass size={18} />
                <span>Find Gigs</span>
              </Link>
              <Link to="/find-workers" className="btn-hero-secondary">
                <Users size={18} />
                <span>Find Workers</span>
              </Link>
              <Link to="/create-gig" className="btn-hero-ghost">
                <PlusCircle size={18} />
                <span>Post a Gig Free</span>
              </Link>
            </div>

            <div className="hero-trust-metrics">
              <div className="trust-metric-item">
                <strong>100%</strong>
                <span>Verified Pros</span>
              </div>
              <div className="metric-divider" />
              <div className="trust-metric-item">
                <strong>&lt; 5 km</strong>
                <span>Average Distance</span>
              </div>
              <div className="metric-divider" />
              <div className="trust-metric-item">
                <strong>4.9 ★</strong>
                <span>Avg Rating</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Column with Live Floating Cards */}
          <div className="hero-visual-col">
            <div className="hero-visual-card">
              <div className="visual-map-container">
                <LocationMap
                  center={[location.lat, location.lng]}
                  zoom={12}
                  gigs={nearbyGigs}
                  workers={nearbyWorkers}
                  height="420px"
                />
              </div>

              {/* Floating Overlay Badge 1 */}
              <div className="floating-card float-top-left animate-slide-down">
                <div className="float-icon-emerald">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <span className="float-title">Arun Kumar (Electrician)</span>
                  <span className="float-sub">Available 1.7 km away • 4.9 ★</span>
                </div>
              </div>

              {/* Floating Overlay Badge 2 */}
              <div className="floating-card float-bottom-right animate-slide-down">
                <div className="float-icon-blue">
                  <Zap size={18} />
                </div>
                <div>
                  <span className="float-title">Short Circuit Fix</span>
                  <span className="float-sub">₹1,500 Budget • 2.3 km away</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. POPULAR CATEGORIES
          ================================================== */}
      <section className="landing-categories-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">POPULAR CATEGORIES</span>
            <h2>Explore High-Demand Local Services</h2>
            <p>Find experienced local workers or post your requirements across essential trades.</p>
          </div>

          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="category-card"
                onClick={() => navigate(`/find-gigs?category=${cat.name}`)}
              >
                <div className="cat-icon-box">{cat.icon}</div>
                <h4 className="cat-title">{cat.name}</h4>
                <p className="cat-desc">{cat.desc}</p>
                <span className="cat-count-badge">
                  {cat.gigs} <ChevronRight size={14} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          3. LIVE NEARBY HIGHLIGHTS (REAL MONGODB DATA)
          ================================================== */}
      <section className="landing-highlights-section">
        <div className="section-container">
          <div className="section-header-split">
            <div>
              <span className="section-eyebrow">LIVE MARKETPLACE</span>
              <h2>Recent Gigs & Top Pros Around You</h2>
              <p>Real opportunities posted by verified neighbors in Bengaluru.</p>
            </div>
            <Link to="/find-gigs" className="btn-view-all">
              <span>View All Gigs</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="highlights-grid-two">
            {/* Nearby Gigs Column */}
            <div className="highlight-column">
              <div className="column-title-row">
                <Briefcase size={20} color="#2563eb" />
                <h3>Active Gigs Nearby</h3>
              </div>

              <div className="cards-stack">
                {nearbyGigs.length > 0 ? (
                  nearbyGigs.map((g) => (
                    <div key={g._id} className="landing-gig-card">
                      <div className="gig-card-header">
                        <span className="badge-category">{g.category}</span>
                        <span className="gig-budget-tag">
                          ₹{g.budgetMin} - ₹{g.budgetMax}
                        </span>
                      </div>
                      <h4 className="gig-item-title">{g.title}</h4>
                      <p className="gig-item-desc">{g.description}</p>
                      <div className="gig-card-footer">
                        <span className="geo-distance">
                          <MapPin size={13} color="#2563eb" />
                          {g.address || 'Bengaluru'}
                        </span>
                        <Link to={`/find-gigs`} className="btn-text-sm">
                          Apply Proposal →
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card-skeleton-box">
                    <p>Loading real nearby gigs from database...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Workers Column */}
            <div className="highlight-column">
              <div className="column-title-row">
                <Users size={20} color="#2563eb" />
                <h3>Verified Pros Ready to Help</h3>
              </div>

              <div className="cards-stack">
                {nearbyWorkers.length > 0 ? (
                  nearbyWorkers.map((w) => (
                    <div key={w._id} className="landing-worker-card">
                      <div className="worker-card-header">
                        <div className="worker-avatar">
                          {w.worker?.name ? w.worker.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                        <div>
                          <h4 className="worker-item-name">{w.worker?.name || 'Local Expert'}</h4>
                          <span className="worker-title-sub">{w.title}</span>
                        </div>
                        <div className="worker-rating-box">
                          <Star size={14} className="star-icon-filled" />
                          <strong>{w.worker?.rating || 4.9}</strong>
                        </div>
                      </div>

                      <p className="worker-item-desc">{w.description}</p>

                      <div className="worker-card-footer">
                        <span className="worker-price-pill">
                          Starts at ₹{w.startingPrice}
                        </span>
                        <Link to="/find-workers" className="btn-primary-sm">
                          Book Pro
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card-skeleton-box">
                    <p>Loading verified workers from database...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. HOW IT WORKS
          ================================================== */}
      <section className="landing-how-section">
        <div className="section-container">
          <div className="section-header-center">
            <span className="section-eyebrow">SIMPLE 3-STEP PROCESS</span>
            <h2>How NearbyGig Works</h2>
            <p>Direct peer-to-peer local matching designed for speed, safety, and transparency.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-box">
                <PlusCircle size={24} color="#2563eb" />
              </div>
              <h4>Post or Discover</h4>
              <p>Post your gig requirement in 60 seconds with location and budget, or browse available workers nearby.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-box">
                <ShieldCheck size={24} color="#2563eb" />
              </div>
              <h4>Connect & Agree</h4>
              <p>Chat directly with verified local workers, inspect reviews, and finalize proposals without intermediaries.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-box">
                <CheckCircle2 size={24} color="#10b981" />
              </div>
              <h4>Get Done & Review</h4>
              <p>Worker completes the job at your doorstep. Release payment and leave verified star ratings to build local trust.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. CTA BANNER & FOOTER
          ================================================== */}
      <section className="landing-cta-banner">
        <div className="section-container cta-banner-inner">
          <div className="cta-banner-text">
            <h2>Ready to hire or earn nearby?</h2>
            <p>Join thousands of residents and skilled workers collaborating in your city today.</p>
          </div>
          <div className="cta-banner-actions">
            <Link to="/onboarding" className="btn-cta-white">
              Create Free Account
            </Link>
            <Link to="/find-gigs" className="btn-cta-outline">
              Explore Live Map
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="landing-footer">
        <div className="section-container footer-inner">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="logo-badge">
                <MapPin size={18} color="#ffffff" />
              </div>
              <span className="logo-text">
                NEARBY<span className="logo-highlight">GIG</span>
              </span>
            </div>
            <p className="footer-tagline">
              Find Work. Find Talent. Right Nearby. <br />
              Hyperlocal gig marketplace for modern cities.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-links-col">
              <h5>Marketplace</h5>
              <Link to="/find-gigs">Find Gigs</Link>
              <Link to="/find-workers">Find Workers</Link>
              <Link to="/create-gig">Post a Gig</Link>
            </div>
            <div className="footer-links-col">
              <h5>Account</h5>
              <Link to="/login">Login</Link>
              <Link to="/onboarding">Get Started</Link>
              <Link to="/profile">My Profile</Link>
            </div>
            <div className="footer-links-col">
              <h5>Categories</h5>
              <Link to="/find-gigs?category=Electrical">Electrical</Link>
              <Link to="/find-gigs?category=Plumbing">Plumbing</Link>
              <Link to="/find-gigs?category=Painting">Painting</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <div className="section-container footer-bottom-inner">
            <span>© 2026 NearbyGig Technologies. All rights reserved.</span>
            <span className="footer-demo-pill">Project Demo Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
