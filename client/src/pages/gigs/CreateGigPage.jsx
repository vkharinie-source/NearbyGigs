import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { useLocationContext } from '../../context/LocationContext';
import {
  PlusCircle,
  MapPin,
  Compass,
  Calendar,
  DollarSign,
  Layers,
  FileText,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import './Gigs.css';

const CreateGigPage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation } = useLocationContext();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electrical',
    description: '',
    requiredSkills: '',
    budgetMin: 800,
    budgetMax: 1500,
    date: 'Today',
    time: '2:00 PM',
    duration: '2 Hours',
    address: location.address || 'Indiranagar, Bengaluru, Karnataka',
    latitude: location.lat || 12.9716,
    longitude: location.lng || 77.5946,
    numberOfWorkers: 1,
    additionalRequirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const skillsArray = formData.requiredSkills
        ? formData.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await gigService.createGig({
        ...formData,
        requiredSkills: skillsArray,
      });

      navigate('/my-gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post gig.');
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
              <h1>Post a New Local Gig</h1>
              <p>Publish your task to verified nearby specialists within minutes.</p>
            </div>
          </div>

          {error && <div className="auth-alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="create-gig-layout-grid">
            {/* Left Main Form Column */}
            <div className="create-form-main-col">
              {/* SECTION 1: GIG DETAILS */}
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">1</div>
                  <div>
                    <h3>Task Overview</h3>
                    <p className="card-subtitle">Give your gig a clear title and category</p>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Gig Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input-modern"
                    placeholder="e.g. Master Electrician needed for fuse repair & wiring"
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
                    <label>Number of Workers Needed</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-input-modern"
                      value={formData.numberOfWorkers}
                      onChange={(e) => setFormData({ ...formData, numberOfWorkers: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Task Description *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-input-modern"
                    placeholder="Explain the problem, required tools, and any specific safety considerations..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group-modern">
                  <label>Required Skills / Tools (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder="e.g. Electrical Wiring, Circuit Breaker Testing, Safety Gloves"
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  />
                </div>
              </div>

              {/* SECTION 2: SCHEDULE & BUDGET */}
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">2</div>
                  <div>
                    <h3>Schedule & Budget</h3>
                    <p className="card-subtitle">Set your timeline and price expectations</p>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Minimum Budget (₹) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      className="form-input-modern"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Maximum Budget (₹) *</label>
                    <input
                      type="number"
                      required
                      min="100"
                      className="form-input-modern"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Execution Date</label>
                    <select
                      className="form-input-modern"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    >
                      <option value="Today">Today (Urgent)</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="This Weekend">This Weekend</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Estimated Duration</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      placeholder="e.g. 2-3 Hours"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Location & Publish Column */}
            <div className="create-form-side-col">
              <div className="app-card form-section-card">
                <div className="form-section-head">
                  <div className="section-num-badge">3</div>
                  <div>
                    <h3>Location & Pin</h3>
                    <p className="card-subtitle">Where should the worker arrive?</p>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Service Address / Landmark *</label>
                  <input
                    type="text"
                    required
                    className="form-input-modern"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={handleUseCurrentLocation}
                >
                  <MapPin size={16} /> Use Current GPS Location
                </button>

                <div className="form-map-preview">
                  <LocationMap
                    center={[formData.latitude, formData.longitude]}
                    zoom={13}
                    height="200px"
                  />
                </div>
              </div>

              {/* Publish Action Card */}
              <div className="app-card publish-summary-card">
                <h4>Ready to find talent?</h4>
                <p>Your gig will be immediately broadcast to qualified local workers in your area.</p>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.85rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Broadcasting Gig...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span>Post Gig Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateGigPage;
