import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { userService } from '../../services/userService';
import { safetyService } from '../../services/safetyService';
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
  Lock,
  GraduationCap,
  Building2,
  Calendar,
  Phone,
  UserCheck,
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthContext();
  const { location, requestBrowserLocation } = useLocationContext();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(user?.role || searchParams.get('role') || 'worker');

  // Form State
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    skills: user?.skills?.length ? user.skills : ['Electrical Repairs', 'Appliance Setup'],
    experience: user?.experience ?? 3,
    address: user?.address || location.address || 'Bengaluru, Karnataka',
    // Worker / Student Safety Fields
    aadhaarNumber: '',
    isStudent: user?.isStudent || false,
    dateOfBirth: '',
    collegeName: user?.college?.name || '',
    guardianName: user?.guardian?.name || '',
    guardianPhone: user?.guardian?.phone || '',
    // Employer Safety Fields
    companyName: user?.companyName || '',
    companyRegistration: user?.companyRegistration || '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [locMsg, setLocMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pending_onboarding');
      if (saved && !user) {
        const parsed = JSON.parse(saved);
        if (parsed.role) setAccountType(parsed.role);
        if (parsed.bio || parsed.skills || parsed.experience || parsed.address) {
          setFormData((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  }, [user]);

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
    'Computer Hardware',
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
      setStep(3);
    } else if (step === 3) {
      // Safety & Verification Step
      const newErrors = {};
      if (accountType === 'worker' || accountType === 'both') {
        if (!formData.aadhaarNumber || formData.aadhaarNumber.replace(/[\s-]/g, '').length !== 12) {
          newErrors.aadhaar = 'Please provide a valid 12-digit Aadhaar number for privacy verification.';
        }
        if (formData.isStudent && !formData.dateOfBirth) {
          newErrors.dob = 'Date of birth is required for student age verification.';
        }
      } else if (accountType === 'customer') {
        if (!formData.companyName) {
          newErrors.companyName = 'Please enter your organization or household name.';
        }
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setStep(4);
    } else if (step === 4 && accountType !== 'customer') {
      const newErrors = {};
      if (!formData.bio || !formData.bio.trim()) {
        newErrors.bio = 'Please add a brief bio or description of your verified skills.';
      }
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please add at least one verified skill.';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      setStep(5);
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
      setLocMsg('Locating your neighborhood coordinates...');
      const loc = await requestBrowserLocation();
      if (loc?.address) {
        setFormData((prev) => ({ ...prev, address: loc.address }));
      }
      setLocMsg('Neighborhood location synchronized successfully!');
    } catch (err) {
      setLocMsg('Location permission skipped. You can type your city address manually.');
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const onboardPayload = {
        role: formData.isStudent && accountType === 'worker' ? 'student_worker' : accountType,
        bio: formData.bio || 'Verified professional ready for local tasks.',
        skills: formData.skills,
        experience: Number(formData.experience) || 0,
        address: formData.address,
        companyName: formData.companyName,
        companyRegistration: formData.companyRegistration,
        isStudent: formData.isStudent,
        dateOfBirth: formData.dateOfBirth || undefined,
      };

      if (user?._id) {
        // 1. Update basic profile
        await userService.updateProfile(user._id, onboardPayload);

        // 2. Process KYC Identity if Aadhaar provided
        if (formData.aadhaarNumber) {
          try {
            await safetyService.submitKycVerification({
              aadhaarNumber: formData.aadhaarNumber,
            });
          } catch (e) {
            console.warn('KYC submit notice:', e);
          }
        }

        // 3. Process Student & Guardian if student
        if (formData.isStudent && formData.dateOfBirth) {
          try {
            await safetyService.submitStudentVerification({
              dateOfBirth: formData.dateOfBirth,
              collegeName: formData.collegeName,
            });
            if (formData.guardianName && formData.guardianPhone) {
              await safetyService.requestGuardianOtp({
                guardianName: formData.guardianName,
                guardianPhone: formData.guardianPhone,
              });
            }
          } catch (e) {
            console.warn('Student verify notice:', e);
          }
        }

        // Refresh user in context
        const fresh = await userService.getUserProfile(user._id);
        if (fresh) {
          setUser(fresh);
          localStorage.setItem('user', JSON.stringify(fresh));
        }
        localStorage.removeItem('pending_onboarding');
        navigate('/safety');
      } else {
        localStorage.setItem('pending_onboarding', JSON.stringify(onboardPayload));
        navigate(`/register?role=${accountType}&from=onboarding`);
      }
    } catch (err) {
      console.error('Onboarding finish error:', err);
      navigate(user ? '/dashboard' : `/register?role=${accountType}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-page-layout">
      <Navbar />

      <div className="onboarding-container">
        <div className="onboarding-card animate-scale-up">
          {/* Progress Header with 5 Steps */}
          <div className="onboarding-progress-bar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`progress-step-item ${step >= i ? 'active' : ''} ${step === i ? 'current' : ''}`}
              >
                <div className="step-dot">{step > i ? <Check size={14} /> : i}</div>
                <span className="step-name">
                  {i === 1
                    ? 'Welcome'
                    : i === 2
                    ? 'Role'
                    : i === 3
                    ? 'Safety & KYC'
                    : i === 4
                    ? 'Skills'
                    : 'Location'}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: WELCOME & SAFETY STANDARD */}
          {step === 1 && (
            <div className="onboarding-step-content animate-fade-in">
              <div className="step-icon-large">
                <ShieldCheck size={36} color="#2563eb" />
              </div>
              <h2>Safety-First Marketplace Onboarding</h2>
              <p className="step-desc">
                NearbyGigs requires identity verification and safety measures BEFORE you start working or hiring to ensure a 100% trusted local network.
              </p>

              <div className="onboarding-highlights-box">
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Masked Aadhaar KYC Privacy</span>
                </div>
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Student & Parent Safety Guard</span>
                </div>
                <div className="highlight-pill">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Verified Employer Badges</span>
                </div>
              </div>

              <div className="step-actions-center">
                <button className="btn-nav-next" onClick={handleNext}>
                  <span>Start Verification Onboarding</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE SELECTION */}
          {step === 2 && (
            <div className="onboarding-step-content animate-fade-in">
              <h2>Select How You Want to Participate</h2>
              <p className="step-desc">
                Choose whether you want to offer your verified skills and earn, or hire verified talent for local tasks.
              </p>

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
                  <p>Complete safety verification, offer your skills, and safely earn from nearby gigs.</p>
                  <span className="type-badge">Workers & Students</span>
                </div>

                <div
                  className={`type-card ${accountType === 'customer' ? 'selected' : ''}`}
                  onClick={() => setAccountType('customer')}
                >
                  <div className="type-icon-box">
                    <Building2 size={26} />
                  </div>
                  <h4>I Want to Hire</h4>
                  <p>Verify your employer identity, post safe gigs, and hire vetted local specialists.</p>
                  <span className="type-badge">Employers & Homes</span>
                </div>

                <div
                  className={`type-card ${accountType === 'both' ? 'selected' : ''}`}
                  onClick={() => setAccountType('both')}
                >
                  <div className="type-icon-box">
                    <Sparkles size={26} />
                  </div>
                  <h4>Both Hire & Work</h4>
                  <p>Full dual access to both offer services and post verified gigs.</p>
                  <span className="type-badge">All Features</span>
                </div>
              </div>

              <div className="step-nav-footer">
                <button className="btn-nav-prev" onClick={handlePrev}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-nav-next" onClick={handleNext}>
                  Continue to Safety Verification <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SAFETY & VERIFICATION (MANDATORY GATE) */}
          {step === 3 && (
            <div className="onboarding-step-content animate-fade-in">
              <h2>🛡 Identity & Safety Verification</h2>
              <p className="step-desc">
                {accountType === 'customer'
                  ? 'Verify your business/household identity to earn the "Verified Employer" badge.'
                  : 'Verify your identity and safety contacts before you can apply to or find local gigs.'}
              </p>

              {errors.aadhaar && <div className="auth-alert-error">{errors.aadhaar}</div>}
              {errors.dob && <div className="auth-alert-error">{errors.dob}</div>}
              {errors.companyName && <div className="auth-alert-error">{errors.companyName}</div>}

              <div className="form-stack-onboarding">
                {/* WORKER SAFETY VERIFICATION */}
                {accountType !== 'customer' ? (
                  <>
                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <UserCheck size={16} color="#2563eb" />
                          12-Digit Aadhaar Identity Verification *
                        </label>
                        <span className="label-hint-sub">Masked as XXXX-XXXX-1234 (Zero Raw Storage)</span>
                      </div>
                      <input
                        type="text"
                        required
                        className="input-modern-onboard"
                        placeholder="e.g. 5432 1098 7654"
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      />
                    </div>

                    <div className="form-group-onboard">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isStudent}
                          onChange={(e) => setFormData({ ...formData, isStudent: e.target.checked })}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>
                          🎓 I am a College Student (Enable Student Safety & Guardian Alerts)
                        </span>
                      </label>
                    </div>

                    {formData.isStudent && (
                      <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group-onboard">
                          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            <Calendar size={14} color="#2563eb" /> Date of Birth (Age Calculated on Server) *
                          </label>
                          <input
                            type="date"
                            className="input-modern-onboard"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          />
                        </div>

                        <div className="form-group-onboard">
                          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            <GraduationCap size={14} color="#2563eb" /> College / Institution Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. RV College of Engineering"
                            className="input-modern-onboard"
                            value={formData.collegeName}
                            onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group-onboard">
                            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              <Users size={14} color="#2563eb" /> Parent / Guardian Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Suresh Verma"
                              className="input-modern-onboard"
                              value={formData.guardianName}
                              onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                            />
                          </div>
                          <div className="form-group-onboard">
                            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              <Phone size={14} color="#2563eb" /> Parent Emergency Mobile
                            </label>
                            <input
                              type="tel"
                              placeholder="+91 9845012345"
                              className="input-modern-onboard"
                              value={formData.guardianPhone}
                              onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* EMPLOYER VERIFICATION */
                  <>
                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <Building2 size={16} color="#2563eb" />
                          Company / Household Name *
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TechCorp Solutions or Priya Home Residence"
                        className="input-modern-onboard"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>

                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <ShieldCheck size={16} color="#2563eb" />
                          Business Registration Number / Tax ID (Optional)
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. CIN-U72200KA2021PTC148890"
                        className="input-modern-onboard"
                        value={formData.companyRegistration}
                        onChange={(e) => setFormData({ ...formData, companyRegistration: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="step-nav-footer">
                <button className="btn-nav-prev" onClick={handlePrev}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-nav-next" onClick={handleNext}>
                  Confirm Safety & Proceed <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VERIFIED SKILLS & EXPERIENCE */}
          {step === 4 && (
            <div className="onboarding-step-content animate-fade-in">
              <h2>Verified Skills & Capabilities</h2>
              <p className="step-desc">
                {accountType === 'customer'
                  ? 'Tell us about the types of services you will frequently hire.'
                  : 'Specify only the trade skills you are competent and equipped to perform safely.'}
              </p>

              {errors.bio && <div className="auth-alert-error">{errors.bio}</div>}
              {errors.skills && <div className="auth-alert-error">{errors.skills}</div>}

              <div className="form-stack-onboarding">
                <div className="form-group-onboard">
                  <div className="form-label-row">
                    <label>
                      <FileText size={16} color="#2563eb" />
                      Professional Bio & Experience *
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    className="textarea-modern-onboard"
                    placeholder="Describe your expertise, safety background, and types of tasks..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                {accountType !== 'customer' && (
                  <>
                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <Tag size={16} color="#2563eb" />
                          Verified Trade Skills *
                        </label>
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
                            placeholder="Type skill & press Enter..."
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

                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <Award size={16} color="#2563eb" />
                          Years of Practical Experience
                        </label>
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
                  Next: Location Privacy <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: LOCATION PRIVACY & FINISH */}
          {step === 5 && (
            <div className="onboarding-step-content animate-fade-in">
              <div className="step-icon-large">
                <Compass size={34} color="#2563eb" />
              </div>
              <h2>Location Privacy & Activation</h2>
              <p className="step-desc">
                NearbyGigs uses bounded coordinates for local matching. Continuous tracking is strictly disabled.
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
                  <span>Use My Location</span>
                </button>

                <div className="location-divider">
                  <span>OR SPECIFY ADDRESS MANUALLY</span>
                </div>

                <div className="form-group-onboard" style={{ width: '100%' }}>
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
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Complete & Enter Safety Hub</span>
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
