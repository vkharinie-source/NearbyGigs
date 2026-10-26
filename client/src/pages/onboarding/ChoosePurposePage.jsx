import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import {
  Briefcase,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Check,
  Compass,
} from 'lucide-react';
import './Onboarding.css';

const ChoosePurposePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, choosePurpose } = useAuthContext();

  const applyGigId = searchParams.get('applyGigId') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingApplyGigId') : null);
  // Default to user choice if previously explicitly set, or empty so they must choose
  const [selectedPurpose, setSelectedPurpose] = useState(() => {
    if (applyGigId) return 'find_work';
    if (user?.role === 'employer' || user?.role === 'customer' || user?.purpose === 'post_jobs') return 'post_jobs';
    return user?.purpose || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const purposeOptions = [
    {
      id: 'find_work',
      title: 'Find Work & Part-Time Gigs',
      tag: 'Students, Graduates & Workers',
      badge: 'APPLY FOR WORK',
      description: 'Apply for suitable nearby gigs, campus tasks, or freelance jobs with verified documents and secure payment protection.',
      icon: <Briefcase size={28} color="#2563eb" />,
      features: ['Browse verified nearby gigs', 'Student safety safeguards', 'Document verification gate'],
    },
    {
      id: 'post_jobs',
      title: 'Post a Job & Hire Workers',
      tag: 'Employers, Businesses & Shop Owners',
      badge: 'HIRE TALENT',
      description: 'Publish work requirements, review verified applicant proposals, issue job instructions, and verify attendance with arrival OTP.',
      icon: <Building2 size={28} color="#059669" />,
      features: ['Post genuine job openings', 'Arrival OTP attendance check', 'Review worker ratings & reviews'],
    },
    {
      id: 'offer_services',
      title: 'Offer Professional Services & Tutoring',
      tag: 'Teachers, Tutors & Specialists',
      badge: 'SERVICES & TEACHING',
      description: 'Provide tutoring, teaching, technical repairs, home services, and specialist skills with verified credentials.',
      icon: <Sparkles size={28} color="#7c3aed" />,
      features: ['Teacher & tutor verification', 'Direct client service booking', 'Protected platform escrow'],
    },
    {
      id: 'both',
      title: 'Both: Find Work and Hire',
      tag: 'Dual Role (Workers & Job Posters)',
      badge: 'FULL ACCESS',
      description: 'Access both worker features and employer hiring capabilities seamlessly through a single unified account.',
      icon: <Layers size={28} color="#d97706" />,
      features: ['Apply for jobs and post openings', 'Dual dashboard access', 'Single profile & verification'],
    },
  ];

  const getButtonLabel = () => {
    if (selectedPurpose) return 'Continue to Category Selection & Verification';
    return 'Select an Option Above to Continue';
  };

  const handleContinue = async () => {
    if (!selectedPurpose) {
      setError('Please select an option to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await choosePurpose(selectedPurpose);
      // Direct user to Onboarding to select their profile category and submit verification documents
      if (applyGigId) {
        navigate(`/onboarding?purpose=${selectedPurpose}&applyGigId=${applyGigId}`);
      } else {
        navigate(`/onboarding?purpose=${selectedPurpose}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update your purpose preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page-layout">
      <Navbar />

      <main className="onboarding-container" style={{ maxWidth: '1060px', width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="onboarding-card animate-scale-up" style={{ maxWidth: '1060px', width: '100%', margin: '0 auto', padding: '2.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#eff6ff',
                color: '#2563eb',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '0.85rem',
              }}
            >
              <Compass size={14} />
              <span>STEP 1 OF 2: PURPOSE SELECTION</span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.6rem' }}>
              What would you like to do on NearbyGigs?
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
              Select your primary goal to personalize your dashboard, job recommendations, and safety controls. You can switch anytime in settings.
            </p>
          </div>

          {error && <div className="auth-alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          {/* 4 Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            {purposeOptions.map((opt) => {
              const isSelected = selectedPurpose === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    setSelectedPurpose(opt.id);
                    setError('');
                  }}
                  style={{
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    border: `2px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(5, 150, 105, 0.2)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} />
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {opt.icon}
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isSelected ? '#d1fae5' : '#f1f5f9',
                          color: isSelected ? '#047857' : '#64748b',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {opt.tag}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                      {opt.title}
                    </h3>

                    <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                      {opt.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                    {opt.features.map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem',
                          color: '#475569',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <CheckCircle2 size={13} color="#059669" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Single account — switch anytime in your Profile Settings</span>
            </div>

            <button
              type="button"
              className="btn-save-primary"
              onClick={handleContinue}
              disabled={!selectedPurpose || loading}
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: !selectedPurpose ? 0.6 : 1,
                cursor: !selectedPurpose ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Saving Preference...</span>
                </>
              ) : (
                <>
                  <span>{getButtonLabel()}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChoosePurposePage;
