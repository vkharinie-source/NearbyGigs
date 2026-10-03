import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { userService } from '../../services/userService';
import {
  MapPin,
  Briefcase,
  Sparkles,
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Users,
  CheckCircle2,
  Loader2,
  FileText,
  Award,
  Tag,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();
  const { location, requestBrowserLocation } = useLocationContext();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('worker'); // worker, customer, both
  const [formData, setFormData] = useState({
    bio: '',
    skills: ['Electrical Repairs', 'Appliance Setup'],
    experience: 3,
    address: location.address || 'Bengaluru, Karnataka',
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [locMsg, setLocMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const popularSkills = [
    'Electrical Wiring',
    'Circuit Troubleshooting',
    'Appliance Repairs',
    'Plumbing',
    'Waterproofing',
    'Wall Painting',
    'Carpentry',
    'Deep Cleaning',
    'WiFi & Smart Setup',
  ];

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleNext = () => {
    if (step === 2) {
      if (!accountType) {
        setErrors({ accountType: 'Please select how you want to use NearbyGig.' });
        return;
      }
      setErrors({});
      setStep((prev) => prev + 1);
    } else if (step === 3 && accountType !== 'customer') {
      const newErrors = {};
      if (!formData.bio || !formData.bio.trim()) {
        newErrors.bio = 'Please add a brief bio or description of your services.';
      }
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please add at least one skill or specialty.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setStep((prev) => prev + 1);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleLocationAllow = async () => {
    try {
      setLocMsg('Locating your neighborhood...');
      const loc = await requestBrowserLocation();
      if (loc?.address) {
        setFormData((prev) => ({ ...prev, address: loc.address }));
      }
      setLocMsg('Location synchronized successfully!');
      setTimeout(() => setStep(4), 800);
    } catch (err) {
      setLocMsg('Location permission skipped. You can type your city address manually.');
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (user?._id) {
        const updated = await userService.updateProfile(user._id, {
          role: accountType,
          bio: formData.bio,
          skills: formData.skills,
          experience: Number(formData.experience) || 0,
          address: formData.address,
        });

        if (updated) {
          setUser((prev) => ({ ...prev, ...updated }));
          localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
        }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding finish error:', err);
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const getExperienceLevel = (years) => {
    if (years <= 1) return 'Beginner / Fresh Pro';
    if (years <= 3) return 'Intermediate Specialist';
    if (years <= 6) return 'Experienced Expert';
    return 'Master Craftsman / Senior';
  };

  return (
    <div className="onboarding-page-layout">
      <Navbar />

      <div className="onboarding-container">
        <div className="onboarding-card animate-scale-up">
          {/* Progress Header */}
          <div className="onboarding-progress-bar">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`progress-step-item ${step >= i ? 'active' : ''} ${step === i ? 'current' : ''}`}
              >
                <div className="step-dot">{step > i ? <Check size={14} /> : i}</div>
                <span className="step-name">
                  {i === 1 ? 'Welcome' : i === 2 ? 'Role' : i === 3 ? 'Profile' : 'Location'}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="onboarding-step-content animate-fade-in">
              <div className="step-icon-large">
                <Sparkles size={34} color="#2563eb" />
              </div>
              <h2>Welcome to NearbyGig</h2>
              <p className="step-desc">
                Let&apos;s set up your profile in 3 simple steps so you can start discovering local gigs or connecting with clients nearby.
              </p>

              <div className="onboarding-highlights-box">
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Verified local matching</span>
                </div>
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Real-time notifications</span>
                </div>
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Zero hidden platform fees</span>
                </div>
              </div>

              <div className="step-actions-center">
                <button className="btn-nav-next" onClick={handleNext}>
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE SELECTION */}
          {step === 2 && (
            <div className="onboarding-step-content animate-fade-in">
              <h2>How do you plan to use NearbyGig?</h2>
              <p className="step-desc">Select your primary goal. You can always switch or offer both later.</p>

              {errors.accountType && (
                <div className="auth-alert-error">{errors.accountType}</div>
              )}

              <div className="account-type-cards">
                <div
                  className={`type-card ${accountType === 'worker' ? 'selected' : ''}`}
                  onClick={() => setAccountType('worker')}
                >
                  <div className="type-icon-box">
                    <Briefcase size={26} />
                  </div>
                  <h4>I Want to Work</h4>
                  <p>Offer your skills, apply for local jobs, and earn on flexible terms.</p>
                  <span className="type-badge">Popular for Pros</span>
                </div>

                <div
                  className={`type-card ${accountType === 'customer' ? 'selected' : ''}`}
                  onClick={() => setAccountType('customer')}
                >
                  <div className="type-icon-box">
                    <Users size={26} />
                  </div>
                  <h4>I Want to Hire</h4>
                  <p>Post home or business gigs, book verified nearby specialists, and get work done.</p>
                  <span className="type-badge">For Homeowners</span>
                </div>

                <div
                  className={`type-card ${accountType === 'both' ? 'selected' : ''}`}
                  onClick={() => setAccountType('both')}
                >
                  <div className="type-icon-box">
                    <Sparkles size={26} />
                  </div>
                  <h4>Both Hire & Work</h4>
                  <p>Full access to both post gigs and offer services on the marketplace.</p>
                  <span className="type-badge">All Features</span>
                </div>
              </div>

              <div className="step-nav-footer">
                <button className="btn-nav-prev" onClick={handlePrev}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-nav-next" onClick={handleNext}>
                  Next Step <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROFILE DETAILS */}
          {step === 3 && (
            <div className="onboarding-step-content animate-fade-in">
              <h2>Build Your Professional Profile</h2>
              <p className="step-desc">Help clients understand your capabilities and experience.</p>

              {errors.bio && <div className="auth-alert-error">{errors.bio}</div>}
              {errors.skills && <div className="auth-alert-error">{errors.skills}</div>}

              <div className="form-stack-onboarding">
                {/* BIO */}
                <div className="form-group-onboard">
                  <div className="form-label-row">
                    <label>
                      <FileText size={16} color="#2563eb" />
                      Professional Bio / About You *
                    </label>
                    <span className="label-hint-sub">Visible to nearby clients</span>
                  </div>
                  <textarea
                    rows={3}
                    className="textarea-modern-onboard"
                    placeholder="Describe your expertise, background, and the types of services you provide..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                {accountType !== 'customer' && (
                  <>
                    {/* SKILLS TAGS */}
                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <Tag size={16} color="#2563eb" />
                          Verified Skills & Specialties *
                        </label>
                        <span className="label-hint-sub">Type & hit Enter or click below</span>
                      </div>

                      <div className="skills-interactive-container">
                        <div className="skills-tags-wrap">
                          {formData.skills.map((sk, idx) => (
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
                            placeholder="Add custom skill (e.g. Inverter Wiring)..."
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                        </div>

                        {/* Popular Quick Suggestions */}
                        <div className="popular-skills-suggestions">
                          <span className="suggestions-title">Suggestions:</span>
                          {popularSkills.map((ps, idx) => {
                            const isAdded = formData.skills.includes(ps);
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`suggestion-pill-btn ${isAdded ? 'added' : ''}`}
                                onClick={() => (isAdded ? handleRemoveSkill(ps) : handleAddSkill(ps))}
                              >
                                {isAdded ? <Check size={12} /> : <Plus size={12} />}
                                {ps}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* EXPERIENCE STEPPER */}
                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <Award size={16} color="#2563eb" />
                          Years of Practical Experience
                        </label>
                        <span className="label-hint-sub">Builds client trust</span>
                      </div>

                      <div className="experience-stepper-box">
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              experience: Math.max(0, prev.experience - 1),
                            }))
                          }
                          disabled={formData.experience <= 0}
                        >
                          -
                        </button>

                        <div className="stepper-value-display">
                          <span className="stepper-num">{formData.experience}</span>
                          <span className="stepper-tag">
                            {formData.experience === 1 ? 'Year' : 'Years'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              experience: Math.min(40, prev.experience + 1),
                            }))
                          }
                        >
                          +
                        </button>

                        <span className="experience-level-badge">
                          {getExperienceLevel(formData.experience)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="step-nav-footer">
                <button className="btn-nav-prev" onClick={handlePrev}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-nav-next" onClick={handleNext}>
                  Next Step <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION SETUP */}
          {step === 4 && (
            <div className="onboarding-step-content animate-fade-in">
              <div className="step-icon-large">
                <Compass size={34} color="#2563eb" />
              </div>
              <h2>Neighborhood Location</h2>
              <p className="step-desc">
                NearbyGig uses approximate coordinates to show opportunities and specialists within your radius.
              </p>

              {locMsg && (
                <div className="location-status-pill">
                  <CheckCircle2 size={16} />
                  <span>{locMsg}</span>
                </div>
              )}

              <div className="location-action-box">
                <button className="btn-locate-gps" onClick={handleLocationAllow}>
                  <MapPin size={18} />
                  <span>Use My Browser Location</span>
                </button>

                <div className="location-divider">
                  <span>OR SPECIFY ADDRESS MANUALLY</span>
                </div>

                <div className="form-group-onboard" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.3rem' }}>
                    Primary Area / City Landmark
                  </label>
                  <input
                    type="text"
                    className="input-modern-onboard"
                    placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="step-nav-footer">
                <button className="btn-nav-prev" onClick={handlePrev}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  className="btn-nav-next"
                  onClick={handleFinish}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Finishing Setup...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Complete & Enter Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
