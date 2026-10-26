import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import LocationMap from '../../components/map/LocationMap';
import { gigService } from '../../services/gigService';
import { useLocationContext } from '../../context/LocationContext';
import { useAuthContext } from '../../context/AuthContext';
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
  ShieldCheck,
  Award,
  QrCode,
  KeyRound,
  AlertTriangle,
  Tag,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import './Gigs.css';

const CreateGigPage = () => {
  const navigate = useNavigate();
  const { location, requestBrowserLocation } = useLocationContext();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electrical',
    description: '',
    requiredSkills: ['Electrical Repairs'],
    skillInput: '',
    budgetMin: 800,
    budgetMax: 1500,
    salaryType: 'Fixed',
    jobType: 'On-site',
    workDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '2:00 PM',
    duration: '4 Hours',
    recurringSchedule: 'One-time',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    address: location.address || 'Indiranagar, Bengaluru, Karnataka',
    latitude: location.lat || 12.9716,
    longitude: location.lng || 77.5946,
    numberOfWorkers: 1,
    requiredExperience: 1,
    minimumAge: 18,
    isStudentEligible: true,
    safetyInstructions: 'Ensure proper electrical safety equipment. Report identity with attendance check-in.',
    cancellationPolicy: 'Flexible: Cancellation permitted up to 2 hours before start.',
    attendanceMethod: 'otp',
    evidenceRequirements: ['task_checklist', 'deliverable_link'],
    // Category-specific specifications
    tutoringSubject: '',
    tutoringClassLevel: 'Class 9-10 (High School)',
    tutoringQualifications: '',
    tutoringMode: 'In-person at Home',
    tutoringSpecialNotes: '',
    homeServiceToolsNeeded: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const popularSkills = [
    'Electrical Wiring',
    'Circuit Fixes',
    'Plumbing',
    'Appliance Repair',
    'Carpentry',
    'Wall Painting',
    'Deep Cleaning',
    'Computer Support',
    'Tutoring',
    'Python',
  ];

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || formData.skillInput).trim();
    if (trimmed && !formData.requiredSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
        skillInput: '',
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleToggleEvidence = (type) => {
    setFormData((prev) => {
      const exists = prev.evidenceRequirements.includes(type);
      return {
        ...prev,
        evidenceRequirements: exists
          ? prev.evidenceRequirements.filter((e) => e !== type)
          : [...prev.evidenceRequirements, type],
      };
    });
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

  const handleFormSubmit = async (statusToSet = 'open') => {
    if (!formData.title.trim()) {
      setError('Please provide a job title.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a detailed job description.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await gigService.createGig({
        ...formData,
        status: statusToSet,
        date: formData.workDate,
        time: `${formData.startTime} - ${formData.endTime}`,
      });

      navigate('/my-gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish job.');
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
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                }}
              >
                <Sparkles size={13} />
                <span>EMPLOYER JOB PUBLISHING</span>
              </div>
              <h1>Post a Job or Local Gig</h1>
              <p>Publish your job opportunity, specify eligibility criteria, and find vetted candidates.</p>
            </div>
          </div>

          {error && <div className="auth-alert-error">{error}</div>}

          <div className="create-gig-layout-grid">
            {/* Form Fields Stack */}
            <div className="create-form-main-card">
              {/* Basic Info */}
              <div className="form-section-block">
                <h3 className="section-title-sm">1. Job Basics &amp; Category</h3>

                <div className="form-group-modern">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input-modern"
                    placeholder="e.g. Master Bedroom Wall Rewiring & Modular Switchboard Setup"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Category *</label>
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
                      <option value="Technology">Technology &amp; IT</option>
                      <option value="Tutoring">Tutoring &amp; Teaching</option>
                      <option value="Appliance">Appliance Repair</option>
                      <option value="Campus">Campus &amp; Student Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Work Type</label>
                    <select
                      className="form-input-modern"
                      value={formData.jobType}
                      onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    >
                      <option value="On-site">On-site (Physical Location)</option>
                      <option value="Remote">Remote (Online Deliverables)</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {/* Category-Conditional: Home Tutoring Specifics */}
                {formData.category === 'Tutoring' && (
                  <div
                    style={{
                      background: '#f5f3ff',
                      border: '1.5px solid #ddd6fe',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <Award size={18} color="#7c3aed" />
                      <strong style={{ color: '#5b21b6', fontSize: '0.95rem' }}>
                        Home Tutoring &amp; Academic Specifications
                      </strong>
                    </div>

                    <div className="form-grid-two">
                      <div className="form-group-modern">
                        <label>Subject / Topic *</label>
                        <input
                          type="text"
                          className="form-input-modern"
                          placeholder="e.g. Mathematics, Physics, English, Python"
                          value={formData.tutoringSubject}
                          onChange={(e) => setFormData({ ...formData, tutoringSubject: e.target.value })}
                        />
                      </div>

                      <div className="form-group-modern">
                        <label>Student Class / Level *</label>
                        <select
                          className="form-input-modern"
                          value={formData.tutoringClassLevel}
                          onChange={(e) => setFormData({ ...formData, tutoringClassLevel: e.target.value })}
                        >
                          <option value="Primary (Class 1-5)">Primary (Class 1-5)</option>
                          <option value="Middle School (Class 6-8)">Middle School (Class 6-8)</option>
                          <option value="Class 9-10 (High School)">Class 9-10 (High School)</option>
                          <option value="Class 11-12 (Higher Secondary)">Class 11-12 (Higher Secondary / Board Exams)</option>
                          <option value="College / Degree Level">College / Degree Level</option>
                          <option value="Competitive Exam / Olympiad">Competitive Exam / Olympiad</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-two" style={{ marginTop: '0.5rem' }}>
                      <div className="form-group-modern">
                        <label>Required Tutor Qualifications</label>
                        <input
                          type="text"
                          className="form-input-modern"
                          placeholder="e.g. Graduate in Math, B.Tech, or Master's"
                          value={formData.tutoringQualifications}
                          onChange={(e) => setFormData({ ...formData, tutoringQualifications: e.target.value })}
                        />
                      </div>

                      <div className="form-group-modern">
                        <label>Tutoring Format</label>
                        <select
                          className="form-input-modern"
                          value={formData.tutoringMode}
                          onChange={(e) => setFormData({ ...formData, tutoringMode: e.target.value })}
                        >
                          <option value="In-person at Home">In-person at Home</option>
                          <option value="Online 1-on-1 Sessions">Online 1-on-1 Sessions</option>
                          <option value="Hybrid (In-person + Online)">Hybrid (In-person + Online)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category-Conditional: Home Services & Maintenance Tools */}
                {['Electrical', 'Plumbing', 'Cleaning', 'Appliance', 'Painting'].includes(formData.category) && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <ShieldCheck size={18} color="#059669" />
                      <strong style={{ color: '#166534', fontSize: '0.95rem' }}>
                        Home Service Tools &amp; Property Considerations
                      </strong>
                    </div>

                    <div className="form-group-modern">
                      <label>Required Tools &amp; Materials to Bring</label>
                      <input
                        type="text"
                        className="form-input-modern"
                        placeholder="e.g. Bring own ladder, drill machine, wire tester, multi-meter..."
                        value={formData.homeServiceToolsNeeded}
                        onChange={(e) => setFormData({ ...formData, homeServiceToolsNeeded: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group-modern">
                  <label>Detailed Job Description *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-input-modern"
                    placeholder="Describe tasks, responsibilities, tools needed, and expectations..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Skills & Experience */}
              <div className="form-section-block">
                <h3 className="section-title-sm">2. Skills, Qualifications &amp; Experience</h3>

                <div className="form-group-modern">
                  <label>Required Skills *</label>
                  <div className="skills-interactive-container">
                    <div className="skills-tags-wrap">
                      {formData.requiredSkills.map((sk, idx) => (
                        <span key={idx} className="onboard-skill-chip">
                          <Zap size={12} color="#2563eb" />
                          {sk}
                          <button
                            type="button"
                            className="chip-del-btn"
                            onClick={() => handleRemoveSkill(sk)}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        className="skill-tag-input-inline"
                        placeholder="Type skill & press Enter..."
                        value={formData.skillInput}
                        onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                    </div>

                    <div className="popular-skills-suggestions">
                      <span className="suggestions-title">Suggestions:</span>
                      {popularSkills.map((ps, idx) => {
                        const isAdded = formData.requiredSkills.includes(ps);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`suggestion-pill-btn ${isAdded ? 'added' : ''}`}
                            onClick={() => (isAdded ? handleRemoveSkill(ps) : handleAddSkill(ps))}
                          >
                            {isAdded ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                            {ps}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="form-grid-three">
                  <div className="form-group-modern">
                    <label>Required Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      className="form-input-modern"
                      value={formData.requiredExperience}
                      onChange={(e) => setFormData({ ...formData, requiredExperience: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Workers Needed</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="form-input-modern"
                      value={formData.numberOfWorkers}
                      onChange={(e) => setFormData({ ...formData, numberOfWorkers: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Minimum Age Requirement</label>
                    <input
                      type="number"
                      min="14"
                      max="65"
                      className="form-input-modern"
                      value={formData.minimumAge}
                      onChange={(e) => setFormData({ ...formData, minimumAge: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isStudentEligible}
                      onChange={(e) => setFormData({ ...formData, isStudentEligible: e.target.checked })}
                      style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
                      Eligible for College and Student Workers (Compliant with student safety curfews)
                    </span>
                  </label>
                </div>
              </div>

              {/* Pay & Schedule */}
              <div className="form-section-block">
                <h3 className="section-title-sm">3. Compensation &amp; Work Schedule</h3>

                <div className="form-grid-three">
                  <div className="form-group-modern">
                    <label>Budget / Rate Minimum (₹) *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      className="form-input-modern"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Budget / Rate Maximum (₹) *</label>
                    <input
                      type="number"
                      required
                      min={formData.budgetMin}
                      className="form-input-modern"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Payment Structure</label>
                    <select
                      className="form-input-modern"
                      value={formData.salaryType}
                      onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                    >
                      <option value="Fixed">Fixed Amount</option>
                      <option value="Hourly">Hourly Rate</option>
                      <option value="Monthly">Monthly Stipend</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-three">
                  <div className="form-group-modern">
                    <label>Work Date</label>
                    <input
                      type="date"
                      className="form-input-modern"
                      value={formData.workDate}
                      onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Start Time</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      placeholder="e.g. 10:00 AM"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>Expected Duration</label>
                    <input
                      type="text"
                      className="form-input-modern"
                      placeholder="e.g. 3 Hours"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group-modern">
                    <label>Recurring Schedule</label>
                    <select
                      className="form-input-modern"
                      value={formData.recurringSchedule}
                      onChange={(e) => setFormData({ ...formData, recurringSchedule: e.target.value })}
                    >
                      <option value="One-time">One-time Task</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly (Weekends)">Weekly (Weekends)</option>
                      <option value="Flexible">Flexible Schedule</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label>Application Deadline</label>
                    <input
                      type="date"
                      className="form-input-modern"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Commitment, Attendance & Completion Evidence (Section 7A) */}
              <div className="form-section-block">
                <h3 className="section-title-sm">
                  4. Attendance Verification &amp; Completion Evidence Requirements (Section 7A)
                </h3>

                <div className="form-group-modern">
                  <label>Arrival Attendance Verification Method (On-site)</label>
                  <select
                    className="form-input-modern"
                    value={formData.attendanceMethod}
                    onChange={(e) => setFormData({ ...formData, attendanceMethod: e.target.value })}
                  >
                    <option value="otp">Employer-Generated Single-Use 6-Digit OTP</option>
                    <option value="qr_code">Single-Use Job QR Code Verification</option>
                    <option value="manual_confirmation">Manual Worksite Confirmation</option>
                    <option value="none">None (Remote Deliverables Only)</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Select Required Work Completion Proof From Worker:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {[
                      { id: 'task_checklist', label: 'Itemized Task Checklist' },
                      { id: 'deliverable_link', label: 'Deliverable Output Link / File' },
                      { id: 'completion_photos', label: 'Before & After Verification' },
                      { id: 'work_description', label: 'Task Completion Description' },
                    ].map((item) => {
                      const checked = formData.evidenceRequirements.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: checked ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${checked ? '#93c5fd' : '#e2e8f0'}`,
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            color: checked ? '#1e40af' : '#475569',
                            fontWeight: checked ? 600 : 400,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleEvidence(item.id)}
                            style={{ accentColor: '#2563eb' }}
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Safety Instructions &amp; Worksite Guidelines</label>
                  <textarea
                    rows={2}
                    className="form-input-modern"
                    placeholder="e.g. Please carry safety gloves and report to front security gate..."
                    value={formData.safetyInstructions}
                    onChange={(e) => setFormData({ ...formData, safetyInstructions: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Column: Map & Action Buttons */}
            <div className="create-sidebar-column">
              <div className="dash-card location-pin-card">
                <div className="card-section-header">
                  <div className="title-with-icon">
                    <MapPin size={18} color="#2563eb" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Jobsite Location</h4>
                      <p className="card-subtitle">Pinpoint the address for neighborhood workers</p>
                    </div>
                  </div>
                </div>

                <div className="form-group-modern" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder="Neighborhood / Street Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <button
                  type="button"
                  className="btn-locate-current"
                  onClick={handleUseCurrentLocation}
                  style={{ marginBottom: '1rem', width: '100%' }}
                >
                  <Compass size={15} />
                  <span>Sync Current Coordinates</span>
                </button>

                <div className="map-picker-preview" style={{ height: '220px', borderRadius: '12px', overflow: 'hidden' }}>
                  <LocationMap
                    center={[formData.latitude, formData.longitude]}
                    zoom={13}
                    height="220px"
                  />
                </div>
              </div>

              {/* Publishing Actions Card */}
              <div className="dash-card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Publish Listing
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  Review terms before publishing. Once published, qualified workers in your radius will receive notifications.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-save-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleFormSubmit('open')}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Publishing Job...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} />
                        <span>Publish Job Live</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleFormSubmit('draft')}
                    disabled={loading}
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateGigPage;
