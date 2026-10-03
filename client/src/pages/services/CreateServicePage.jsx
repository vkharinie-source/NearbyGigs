import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { workerService } from '../../services/workerService';
import { useLocationContext } from '../../context/LocationContext';
import {
  Briefcase,
  Layers,
  MapPin,
  Clock,
  Award,
  Sparkles,
  Loader2,
  CheckCircle2,
  PlusCircle,
  FileText,
  DollarSign,
  Compass,
} from 'lucide-react';
import '../gigs/Gigs.css';

const CreateServicePage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation } = useLocationContext();

  const [formData, setFormData] = useState({
    title: 'Master Electrician for Domestic Repairs & Wiring',
    category: 'Electrical',
    description:
      'Certified electrician offering same-day diagnostic, fuse box wiring, switchboard upgrades, and appliance installation across the neighborhood.',
    skills: 'Wiring, Fuse Replacement, Circuit Breaker, Appliance Setup',
    experienceYears: 4,
    startingPrice: 500,
    availability: 'available_today',
    serviceAreaKm: 15,
    address: location.address || 'Bengaluru, Karnataka',
    latitude: location.lat || 12.9716,
    longitude: location.lng || 77.5946,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick Service Templates
  const templates = [
    {
      label: '⚡ Electrician Pro',
      title: 'Licensed Electrician for Home Wiring & Repairs',
      category: 'Electrical',
      startingPrice: 500,
      skills: 'Electrical Wiring, Short Circuit Repair, Inverter Setup, MCB Replacement',
      description: 'Expert home electrical servicing, emergency repair, and fixtures with verified tools and safety gear.',
    },
    {
      label: '🔧 Master Plumber',
      title: 'Plumbing & Water Pipe Leak Specialist',
      category: 'Plumbing',
      startingPrice: 450,
      skills: 'Pipe Fitting, Tap Repair, Bathroom Installation, Leak Detection',
      description: 'Quick resolution for high-pressure leakages, clogged pipes, taps, and sanitary fixture replacements.',
    },
    {
      label: '🎨 Interior Painter',
      title: 'Wall Painting & Anti-Dampness Waterproofing',
      category: 'Painting',
      startingPrice: 1200,
      skills: 'Wall Putty, Acrylic Paint, Waterproofing, Accent Walls',
      description: 'Clean, mess-free wall coating, ceiling touch-ups, and waterproof primers with smooth finish.',
    },
    {
      label: '🧹 Home Deep Cleaning',
      title: 'Full House & Kitchen Deep Sanitation',
      category: 'Cleaning',
      startingPrice: 800,
      skills: 'Deep Sanitation, Floor Scrubbing, Window Cleaning, Kitchen Degreasing',
      description: 'Professional hygiene cleaning using eco-friendly solutions and motorized scrubbers.',
    },
  ];

  const applyTemplate = (tpl) => {
    setFormData((prev) => ({
      ...prev,
      title: tpl.title,
      category: tpl.category,
      startingPrice: tpl.startingPrice,
      skills: tpl.skills,
      description: tpl.description,
    }));
  };

  const handleUseCurrentLocation = async () => {
    try {
      const loc = await requestBrowserLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: loc.lat,
        longitude: loc.lng,
        address: loc.address || 'Synchronized Location',
      }));
    } catch (e) {
      alert('Could not retrieve browser geolocation.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const skillsArray = formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await workerService.createService({
        ...formData,
        skills: skillsArray,
      });

      navigate('/find-workers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post service.');
    } finally {
      setLoading(false);
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
                <span>WORKER MARKETPLACE LISTING</span>
              </div>
              <h1>Post Worker Availability Service</h1>
              <p>Publish your service profile so nearby clients and homeowners can discover and book you.</p>
            </div>
          </div>

          {/* Quick Template Fill Bar */}
          <div className="app-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                Quick Templates:
              </span>
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px' }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="auth-alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="create-gig-layout-grid">
            {/* Left Column: Details & Pricing */}
            <div className="create-form-main-col">
              {/* SECTION 1: SERVICE OVERVIEW */}
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">1</div>
                  <div>
                    <h3>Service Overview</h3>
                    <p className="card-subtitle">State your professional title and category</p>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Service Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input-modern"
                    placeholder="e.g. Master Electrician for Home Repairs & Switchboard Fixes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Trade Category *</label>
                    <select
                      className="form-input-modern"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Painting">Painting</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Technology">Technology & IT</option>
                      <option value="Appliance Repair">Appliance Repair</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Availability *</label>
                    <select
                      className="form-input-modern"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    >
                      <option value="available_now">Available Right Now (Emergency)</option>
                      <option value="available_today">Available Today</option>
                      <option value="available_week">Available This Week</option>
                      <option value="weekends_only">Weekends Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Service Description & Offerings *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-input-modern"
                    placeholder="Detail what services you provide, your tools, experience, and warranty/guarantee..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group-modern">
                  <label>Skills & Badges (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder="e.g. Wiring, Fuse Replacement, Appliance Setup, Inverter"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>
              </div>

              {/* SECTION 2: RATES & EXPERIENCE */}
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">2</div>
                  <div>
                    <h3>Pricing & Experience</h3>
                    <p className="card-subtitle">Set your starting rate and practical experience</p>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Starting Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="50"
                      className="form-input-modern"
                      value={formData.startingPrice}
                      onChange={(e) => setFormData({ ...formData, startingPrice: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Years of Practical Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      className="form-input-modern"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Service Coverage Radius (Kilometers)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      step="1"
                      style={{ flex: 1 }}
                      value={formData.serviceAreaKm}
                      onChange={(e) => setFormData({ ...formData, serviceAreaKm: Number(e.target.value) })}
                    />
                    <span style={{ fontWeight: '700', color: '#2563eb', minWidth: '60px' }}>
                      {formData.serviceAreaKm} km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Location Map & Submit */}
            <div className="create-form-side-col">
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">3</div>
                  <div>
                    <h3>Service Base Location</h3>
                    <p className="card-subtitle">Clients within this radius will discover you</p>
                  </div>
                </div>

                <div className="form-group-modern">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0 }}>Base Address / Landmark *</label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="btn-locate-inline"
                    >
                      <Compass size={13} /> Use GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    className="form-input-modern"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <LocationMap center={[formData.latitude, formData.longitude]} height="220px" />
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '1rem' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Publishing Service...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Publish Worker Service Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateServicePage;
