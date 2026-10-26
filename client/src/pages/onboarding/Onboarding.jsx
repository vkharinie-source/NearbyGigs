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
  Clock,
  School,
  ExternalLink,
  ShieldAlert,
  Store,
  Home,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthContext();
  const { location, requestBrowserLocation } = useLocationContext();

  const purposeParam = searchParams.get('purpose') || user?.purpose || 'find_work';
  const roleParam = searchParams.get('role');
  const applyGigId = searchParams.get('applyGigId') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingApplyGigId') : null);

  // Step 1: Specific Setup | Step 2: Safety & Location | Step 3: Activation & Launch
  const [step, setStep] = useState(1);

  // Validation helper utilities
  const isValidUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    try {
      const parsed = new URL(trimmed);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch (_) {
      return false;
    }
  };

  const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
  };

  // Profile Category Type: 'school_student' | 'college_student' | 'professional' | 'employer'
  const [profileType, setProfileType] = useState(() => {
    if (purposeParam === 'post_jobs') return 'employer';
    if (purposeParam === 'offer_services') return 'professional';
    if (user?.userType && user.userType !== 'customer' && user.userType !== 'employer') return user.userType;
    return 'college_student';
  });

  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState('1RV21CS089_College_ID.pdf');
  const [docFileSize, setDocFileSize] = useState('420 KB');
  const [docUploaded, setDocUploaded] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Clean Form State with criteria pre-filled matching demo student/specialist verification
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    skills: Array.isArray(user?.skills) && user.skills.length ? [...user.skills] : ['Campus Tech Support', 'Tutoring'],
    experience: user?.experience !== undefined && user?.experience !== null && user.experience > 0 ? String(user.experience) : '1',
    address: user?.address || 'Indiranagar, Bengaluru',
    expectedRate: user?.expectedRate && user.expectedRate > 0 ? String(user.expectedRate) : '450',
    rateType: user?.rateType || 'Hourly',
    workArea: user?.workArea || 'Bengaluru Urban',
    portfolioInput: '',
    portfolioLinks: Array.isArray(user?.portfolioLinks) ? [...user.portfolioLinks] : [],
    certificationsInput: '',
    certifications: Array.isArray(user?.certifications) ? [...user.certifications] : [],

    // School Student Specific
    schoolName: user?.school?.name || 'National Public School',
    schoolGrade: user?.school?.grade || 'Class 11',
    daytimeAvailability: user?.school?.daytimeAvailability || 'After School (3 PM - 7 PM)',
    parentConsentVerified: user?.school?.parentConsentVerified || true,

    // College Student Specific
    collegeName: user?.college?.name || 'RV College of Engineering',
    course: user?.college?.course || 'B.E. Computer Science, 1st Year',
    year: user?.college?.year || '1',
    rollNumber: user?.college?.rollNumber || '1RV21CS089',

    // Guardian Details (for minors and student alerts)
    guardianName: user?.guardian?.name || 'Parent Guardian',
    guardianPhone: user?.guardian?.phone || '+91 9845012345',
    guardianRelation: user?.guardian?.relationship || 'Parent',

    // Employer Specific (Tailored for Post a Job)
    companyName: user?.companyName || '',
    employerType: user?.employerType || 'Small Business / Shop',
    businessCategory: user?.businessCategory || 'Retail & Facilities',
    companyRegistration: user?.companyRegistration || '',
    contactPerson: user?.contactPerson || user?.name || '',
    contactPhone: user?.contactPhone || user?.phone || '',
    hiringFrequency: user?.hiringFrequency || 'Frequent Gigs & Tasks',

    // KYC Masked Aadhaar
    aadhaarNumber: 'XXXX-XXXX-9012',
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [locMsg, setLocMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingDoc(true);
      setTimeout(() => {
        setDocFile(file);
        setDocFileName(file.name);
        setDocFileSize(`${Math.round(file.size / 1024)} KB`);
        setDocUploaded(true);
        setUploadingDoc(false);
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.document;
          return copy;
        });
      }, 300);
    }
  };

  const handleUseSampleDoc = () => {
    setUploadingDoc(true);
    setTimeout(() => {
      if (profileType === 'school_student') {
        setDocFileName('Parent_Consent_Letter_Signed.pdf');
        setDocFileSize('320 KB');
      } else if (profileType === 'professional') {
        setDocFileName('Certified_Electrician_Aadhaar.pdf');
        setDocFileSize('510 KB');
      } else {
        setDocFileName('College_Student_ID_1RV21CS089.pdf');
        setDocFileSize('420 KB');
      }
      setDocUploaded(true);
      setUploadingDoc(false);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.document;
        return copy;
      });
    }, 200);
  };

  const popularSkills = [
    'Electrical Wiring',
    'Circuit Fixes',
    'Appliance Repair',
    'Plumbing',
    'Carpentry',
    'Wall Painting',
    'Deep Cleaning',
    'Tutoring (Math/Science)',
    'Computer Hardware',
    'Web Development',
  ];

  // Dynamic step titles based on user purpose
  const getStepTitles = () => {
    if (purposeParam === 'post_jobs') {
      return ['Business & Verification', 'Location & Safety', 'Employer Launch'];
    }
    if (purposeParam === 'offer_services') {
      return ['Trade Skills', 'Rates & Portfolio', 'Service Radar'];
    }
    if (purposeParam === 'find_work') {
      return ['Worker Category', 'Safety & Credentials', 'Marketplace Radar'];
    }
    return ['Profile Category', 'Details & Safety', 'Location & Activation'];
  };

  const stepTitles = getStepTitles();

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
      setSkillInput('');
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.skills;
        return copy;
      });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddPortfolio = () => {
    const trimmed = formData.portfolioInput.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, portfolio: 'Please type or paste a portfolio URL before clicking Add.' }));
      return;
    }
    if (!isValidUrl(trimmed)) {
      setErrors((prev) => ({
        ...prev,
        portfolio: 'Please enter a valid URL starting with https:// or http:// (e.g. https://github.com/myname or https://myportfolio.com)',
      }));
      return;
    }
    if (formData.portfolioLinks.includes(trimmed)) {
      setErrors((prev) => ({ ...prev, portfolio: 'This URL has already been added to your portfolio.' }));
      return;
    }
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.portfolio;
      return copy;
    });
    setFormData((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, trimmed],
      portfolioInput: '',
    }));
  };

  const handleInsertDemoUrl = () => {
    setFormData((prev) => ({
      ...prev,
      portfolioInput: 'https://github.com/developer-demo/portfolio',
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.portfolio;
      return copy;
    });
  };

  // Step-by-Step Validation Logic - Strictly prevents skipping required fields
  const validateStep = (currentStep) => {
    const newErrors = {};

    // 1. Post a Job (Employer) validation flow
    if (purposeParam === 'post_jobs') {
      if (currentStep === 1) {
        if (!formData.companyName || !formData.companyName.trim() || formData.companyName.trim().length < 3) {
          newErrors.companyName = 'Business, shop, or household name is required (at least 3 characters).';
        }
        if (!formData.contactPerson || !formData.contactPerson.trim() || formData.contactPerson.trim().length < 2) {
          newErrors.contactPerson = 'Contact person or manager name is required (at least 2 characters).';
        }
        if (!formData.contactPhone || !isValidPhone(formData.contactPhone)) {
          newErrors.contactPhone = 'Please provide a valid 10-digit mobile number (e.g. 9876543210).';
        }
        if (formData.companyRegistration && formData.companyRegistration.trim().length < 4) {
          newErrors.companyRegistration = 'Registration / GSTIN number must be at least 4 characters if provided.';
        }
      } else if (currentStep === 2) {
        if (!formData.address || !formData.address.trim() || formData.address.trim().length < 6) {
          newErrors.address = 'Workplace or job address is required (at least 6 characters). Please detect or type an address.';
        }
      }
    }

    // 2. Offer Professional Services validation flow
    else if (purposeParam === 'offer_services') {
      if (currentStep === 1) {
        if (!formData.skills || formData.skills.length === 0) {
          newErrors.skills = 'Please add at least one trade skill or capability before proceeding.';
        }
        if (formData.experience === '' || isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
          newErrors.experience = 'Please specify your years of practical experience (0 or more).';
        }
      } else if (currentStep === 2) {
        if (!formData.expectedRate || isNaN(Number(formData.expectedRate)) || Number(formData.expectedRate) <= 0) {
          newErrors.expectedRate = 'Please enter your expected service rate in ₹ (greater than 0).';
        }
        if (!formData.address || !formData.address.trim() || formData.address.trim().length < 6) {
          newErrors.address = 'Please specify your service area or base address (at least 6 characters).';
        }
        if (formData.portfolioInput.trim() && !isValidUrl(formData.portfolioInput.trim())) {
          newErrors.portfolio = 'The entered portfolio URL is invalid. Please format as https://... or clear the field.';
        }
      }
    }

    // 3. Dual Access (both: Hire & Find Work) validation flow
    else if (purposeParam === 'both') {
      if (currentStep === 1) {
        if (!formData.skills || formData.skills.length === 0) {
          newErrors.skills = 'Please add or select at least one trade skill.';
        }
        if (formData.experience === '' || isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
          newErrors.experience = 'Please enter your years of experience (0 or more).';
        }
        if (!formData.expectedRate || isNaN(Number(formData.expectedRate)) || Number(formData.expectedRate) <= 0) {
          newErrors.expectedRate = 'Please enter your standard hourly or gig rate in ₹ (greater than 0).';
        }
      } else if (currentStep === 2) {
        if (formData.portfolioInput.trim() && !isValidUrl(formData.portfolioInput.trim())) {
          newErrors.portfolio = 'The entered portfolio URL is invalid. Please format as https://... or clear the field.';
        }
        if (formData.aadhaarNumber && formData.aadhaarNumber.trim()) {
          const cleaned = formData.aadhaarNumber.replace(/[\s-]/g, '');
          if (!/^\d{12}$/.test(cleaned)) {
            newErrors.aadhaar = 'Aadhaar number must contain exactly 12 numeric digits.';
          }
        }
      } else if (currentStep === 3) {
        if (!formData.address || !formData.address.trim() || formData.address.trim().length < 6) {
          newErrors.address = 'Please confirm or detect your primary neighborhood address (at least 6 characters).';
        }
      }
    }

    // 4. Find Work (Worker) validation flow
    else {
      if (currentStep === 1) {
        if (!profileType) {
          newErrors.profileType = 'Please select your worker profile category (College Student, School Student, or Professional Specialist) to proceed.';
        }

        if (profileType === 'school_student') {
          if (!formData.schoolName || !formData.schoolName.trim() || formData.schoolName.trim().length < 3) {
            newErrors.schoolName = 'School name is required (minimum 3 characters).';
          }
          if (!formData.guardianPhone || !isValidPhone(formData.guardianPhone)) {
            newErrors.guardianPhone = 'Please provide a valid 10-digit mobile number for parent/guardian safety radar.';
          }
        } else if (profileType === 'college_student') {
          if (!formData.collegeName || !formData.collegeName.trim() || formData.collegeName.trim().length < 3) {
            newErrors.collegeName = 'College / University name is required (minimum 3 characters).';
          }
          if (!formData.course || !formData.course.trim() || formData.course.trim().length < 2) {
            newErrors.course = 'Degree or course major is required (minimum 2 characters).';
          }
          if (!formData.guardianPhone || !isValidPhone(formData.guardianPhone)) {
            newErrors.guardianPhone = 'Please provide a valid 10-digit mobile number for parent/guardian safety radar.';
          }
        } else if (profileType === 'professional') {
          if (formData.experience === '' || isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
            newErrors.experience = 'Please enter your years of practical experience (0 or more).';
          }
          if (!formData.expectedRate || isNaN(Number(formData.expectedRate)) || Number(formData.expectedRate) <= 0) {
            newErrors.expectedRate = 'Please enter your expected hourly or gig rate in ₹ (greater than 0).';
          }
        }

        if (!docUploaded) {
          newErrors.document = 'Please attach your verification document or click "Use Sample Document" to proceed.';
        }
      } else if (currentStep === 2) {
        // Every worker must add at least 1 skill
        if (!formData.skills || formData.skills.length === 0) {
          newErrors.skills = 'Please add or select at least one skill or capability.';
        }
      } else if (currentStep === 3) {
        if (!formData.address || !formData.address.trim() || formData.address.trim().length < 4) {
          newErrors.address = 'Please confirm or detect your neighborhood location.';
        }
      }
    }

    return newErrors;
  };

  const handleNext = () => {
    setErrors({});
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setErrors({});
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleLocationAllow = async () => {
    try {
      setLocMsg('Locating your neighborhood coordinates...');
      const loc = await requestBrowserLocation();
      if (loc?.address) {
        setFormData((prev) => ({ ...prev, address: loc.address }));
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.address;
          return copy;
        });
      }
      setLocMsg('Neighborhood location synchronized!');
    } catch (err) {
      setLocMsg('Location permission skipped. You can enter your neighborhood manually.');
    }
  };

  const handleFinish = async (destination = 'dashboard') => {
    setErrors({});

    // Validate required steps for this flow to guarantee genuine verified profiles
    let allErrors = {};
    if (purposeParam === 'post_jobs') {
      allErrors = { ...validateStep(1), ...validateStep(2) };
    } else if (purposeParam === 'offer_services') {
      allErrors = { ...validateStep(1), ...validateStep(2) };
    } else if (purposeParam === 'both') {
      allErrors = { ...validateStep(1), ...validateStep(2), ...validateStep(3) };
    } else {
      allErrors = { ...validateStep(1) };
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      const isStudent = profileType === 'school_student' || profileType === 'college_student';
      let assignedRole = 'worker';
      if (purposeParam === 'post_jobs' || profileType === 'employer') assignedRole = 'employer';
      else if (isStudent) assignedRole = 'student_worker';
      else if (purposeParam === 'both') assignedRole = 'both';

      const payload = {
        role: assignedRole,
        userType: purposeParam === 'post_jobs' ? 'employer' : profileType,
        purpose: purposeParam,
        onboardingCompleted: true,
        bio:
          formData.bio ||
          (purposeParam === 'post_jobs'
            ? `${formData.companyName} on NearbyGigs (${formData.businessCategory}).`
            : `${(profileType || 'worker').replace('_', ' ').toUpperCase()} on NearbyGigs.`),
        skills: formData.skills,
        experience: Number(formData.experience) || 0,
        address: formData.address,
        expectedRate: Number(formData.expectedRate) || 0,
        rateType: formData.rateType,
        workArea: formData.workArea,
        portfolioLinks: formData.portfolioLinks,
        certifications: formData.certifications,
        companyName: formData.companyName,
        businessCategory: formData.businessCategory,
        companyRegistration: formData.companyRegistration,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        isStudent,
        school: {
          name: formData.schoolName,
          grade: formData.schoolGrade,
          daytimeAvailability: formData.daytimeAvailability,
          parentConsentVerified: Boolean(formData.guardianName && formData.guardianPhone),
        },
        college: {
          name: formData.collegeName,
          course: formData.course,
          year: Number(formData.year) || 1,
          rollNumber: formData.rollNumber,
        },
      };

      if (user?._id) {
        // Update user profile in MongoDB
        await userService.updateProfile(user._id, payload);

        // Submit KYC if Aadhaar was entered
        if (formData.aadhaarNumber && formData.aadhaarNumber.replace(/[\s-]/g, '').length === 12) {
          try {
            await safetyService.submitKycVerification({ aadhaarNumber: formData.aadhaarNumber });
          } catch (e) {
            console.warn('KYC error:', e);
          }
        }

        // Student verification request if student
        if (isStudent && formData.collegeName) {
          try {
            await safetyService.submitStudentVerification({
              dateOfBirth: user.dateOfBirth || '2004-01-01',
              collegeName: formData.collegeName,
              course: formData.course,
              year: formData.year,
            });
          } catch (e) {
            console.warn('Student verification error:', e);
          }
        }

        // Parent Guardian OTP if provided
        if (formData.guardianName && formData.guardianPhone) {
          try {
            await safetyService.requestGuardianOtp({
              guardianName: formData.guardianName,
              guardianPhone: formData.guardianPhone,
              relationship: formData.guardianRelation,
            });
          } catch (e) {
            console.warn('Guardian OTP notice:', e);
          }
        }

        const freshUser = await userService.getUserProfile(user._id);
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }

        // If user came to apply for a gig, bring them directly to it!
        if (applyGigId) {
          try {
            sessionStorage.removeItem('pendingApplyGigId');
            sessionStorage.removeItem('pendingApplyGigTitle');
          } catch (e) {}
          navigate(`/find-gigs?applyGigId=${applyGigId}`);
        } else if (destination === 'create_gig' || purposeParam === 'post_jobs' || profileType === 'employer') {
          navigate(destination === 'create_gig' ? '/create-gig' : '/dashboard?mode=employer');
        } else {
          navigate('/dashboard?mode=worker');
        }
      } else {
        if (applyGigId) {
          navigate(`/find-gigs?applyGigId=${applyGigId}`);
        } else {
          navigate(destination === 'create_gig' ? '/create-gig' : (purposeParam === 'post_jobs' || profileType === 'employer') ? '/dashboard?mode=employer' : '/dashboard?mode=worker');
        }
      }
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Failed to complete profile. Please verify all details and try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-page-layout">
      <Navbar />

      <main
        className="onboarding-container"
        style={{
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          padding: '2.5rem 1.5rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          className="onboarding-card animate-scale-up"
          style={{
            maxWidth: '960px',
            width: '100%',
            margin: '0 auto',
            padding: '2.5rem',
          }}
        >
          {/* Progress Header */}
          <div className="onboarding-progress-bar" style={{ marginBottom: '2.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`progress-step-item ${step >= i ? 'active' : ''} ${step === i ? 'current' : ''}`}
              >
                <div className="step-dot">{step > i ? <Check size={14} /> : i}</div>
                <span className="step-name">{stepTitles[i - 1]}</span>
              </div>
            ))}
          </div>

          {/* =================================================================
              FLOW 1: POST A JOB (EMPLOYER SPECIFIC WIZARD)
              ================================================================= */}
          {purposeParam === 'post_jobs' && (
            <>
              {/* STEP 1: EMPLOYER DETAILS & AUTHENTICITY */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                      className="step-icon-large"
                      style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}
                    >
                      <Building2 size={34} color="#059669" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      🏢 Employer &amp; Business Verification
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      Set up your verified employer profile to post genuine gigs, review candidate
                      portfolios, and prevent fake listings.
                    </p>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="auth-alert-error">
                      <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                      <span>Please correct the highlighted fields below to continue.</span>
                    </div>
                  )}

                  <div className="form-stack-onboarding">
                    <div className="form-grid-two">
                      <div className="form-group-onboard">
                        <label>Business / Shop / Household Name *</label>
                        <input
                          type="text"
                          className={`input-modern-onboard ${errors.companyName ? 'has-error' : ''}`}
                          placeholder="e.g. Apex Electronics, Indiranagar"
                          value={formData.companyName}
                          onChange={(e) => {
                            setFormData({ ...formData, companyName: e.target.value });
                            if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: null }));
                          }}
                        />
                        {errors.companyName && <span className="field-error-text">{errors.companyName}</span>}
                      </div>

                      <div className="form-group-onboard">
                        <label>Employer Type</label>
                        <select
                          className="input-modern-onboard"
                          value={formData.employerType}
                          onChange={(e) =>
                            setFormData({ ...formData, employerType: e.target.value })
                          }
                        >
                          <option value="Small Business / Shop">Small Business / Shop</option>
                          <option value="Enterprise / Office">Enterprise / Office</option>
                          <option value="Household / Individual">Household / Individual</option>
                          <option value="Event / Catering Organizer">
                            Event / Catering Organizer
                          </option>
                          <option value="Contractor / Facility Manager">
                            Contractor / Facility Manager
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-two">
                      <div className="form-group-onboard">
                        <label>Primary Hiring Category</label>
                        <select
                          className="input-modern-onboard"
                          value={formData.businessCategory}
                          onChange={(e) =>
                            setFormData({ ...formData, businessCategory: e.target.value })
                          }
                        >
                          <option value="Retail & Facilities">Retail &amp; Facilities</option>
                          <option value="Residential Maintenance">
                            Residential Maintenance
                          </option>
                          <option value="Technology & IT">Technology &amp; IT</option>
                          <option value="Hospitality & Events">Hospitality &amp; Events</option>
                          <option value="Home Repairs">Home Repairs</option>
                          <option value="Delivery & Logistics">Delivery &amp; Logistics</option>
                        </select>
                      </div>

                      <div className="form-group-onboard">
                        <label>Hiring Need Frequency</label>
                        <select
                          className="input-modern-onboard"
                          value={formData.hiringFrequency}
                          onChange={(e) =>
                            setFormData({ ...formData, hiringFrequency: e.target.value })
                          }
                        >
                          <option value="Frequent Gigs & Tasks">
                            Frequent Gigs &amp; Quick Tasks
                          </option>
                          <option value="Occasional One-Time Repairs">
                            Occasional One-Time Repairs
                          </option>
                          <option value="Part-Time Regular Staff">
                            Part-Time Regular Staff
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-two">
                      <div className="form-group-onboard">
                        <label>Contact Person / Manager Name *</label>
                        <input
                          type="text"
                          className={`input-modern-onboard ${errors.contactPerson ? 'has-error' : ''}`}
                          placeholder="e.g. Anand Sharma"
                          value={formData.contactPerson}
                          onChange={(e) => {
                            setFormData({ ...formData, contactPerson: e.target.value });
                            if (errors.contactPerson) setErrors((prev) => ({ ...prev, contactPerson: null }));
                          }}
                        />
                        {errors.contactPerson && <span className="field-error-text">{errors.contactPerson}</span>}
                      </div>

                      <div className="form-group-onboard">
                        <label>Official Mobile Number *</label>
                        <input
                          type="tel"
                          className={`input-modern-onboard ${errors.contactPhone ? 'has-error' : ''}`}
                          placeholder="e.g. 9845012345"
                          value={formData.contactPhone}
                          onChange={(e) => {
                            setFormData({ ...formData, contactPhone: e.target.value });
                            if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: null }));
                          }}
                        />
                        {errors.contactPhone && <span className="field-error-text">{errors.contactPhone}</span>}
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <ShieldCheck size={18} />
                        <span>Employer Authenticity Verification (Optional)</span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: '#64748b',
                          margin: '0 0 0.75rem 0',
                          lineHeight: '1.4',
                        }}
                      >
                        Provide your GSTIN, Shop &amp; Establishment License, or National ID.
                        Unlocks the <strong>Verified Genuine Employer</strong> badge on your job
                        listings so workers know your jobs are legitimate.
                      </p>
                      <input
                        type="text"
                        className={`input-modern-onboard ${errors.companyRegistration ? 'has-error' : ''}`}
                        placeholder="e.g. GSTIN29ABCDE1234F1Z5 or Shop License Number"
                        value={formData.companyRegistration}
                        onChange={(e) => {
                          setFormData({ ...formData, companyRegistration: e.target.value });
                          if (errors.companyRegistration) setErrors((prev) => ({ ...prev, companyRegistration: null }));
                        }}
                      />
                      {errors.companyRegistration && <span className="field-error-text">{errors.companyRegistration}</span>}
                    </div>
                  </div>

                  <div className="step-nav-footer">
                    <button
                      type="button"
                      className="btn-nav-prev"
                      onClick={() => navigate('/choose-purpose')}
                    >
                      <ArrowLeft size={16} /> Choose Purpose
                    </button>
                    <button type="button" className="btn-nav-next" onClick={handleNext}>
                      <span>Next: Location &amp; Safety</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: JOB LOCATION & ATTENDANCE SECURITY */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="step-icon-large">
                      <MapPin size={34} color="#2563eb" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      📍 Job Workplace Location &amp; Safety
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      Set your work address for proximity matching. Nearby workers within your
                      neighborhood radar will see your postings.
                    </p>
                  </div>

                  {errors.address && (
                    <div className="auth-alert-error">{errors.address}</div>
                  )}

                  {locMsg && (
                    <div className="location-status-pill" style={{ marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{locMsg}</span>
                    </div>
                  )}

                  <div className="location-action-box">
                    <button
                      type="button"
                      className="btn-locate-gps"
                      onClick={handleLocationAllow}
                    >
                      <MapPin size={18} />
                      <span>Detect Workplace Location</span>
                    </button>

                    <div className="location-divider">
                      <span>OR CONFIRM WORKPLACE ADDRESS</span>
                    </div>

                    <div className="form-group-onboard" style={{ width: '100%' }}>
                      <input
                        type="text"
                        className={`input-modern-onboard ${errors.address ? 'has-error' : ''}`}
                        placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru, Karnataka"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value });
                          if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                        }}
                      />
                      {errors.address && <span className="field-error-text">{errors.address}</span>}
                    </div>
                  </div>

                  {/* Safety Guarantee Highlights */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        background: '#eff6ff',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #dbeafe',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <ShieldCheck size={16} /> Arrival OTP Check-in
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#3b82f6' }}>
                        Workers verify attendance on-site with single-use OTPs to prevent fake
                        check-ins.
                      </p>
                    </div>

                    <div
                      style={{
                        background: '#ecfdf5',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <CheckCircle size={16} /> Escrow Protected Pay
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#059669' }}>
                        Payouts are held securely and only released when the gig is marked completed
                        to your satisfaction.
                      </p>
                    </div>
                  </div>

                  <div className="step-nav-footer" style={{ marginTop: '2rem' }}>
                    <button type="button" className="btn-nav-prev" onClick={handlePrev}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="button" className="btn-nav-next" onClick={handleNext}>
                      <span>Next: Launch Employer Hub</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: READY TO POST JOBS */}
              {step === 3 && (
                <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                  <div
                    className="step-icon-large"
                    style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}
                  >
                    <Sparkles size={36} color="#059669" />
                  </div>
                  <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a' }}>
                    🎉 Your Employer Profile is Ready!
                  </h2>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '0.98rem',
                      maxWidth: '540px',
                      margin: '0 auto 2rem auto',
                    }}
                  >
                    <strong>{formData.companyName}</strong> is now registered. You can post a gig
                    right away to receive verified worker pitches or manage your account from the
                    dashboard.
                  </p>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      maxWidth: '520px',
                      margin: '0 auto 2.5rem auto',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Organization</span>
                      <strong style={{ color: '#0f172a' }}>{formData.companyName}</strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Category</span>
                      <strong style={{ color: '#0f172a' }}>{formData.businessCategory}</strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Work Location</span>
                      <strong style={{ color: '#0f172a' }}>
                        {formData.address || 'Bengaluru'}
                      </strong>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Status</span>
                      <span
                        style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Verified Employer
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      maxWidth: '440px',
                      margin: '0 auto',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-save-primary"
                      onClick={() => handleFinish('create_gig')}
                      disabled={saving}
                      style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      {saving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Plus size={18} />
                          <span>Post Your First Job Now</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleFinish('dashboard')}
                      disabled={saving}
                      style={{
                        padding: '0.85rem',
                        fontSize: '0.95rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                      }}
                    >
                      Go to Employer Dashboard
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================================================================
              FLOW 2: FIND WORK / WORKER PROFILE SETUP
              ================================================================= */}
          {purposeParam === 'find_work' && (
            <>
              {/* STEP 1: APPLICANT CATEGORY & CRITERIA SHOWCASE (MATCHING USER SCREENSHOT) */}
              {step === 1 && (
                <div className="animate-fade-in">
                  <div className="category-criteria-showcase-card">
                    {/* Header */}
                    <div className="criteria-header-wrap">
                      <div className="criteria-title-row">
                        <GraduationCap size={22} color="#60a5fa" />
                        <h3 className="criteria-main-title">
                          STEP 1: SELECT YOUR APPLICANT CATEGORY &amp; CRITERIA
                        </h3>
                        <span className="required-before-badge">
                          Required Before Applying
                        </span>
                      </div>
                      <p className="criteria-subtitle">
                        Please select your exact status. Verified criteria, documentation, and safety safeguards apply specifically to each category:
                      </p>
                    </div>

                    {errors.profileType && (
                      <div className="auth-alert-error" style={{ marginBottom: '1.25rem' }}>
                        <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                        <span>{errors.profileType}</span>
                      </div>
                    )}

                    {/* 3 Category Tiles */}
                    <div className="applicant-tier-grid">
                      {/* 1. College Student */}
                      <div
                        className={`applicant-tier-card ${profileType === 'college_student' ? 'selected' : ''}`}
                        onClick={() => {
                          setProfileType('college_student');
                          if (errors.profileType) setErrors((prev) => ({ ...prev, profileType: null }));
                        }}
                      >
                        <div className="tier-icon-wrap">
                          <GraduationCap size={24} />
                        </div>
                        <h4 className="tier-title">College Student</h4>
                        <p className="tier-tagline">Campus ID &amp; Flex Work</p>
                      </div>

                      {/* 2. School Student */}
                      <div
                        className={`applicant-tier-card ${profileType === 'school_student' ? 'selected' : ''}`}
                        onClick={() => {
                          setProfileType('school_student');
                          if (errors.profileType) setErrors((prev) => ({ ...prev, profileType: null }));
                        }}
                      >
                        <div className="tier-icon-wrap">
                          <School size={24} />
                        </div>
                        <h4 className="tier-title">School Student</h4>
                        <p className="tier-tagline">Minor Daytime Curfew</p>
                      </div>

                      {/* 3. Professional */}
                      <div
                        className={`applicant-tier-card ${profileType === 'professional' ? 'selected' : ''}`}
                        onClick={() => {
                          setProfileType('professional');
                          if (errors.profileType) setErrors((prev) => ({ ...prev, profileType: null }));
                        }}
                      >
                        <div className="tier-icon-wrap">
                          <Briefcase size={24} />
                        </div>
                        <h4 className="tier-title">Professional</h4>
                        <p className="tier-tagline">KYC &amp; Trade Certified</p>
                      </div>
                    </div>

                    {/* Fields according to selected category */}
                    {profileType === 'college_student' && (
                      <div className="criteria-fields-grid">
                        <div className="criteria-form-group">
                          <label>College / University Name *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. RV College of Engineering"
                            value={formData.collegeName}
                            onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Course &amp; Academic Year *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. B.E. Computer Science, 1st Year"
                            value={formData.course}
                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Student ID / Roll Number *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. 1RV21CS089"
                            value={formData.rollNumber}
                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Guardian / Parent Mobile (Safety Radar) *</label>
                          <input
                            type="tel"
                            className="criteria-dark-input"
                            placeholder="e.g. +919845012345"
                            value={formData.guardianPhone}
                            onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {profileType === 'school_student' && (
                      <div className="criteria-fields-grid">
                        <div className="criteria-form-group">
                          <label>School / Institution Name *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. National Public School"
                            value={formData.schoolName}
                            onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Course &amp; Academic Year / Grade *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. Class 11 - Daytime (3 PM - 7 PM)"
                            value={formData.schoolGrade}
                            onChange={(e) => setFormData({ ...formData, schoolGrade: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Student ID / Roll Number *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. NPS-2024-089"
                            value={formData.rollNumber}
                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Guardian / Parent Mobile (Safety Radar) *</label>
                          <input
                            type="tel"
                            className="criteria-dark-input"
                            placeholder="e.g. +919845012345"
                            value={formData.guardianPhone}
                            onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {profileType === 'professional' && (
                      <div className="criteria-fields-grid">
                        <div className="criteria-form-group">
                          <label>Primary Trade / Specialization *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. Master Electrician / Appliance Repair"
                            value={formData.skills.join(', ') || 'Electrical, Appliance Repair'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Years of Practical Experience *</label>
                          <input
                            type="number"
                            min="0"
                            className="criteria-dark-input"
                            placeholder="e.g. 4"
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Government ID / Masked Aadhaar *</label>
                          <input
                            type="text"
                            className="criteria-dark-input"
                            placeholder="e.g. XXXX-XXXX-9012"
                            value={formData.aadhaarNumber}
                            onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                          />
                        </div>

                        <div className="criteria-form-group">
                          <label>Expected Hourly Rate (₹) *</label>
                          <input
                            type="number"
                            min="50"
                            className="criteria-dark-input"
                            placeholder="e.g. 500"
                            value={formData.expectedRate}
                            onChange={(e) => setFormData({ ...formData, expectedRate: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Document Upload Widget */}
                    <div className="doc-upload-container">
                      <div className="doc-upload-info">
                        <div className="doc-icon-preview">
                          <FileText size={22} />
                        </div>
                        <div className="doc-text-meta">
                          <h5>
                            {profileType === 'school_student'
                              ? 'Upload Parent Consent Letter / School ID *'
                              : profileType === 'professional'
                              ? 'Upload Trade Certification / ID Proof *'
                              : 'Upload Student ID Card (Front/Back) *'}
                          </h5>
                          <p>
                            {docUploaded
                              ? `${docFileName} (${docFileSize})`
                              : 'PDF, JPG, or PNG up to 10 MB'}
                          </p>
                        </div>
                      </div>

                      <div className="doc-action-btns">
                        {docUploaded && (
                          <span className="doc-verified-badge">
                            <CheckCircle2 size={13} />
                            Verified Document Attached
                          </span>
                        )}

                        <label className="btn-upload-file">
                          <Award size={14} />
                          <span>{docUploaded ? 'Change File' : 'Upload Document'}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                        </label>

                        <button
                          type="button"
                          className="btn-sample-file"
                          onClick={handleUseSampleDoc}
                        >
                          Use Sample Doc
                        </button>
                      </div>
                    </div>

                    {errors.document && (
                      <span className="field-error-text" style={{ marginTop: '0.5rem', color: '#f87171' }}>
                        {errors.document}
                      </span>
                    )}

                    {/* Mandatory Criteria & Rules Box */}
                    <div className="mandatory-criteria-box">
                      <div className="mandatory-rules-header">
                        <CheckCircle2 size={18} color="#60a5fa" />
                        <span>
                          {profileType === 'school_student'
                            ? 'Mandatory School Student Criteria & Rules:'
                            : profileType === 'professional'
                            ? 'Mandatory Professional Specialist Criteria & Rules:'
                            : 'Mandatory College Student Criteria & Rules:'}
                        </span>
                      </div>

                      <ul className="mandatory-rules-list">
                        {profileType === 'college_student' && (
                          <>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Must have valid student ID card for identity verification before work begins.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Emergency alert triggers to guardian contact if on-site assignments extend past 8:00 PM.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span><strong>Employer Acceptance Required:</strong> You cannot visit the job site until the employer reviews and accepts your application.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>All payments are held securely in NearbyGigs Fair Escrow until task completion.</span>
                            </li>
                          </>
                        )}

                        {profileType === 'school_student' && (
                          <>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Strict minor daytime curfew: No work permitted between 7:00 PM - 6:00 AM.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Mandatory parent or guardian consent verified before attending any local task.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span><strong>Employer Acceptance Required:</strong> Employer review and parent notification required before task commencement.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Restricted to non-hazardous daytime assistance, homework tutoring, and retail organizing gigs.</span>
                            </li>
                          </>
                        )}

                        {profileType === 'professional' && (
                          <>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>Must provide verified trade qualifications and valid identity before worksite arrival.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span><strong>Employer Acceptance Required:</strong> Employer must accept the proposal to issue your Arrival OTP.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>NearbyGigs Escrow guarantees payment release upon task completion and client signoff.</span>
                            </li>
                            <li>
                              <span className="rule-bullet-dot" />
                              <span>24/7 on-site safety radar and insurance dispute protection active.</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Skills Pills Bar */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <Tag size={16} color="#2563eb" />
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                        Your Skills &amp; Capabilities
                      </strong>
                    </div>

                    <div className="popular-skills-suggestions" style={{ margin: 0 }}>
                      {popularSkills.slice(0, 8).map((ps, idx) => {
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

                  {/* Location Bar */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      marginBottom: '2rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#2563eb" />
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          Neighborhood Work Location
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={handleLocationAllow}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Compass size={13} /> Detect Location
                      </button>
                    </div>

                    <input
                      type="text"
                      className="input-modern-onboard"
                      placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      maxWidth: '520px',
                      margin: '0 auto',
                    }}
                  >
                    <button
                      type="button"
                      className="btn-save-primary"
                      onClick={() => handleFinish('dashboard')}
                      disabled={saving}
                      style={{
                        padding: '1.1rem 1.75rem',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>Verifying &amp; Activating Profile...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={20} />
                          <span>Verify Criteria, Upload Document &amp; Activate Profile</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/choose-purpose')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        textAlign: 'center',
                      }}
                    >
                      ← Back to Purpose Selection
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CREDENTIALS & SAFETY */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a' }}>
                      {profileType === 'school_student' && '🎒 School Student Safety Profile'}
                      {profileType === 'college_student' && '🎓 College Student Profile'}
                      {profileType === 'professional' && '🛠 Professional Skills & Portfolio'}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Provide verified information to build trust with local employers.
                    </p>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="auth-alert-error" style={{ marginBottom: '1.25rem' }}>
                      <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Please complete all required fields marked with * to continue:</strong>
                        <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
                          {Object.values(errors).map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* School Student */}
                  {profileType === 'school_student' && (
                    <div className="form-stack-onboarding">
                      <div
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          padding: '1rem',
                          borderRadius: '12px',
                          color: '#1e40af',
                          fontSize: '0.85rem',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Minor &amp; School Safety Safeguards:</strong>
                          <p style={{ margin: '0.2rem 0 0' }}>
                            Restricted to non-hazardous tasks during daytime hours (no work between
                            7 PM - 6 AM). Verified parent or guardian details are required.
                          </p>
                        </div>
                      </div>

                      <div className="form-grid-two">
                        <div className="form-group-onboard">
                          <label>School Name *</label>
                          <input
                            type="text"
                            className={`input-modern-onboard ${errors.schoolName ? 'has-error' : ''}`}
                            placeholder="e.g. National Public School"
                            value={formData.schoolName}
                            onChange={(e) => {
                              setFormData({ ...formData, schoolName: e.target.value });
                              if (errors.schoolName) setErrors((prev) => ({ ...prev, schoolName: null }));
                            }}
                          />
                          {errors.schoolName && <span className="field-error-text">{errors.schoolName}</span>}
                        </div>

                        <div className="form-group-onboard">
                          <label>Class / Grade</label>
                          <input
                            type="text"
                            className="input-modern-onboard"
                            placeholder="e.g. Class 11"
                            value={formData.schoolGrade}
                            onChange={(e) =>
                              setFormData({ ...formData, schoolGrade: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-group-onboard">
                        <label>Preferred Daytime Availability (No Late-Night Work)</label>
                        <select
                          className="input-modern-onboard"
                          value={formData.daytimeAvailability}
                          onChange={(e) =>
                            setFormData({ ...formData, daytimeAvailability: e.target.value })
                          }
                        >
                          <option value="After School (3 PM - 7 PM)">
                            After School (3 PM - 7 PM)
                          </option>
                          <option value="Weekends Only (9 AM - 5 PM)">
                            Weekends Only (9 AM - 5 PM)
                          </option>
                          <option value="Saturday Afternoon (1 PM - 6 PM)">
                            Saturday Afternoon (1 PM - 6 PM)
                          </option>
                        </select>
                      </div>

                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '1.25rem',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#1e293b',
                            marginBottom: '0.75rem',
                          }}
                        >
                          Verified Parent or Guardian Contact *
                        </h4>
                        <div className="form-grid-two">
                          <div className="form-group-onboard">
                            <label>Parent / Guardian Name *</label>
                            <input
                              type="text"
                              className={`input-modern-onboard ${errors.guardianName ? 'has-error' : ''}`}
                              placeholder="e.g. Ramesh Kumar"
                              value={formData.guardianName}
                              onChange={(e) => {
                                setFormData({ ...formData, guardianName: e.target.value });
                                if (errors.guardianName) setErrors((prev) => ({ ...prev, guardianName: null }));
                              }}
                            />
                            {errors.guardianName && <span className="field-error-text">{errors.guardianName}</span>}
                          </div>

                          <div className="form-group-onboard">
                            <label>Guardian Mobile Number *</label>
                            <input
                              type="tel"
                              className={`input-modern-onboard ${errors.guardianPhone ? 'has-error' : ''}`}
                              placeholder="9845012345"
                              value={formData.guardianPhone}
                              onChange={(e) => {
                                setFormData({ ...formData, guardianPhone: e.target.value });
                                if (errors.guardianPhone) setErrors((prev) => ({ ...prev, guardianPhone: null }));
                              }}
                            />
                            {errors.guardianPhone && <span className="field-error-text">{errors.guardianPhone}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* College Student */}
                  {profileType === 'college_student' && (
                    <div className="form-stack-onboarding">
                      <div className="form-grid-two">
                        <div className="form-group-onboard">
                          <label>College / University Name *</label>
                          <input
                            type="text"
                            className={`input-modern-onboard ${errors.collegeName ? 'has-error' : ''}`}
                            placeholder="e.g. RV College of Engineering"
                            value={formData.collegeName}
                            onChange={(e) => {
                              setFormData({ ...formData, collegeName: e.target.value });
                              if (errors.collegeName) setErrors((prev) => ({ ...prev, collegeName: null }));
                            }}
                          />
                          {errors.collegeName && <span className="field-error-text">{errors.collegeName}</span>}
                        </div>

                        <div className="form-group-onboard">
                          <label>Course / Major *</label>
                          <input
                            type="text"
                            className={`input-modern-onboard ${errors.course ? 'has-error' : ''}`}
                            placeholder="e.g. B.E. Computer Science"
                            value={formData.course}
                            onChange={(e) => {
                              setFormData({ ...formData, course: e.target.value });
                              if (errors.course) setErrors((prev) => ({ ...prev, course: null }));
                            }}
                          />
                          {errors.course && <span className="field-error-text">{errors.course}</span>}
                        </div>
                      </div>

                      <div className="form-grid-two">
                        <div className="form-group-onboard">
                          <label>Year of Study *</label>
                          <select
                            className={`input-modern-onboard ${errors.year ? 'has-error' : ''}`}
                            value={formData.year}
                            onChange={(e) => {
                              setFormData({ ...formData, year: Number(e.target.value) });
                              if (errors.year) setErrors((prev) => ({ ...prev, year: null }));
                            }}
                          >
                            <option value="">Select Year of Study...</option>
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year / Final</option>
                            <option value={5}>Postgraduate</option>
                          </select>
                          {errors.year && <span className="field-error-text">{errors.year}</span>}
                        </div>

                        <div className="form-group-onboard">
                          <label>Student Roll Number / College ID (Confidential)</label>
                          <input
                            type="text"
                            className="input-modern-onboard"
                            placeholder="e.g. 1RV22CS045"
                            value={formData.rollNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, rollNumber: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Worker */}
                  {profileType === 'professional' && (
                    <div className="form-stack-onboarding">
                      <div className="form-grid-two">
                        <div className="form-group-onboard">
                          <label>Years of Practical Experience *</label>
                          <input
                            type="number"
                            min="0"
                            max="40"
                            placeholder="e.g. 2"
                            className={`input-modern-onboard ${errors.experience ? 'has-error' : ''}`}
                            value={formData.experience}
                            onChange={(e) => {
                              setFormData({ ...formData, experience: e.target.value });
                              if (errors.experience) setErrors((prev) => ({ ...prev, experience: null }));
                            }}
                          />
                          {errors.experience && <span className="field-error-text">{errors.experience}</span>}
                        </div>

                        <div className="form-group-onboard">
                          <label>Expected Rate (₹) &amp; Billing Type *</label>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '0.5rem',
                            }}
                          >
                            <input
                              type="number"
                              min="50"
                              placeholder="e.g. 500"
                              className={`input-modern-onboard ${errors.expectedRate ? 'has-error' : ''}`}
                              value={formData.expectedRate}
                              onChange={(e) => {
                                setFormData({ ...formData, expectedRate: e.target.value });
                                if (errors.expectedRate) setErrors((prev) => ({ ...prev, expectedRate: null }));
                              }}
                            />
                            <select
                              className="input-modern-onboard"
                              value={formData.rateType}
                              onChange={(e) =>
                                setFormData({ ...formData, rateType: e.target.value })
                              }
                            >
                              <option value="Hourly">per Hour</option>
                              <option value="Fixed">Fixed Job</option>
                              <option value="Monthly">Monthly</option>
                            </select>
                          </div>
                          {errors.expectedRate && <span className="field-error-text">{errors.expectedRate}</span>}
                        </div>
                      </div>

                      <div className="form-group-onboard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label style={{ margin: 0 }}>Portfolio Link / Previous Work Output URL</label>
                          <button type="button" className="quick-demo-url-btn" onClick={handleInsertDemoUrl}>
                            + Insert Demo URL
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="url"
                            className={`input-modern-onboard ${errors.portfolio ? 'has-error' : ''}`}
                            placeholder="https://github.com/... or https://portfolio.com/..."
                            value={formData.portfolioInput}
                            onChange={(e) => {
                              setFormData({ ...formData, portfolioInput: e.target.value });
                              if (errors.portfolio) setErrors((prev) => ({ ...prev, portfolio: null }));
                            }}
                          />
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleAddPortfolio}
                          >
                            Add Link
                          </button>
                        </div>
                        {errors.portfolio && <span className="field-error-text">{errors.portfolio}</span>}

                        {formData.portfolioLinks.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginTop: '0.5rem',
                            }}
                          >
                            {formData.portfolioLinks.map((p, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills Selector for workers (Required for all worker categories) */}
                  <div className="form-group-onboard" style={{ marginTop: '1.25rem' }}>
                    <label>Trade Skills &amp; Capabilities *</label>
                    <div className="skills-interactive-container">
                      <div className="skills-tags-wrap" style={{ border: errors.skills ? '1.5px solid #ef4444' : undefined }}>
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

                      {errors.skills && (
                        <div className="field-error-text" style={{ marginTop: '0.4rem' }}>
                          {errors.skills}
                        </div>
                      )}

                      <div className="popular-skills-suggestions">
                        <span className="suggestions-title">Quick Add:</span>
                        {popularSkills.map((ps, idx) => {
                          const isAdded = formData.skills.includes(ps);
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`suggestion-pill-btn ${isAdded ? 'added' : ''}`}
                              onClick={() =>
                                isAdded ? handleRemoveSkill(ps) : handleAddSkill(ps)
                              }
                            >
                              {isAdded ? <Check size={12} /> : <Plus size={12} />}
                              {ps}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Optional Aadhaar KYC */}
                  <div
                    className="form-group-onboard"
                    style={{
                      marginTop: '1.5rem',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '1.25rem',
                    }}
                  >
                    <div className="form-label-row">
                      <label>
                        <UserCheck size={16} color="#2563eb" />
                        12-Digit Aadhaar Identity Verification (Optional - unlocks Verified Badge)
                      </label>
                      <span className="label-hint-sub">Stored as masked XXXX-XXXX-1234</span>
                    </div>
                    <input
                      type="text"
                      className={`input-modern-onboard ${errors.aadhaar ? 'has-error' : ''}`}
                      placeholder="e.g. 5432 1098 7654"
                      value={formData.aadhaarNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, aadhaarNumber: e.target.value });
                        if (errors.aadhaar) setErrors((prev) => ({ ...prev, aadhaar: null }));
                      }}
                    />
                    {errors.aadhaar && <span className="field-error-text">{errors.aadhaar}</span>}
                  </div>

                  <div className="step-nav-footer">
                    <button type="button" className="btn-nav-prev" onClick={handlePrev}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="button" className="btn-nav-next" onClick={handleNext}>
                      <span>Next: Location Privacy</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: WORKER LOCATION & ACTIVATION */}
              {step === 3 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="step-icon-large">
                      <Compass size={36} color="#2563eb" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      Location Privacy &amp; Marketplace Radar
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      NearbyGigs uses bounded neighborhood coordinates for proximity matching.
                      Continuous background tracking is strictly prohibited and disabled.
                    </p>
                  </div>

                  {errors.address && (
                    <div className="auth-alert-error" style={{ marginBottom: '1.25rem' }}>
                      <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                      <span>{errors.address}</span>
                    </div>
                  )}

                  {locMsg && (
                    <div className="location-status-pill" style={{ marginBottom: '1.25rem' }}>
                      <CheckCircle2 size={16} />
                      <span>{locMsg}</span>
                    </div>
                  )}

                  <div className="location-action-box">
                    <button
                      type="button"
                      className="btn-locate-gps"
                      onClick={handleLocationAllow}
                    >
                      <MapPin size={18} />
                      <span>Detect Neighborhood Location</span>
                    </button>

                    <div className="location-divider">
                      <span>OR CONFIRM ADDRESS MANUALLY *</span>
                    </div>

                    <div className="form-group-onboard" style={{ width: '100%' }}>
                      <input
                        type="text"
                        className={`input-modern-onboard ${errors.address ? 'has-error' : ''}`}
                        placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value });
                          if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                        }}
                      />
                      {errors.address && <span className="field-error-text">{errors.address}</span>}
                    </div>
                  </div>

                  <div className="step-nav-footer">
                    <button type="button" className="btn-nav-prev" onClick={handlePrev}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="button"
                      className="btn-nav-next"
                      onClick={() => handleFinish('dashboard')}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Activating Profile...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Complete &amp; Enter Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================================================================
              FLOW 3: OFFER SERVICES / BOTH (SPECIALIST SERVICE SETUP)
              ================================================================= */}
          {(purposeParam === 'offer_services' || purposeParam === 'both') && (
            <>
              {step === 1 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div
                      className="step-icon-large"
                      style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}
                    >
                      <Sparkles size={34} color="#7c3aed" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      🛠 Showcase Your Trade Skills &amp; Services
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      List your specialized capabilities to receive neighborhood direct bookings.
                    </p>
                  </div>

                  {errors.skills && <div className="auth-alert-error">{errors.skills}</div>}

                  <div className="form-stack-onboarding">
                    <div className="form-group-onboard">
                      <label>Trade Skills &amp; Capabilities *</label>
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
                          <span className="suggestions-title">Quick Add:</span>
                          {popularSkills.map((ps, idx) => {
                            const isAdded = formData.skills.includes(ps);
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`suggestion-pill-btn ${isAdded ? 'added' : ''}`}
                                onClick={() =>
                                  isAdded ? handleRemoveSkill(ps) : handleAddSkill(ps)
                                }
                              >
                                {isAdded ? <Check size={12} /> : <Plus size={12} />}
                                {ps}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="form-grid-two">
                      <div className="form-group-onboard">
                        <label>Years of Practical Experience *</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          placeholder="e.g. 2"
                          className={`input-modern-onboard ${errors.experience ? 'has-error' : ''}`}
                          value={formData.experience}
                          onChange={(e) => {
                            setFormData({ ...formData, experience: e.target.value });
                            if (errors.experience) setErrors((prev) => ({ ...prev, experience: null }));
                          }}
                        />
                        {errors.experience && <span className="field-error-text">{errors.experience}</span>}
                      </div>

                      <div className="form-group-onboard">
                        <label>Standard Rate (₹) &amp; Billing *</label>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                          }}
                        >
                          <input
                            type="number"
                            min="50"
                            placeholder="e.g. 500"
                            className={`input-modern-onboard ${errors.expectedRate ? 'has-error' : ''}`}
                            value={formData.expectedRate}
                            onChange={(e) => {
                              setFormData({ ...formData, expectedRate: e.target.value });
                              if (errors.expectedRate) setErrors((prev) => ({ ...prev, expectedRate: null }));
                            }}
                          />
                          <select
                            className="input-modern-onboard"
                            value={formData.rateType}
                            onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                          >
                            <option value="Hourly">per Hour</option>
                            <option value="Fixed">Fixed Job</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                        </div>
                        {errors.expectedRate && <span className="field-error-text">{errors.expectedRate}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="step-nav-footer">
                    <button
                      type="button"
                      className="btn-nav-prev"
                      onClick={() => navigate('/choose-purpose')}
                    >
                      <ArrowLeft size={16} /> Choose Purpose
                    </button>
                    <button type="button" className="btn-nav-next" onClick={handleNext}>
                      <span>Next: Portfolio &amp; Verification</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="step-icon-large">
                      <Award size={34} color="#7c3aed" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      📜 Portfolio &amp; Verification
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      Add links to previous client work, certificates, or complete Aadhaar KYC.
                    </p>
                  </div>

                  <div className="form-stack-onboarding">
                    <div className="form-group-onboard">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <label style={{ margin: 0 }}>Portfolio Link / Previous Work Output URL</label>
                        <button type="button" className="quick-demo-url-btn" onClick={handleInsertDemoUrl}>
                          + Insert Demo URL
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="url"
                          className={`input-modern-onboard ${errors.portfolio ? 'has-error' : ''}`}
                          placeholder="https://github.com/... or https://portfolio.com/..."
                          value={formData.portfolioInput}
                          onChange={(e) => {
                            setFormData({ ...formData, portfolioInput: e.target.value });
                            if (errors.portfolio) setErrors((prev) => ({ ...prev, portfolio: null }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleAddPortfolio}
                        >
                          Add Link
                        </button>
                      </div>
                      {errors.portfolio && <span className="field-error-text">{errors.portfolio}</span>}

                      {formData.portfolioLinks.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap',
                            marginTop: '0.5rem',
                          }}
                        >
                          {formData.portfolioLinks.map((p, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group-onboard">
                      <div className="form-label-row">
                        <label>
                          <UserCheck size={16} color="#2563eb" />
                          12-Digit Aadhaar Identity Verification (Optional - unlocks Verified Badge)
                        </label>
                        <span className="label-hint-sub">Stored as masked XXXX-XXXX-1234</span>
                      </div>
                      <input
                        type="text"
                        className="input-modern-onboard"
                        placeholder="e.g. 5432 1098 7654"
                        value={formData.aadhaarNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, aadhaarNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="step-nav-footer">
                    <button type="button" className="btn-nav-prev" onClick={handlePrev}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button type="button" className="btn-nav-next" onClick={handleNext}>
                      <span>Next: Service Area Location</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade-in">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="step-icon-large">
                      <Compass size={36} color="#7c3aed" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      Service Area Radar &amp; Activation
                    </h2>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.95rem',
                        maxWidth: '580px',
                        margin: '0 auto',
                      }}
                    >
                      Confirm your base location to appear in neighborhood service searches.
                    </p>
                  </div>

                  {errors.address && (
                    <div className="auth-alert-error" style={{ marginBottom: '1.25rem' }}>
                      <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                      <span>{errors.address}</span>
                    </div>
                  )}

                  <div className="location-action-box">
                    <button
                      type="button"
                      className="btn-locate-gps"
                      onClick={handleLocationAllow}
                    >
                      <MapPin size={18} />
                      <span>Detect Base Location</span>
                    </button>

                    <div className="location-divider">
                      <span>OR CONFIRM ADDRESS MANUALLY *</span>
                    </div>

                    <div className="form-group-onboard" style={{ width: '100%' }}>
                      <input
                        type="text"
                        className={`input-modern-onboard ${errors.address ? 'has-error' : ''}`}
                        placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData({ ...formData, address: e.target.value });
                          if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                        }}
                      />
                      {errors.address && <span className="field-error-text">{errors.address}</span>}
                    </div>
                  </div>

                  <div className="step-nav-footer">
                    <button type="button" className="btn-nav-prev" onClick={handlePrev}>
                      <ArrowLeft size={16} /> Back
                    </button>
                    <button
                      type="button"
                      className="btn-nav-next"
                      onClick={() => handleFinish('dashboard')}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Publishing Profile...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Complete &amp; Enter Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
