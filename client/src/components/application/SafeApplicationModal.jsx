import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  GraduationCap,
  Briefcase,
  UserCheck,
  Check,
  X,
  Clock,
  DollarSign,
  PhoneCall,
  FileCheck2,
  Award,
} from 'lucide-react';
import './SafeApplicationModal.css';

/**
 * SafeApplicationModal
 * Enforces multi-tier criteria verification before applying:
 * 1. School Student Criteria
 * 2. College Student Criteria
 * 3. Professional Worker Criteria
 * User must accept all criteria before application can be submitted.
 */
const SafeApplicationModal = ({
  gig,
  user,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!isOpen || !gig) return null;

  // Determine user's category (school_student, college_student, professional)
  const initialCategory = () => {
    if (user?.userType === 'school_student' || (user?.isStudent && user?.age < 18)) {
      return 'school_student';
    }
    if (user?.userType === 'college_student' || user?.role === 'student_worker' || user?.isStudent) {
      return 'college_student';
    }
    return 'professional';
  };

  const [activeTier, setActiveTier] = useState(initialCategory);
  const [proposedRate, setProposedRate] = useState(gig.budgetMin || 500);
  const [proposalPitch, setProposalPitch] = useState('');
  const [acceptedCriteria, setAcceptedCriteria] = useState({});
  const [parentConsentApproved, setParentConsentApproved] = useState(
    user?.guardian?.isVerified || user?.school?.parentConsentVerified || false
  );
  const [parentApproving, setParentApproving] = useState(false);

  // Handle parent approval simulation
  const handleApproveParentConsent = () => {
    setParentApproving(true);
    setTimeout(() => {
      setParentConsentApproved(true);
      setAcceptedCriteria((prev) => ({
        ...prev,
        school_guardian: true,
      }));
      setParentApproving(false);
    }, 500);
  };

  // Criteria Definitions for each category
  const criteriaByTier = {
    school_student: [
      {
        id: 'school_age',
        icon: UserCheck,
        title: 'Statutory Age & Child Safeguard',
        desc: `Verified age (${user?.age || 16} years) complies with student labor laws. Minimum age of 14+ satisfied.`,
        required: true,
      },
      {
        id: 'school_guardian',
        icon: PhoneCall,
        title: 'Parent / Guardian Consent Message & Approval',
        desc: parentConsentApproved
          ? `✓ Verified: Consent from parent (${user?.guardian?.name || 'Suresh Kumar'}) has been confirmed.`
          : `⚠️ Pending Approval: A message was sent to parent (${user?.guardian?.name || 'Suresh Kumar'}, ${user?.guardian?.phone || '+91 9876543210'}). Work cannot begin until parent accepts.`,
        required: true,
        isParentConsent: true,
        isPendingParent: !parentConsentApproved,
      },
      {
        id: 'school_curfew',
        icon: Clock,
        title: 'Strict Daytime Curfew (No Night Gigs)',
        desc: gig.isNightGig
          ? '❌ Restricted: Night work is strictly prohibited for school students.'
          : 'Work scheduled strictly between 3:00 PM and 7:00 PM outside school hours.',
        required: true,
        isBlocked: gig.isNightGig,
      },
      {
        id: 'school_hazard',
        icon: ShieldAlert,
        title: 'Zero Hazardous Conditions Guarantee',
        desc: 'Task involves safe, non-hazardous assistance without heavy industrial equipment or live high voltage.',
        required: true,
      },
      {
        id: 'school_escrow',
        icon: CheckCircle2,
        title: 'Protected Student Escrow Payment',
        desc: 'Earnings are protected in secure platform escrow and disbursed upon confirmed completion.',
        required: true,
      },
    ],
    college_student: [
      {
        id: 'college_enrollment',
        icon: GraduationCap,
        title: 'Verified College Enrollment',
        desc: `Enrolled at ${user?.college?.name || 'Accredited University'} (${user?.college?.course || 'Degree Program'}). Student ID verified.`,
        required: true,
      },
      {
        id: 'college_legal_age',
        icon: UserCheck,
        title: 'Legal Working Adult (18+)',
        desc: `Verified adult age (${user?.age || 21} years) authorized for independent freelance contracts.`,
        required: true,
      },
      {
        id: 'college_night_radar',
        icon: Clock,
        title: gig.isNightGig ? '🌙 Night Work Safety Radar Active' : 'Flexible Student Scheduling',
        desc: gig.isNightGig
          ? 'Automated guardian notifications dispatched at check-in & check-out for shifts after 8:00 PM.'
          : 'Work hours do not conflict with college exams or academic lecture attendance.',
        required: true,
      },
      {
        id: 'college_skills',
        icon: Award,
        title: 'Technical Skill & Task Competency',
        desc: `Possess required capabilities (${gig.requiredSkills || 'General Tech Setup'}) with deliverable commitment.`,
        required: true,
      },
      {
        id: 'college_otp',
        icon: ShieldCheck,
        title: 'Attendance OTP & Platform Escrow Agreement',
        desc: 'Must verify presence at job site via secure Employer Arrival OTP to unlock milestone payouts.',
        required: true,
      },
    ],
    professional: [
      {
        id: 'pro_kyc',
        icon: FileCheck2,
        title: 'Masked Aadhaar KYC Identity Verification',
        desc: `Identity verified with UIDAI Data Minimization (${user?.maskedAadhaar || 'XXXX-XXXX-9012'}). Zero fraud record.`,
        required: true,
      },
      {
        id: 'pro_skills',
        icon: Award,
        title: 'Domain Expertise & Tooling Readiness',
        desc: `Equipped with certified trade tools, PPE safety equipment, and required technical competence in ${gig.category}.`,
        required: true,
      },
      {
        id: 'pro_experience',
        icon: Briefcase,
        title: 'Professional Experience Threshold',
        desc: `Meets employer benchmark of ${gig.requiredExperience || 0}+ years (Profile: ${user?.experience || 6} years verified experience).`,
        required: true,
      },
      {
        id: 'pro_safety_code',
        icon: ShieldAlert,
        title: 'Workplace Safety & Standards Compliance',
        desc: 'Adherence to Indian national safety codes, non-disclosure protocols, and quality craftsmanship.',
        required: true,
      },
      {
        id: 'pro_dispute',
        icon: ShieldCheck,
        title: 'Fair Escrow Payout & 24h Complaint SLA Agreement',
        desc: '100% funds held in platform escrow prior to arrival. Committed to 24-hour dispute SLA terms.',
        required: true,
      },
    ],
  };

  const currentCriteriaList = criteriaByTier[activeTier] || criteriaByTier.professional;

  // Check if any criteria is legally blocked (e.g. school student applying for night gig)
  const hasBlockedCriteria = currentCriteriaList.some((c) => c.isBlocked);

  // Toggle single criteria checkbox
  const handleToggleCriteria = (id) => {
    setAcceptedCriteria((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Accept all criteria at once
  const handleAcceptAll = () => {
    const allAccepted = {};
    currentCriteriaList.forEach((c) => {
      if (!c.isBlocked) allAccepted[c.id] = true;
    });
    setAcceptedCriteria(allAccepted);
  };

  // Reset criteria when switching tier
  useEffect(() => {
    setAcceptedCriteria({});
  }, [activeTier]);

  const acceptedCount = currentCriteriaList.filter((c) => acceptedCriteria[c.id]).length;
  const totalCount = currentCriteriaList.length;
  const allCriteriaAccepted = acceptedCount === totalCount && !hasBlockedCriteria;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allCriteriaAccepted) return;

    onSubmit({
      proposedRate: Number(proposedRate),
      proposal: proposalPitch.trim() || `I satisfy all ${activeTier.replace('_', ' ')} criteria and commit to high-quality work.`,
      tier: activeTier,
      criteriaAccepted: acceptedCriteria,
    });
  };

  return (
    <div className="safe-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="safe-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="safe-modal-header">
          <div className="safe-modal-title-wrap">
            <div className="safe-shield-badge">
              <ShieldCheck size={24} color="#10b981" />
            </div>
            <div>
              <h3>Apply with Verified Safety Criteria</h3>
              <p className="safe-modal-sub">
                Target Job: <strong>{gig.title}</strong> • Budget: ₹{gig.budgetMin} - ₹{gig.budgetMax}
              </p>
            </div>
          </div>
          <button className="safe-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tier Selector: School Student, College Student, Professional Worker */}
        <div className="safe-tier-nav">
          <div className="safe-tier-label">Applicant Criteria Category:</div>
          <div className="safe-tier-buttons">
            <button
              type="button"
              className={`safe-tier-btn ${activeTier === 'school_student' ? 'active' : ''}`}
              onClick={() => setActiveTier('school_student')}
            >
              <UserCheck size={14} />
              <span>School Student (Under 18)</span>
            </button>
            <button
              type="button"
              className={`safe-tier-btn ${activeTier === 'college_student' ? 'active' : ''}`}
              onClick={() => setActiveTier('college_student')}
            >
              <GraduationCap size={14} />
              <span>College Student</span>
            </button>
            <button
              type="button"
              className={`safe-tier-btn ${activeTier === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTier('professional')}
            >
              <Briefcase size={14} />
              <span>Professional Worker</span>
            </button>
          </div>
        </div>

        {/* Night Work Warning banner if applicable */}
        {gig.isNightGig && (
          <div className="safe-alert-banner night-warning">
            <Clock size={16} color="#f59e0b" />
            <span>
              <strong>Night Shift Notice:</strong> This gig takes place during night hours (after 8:00 PM).
              {activeTier === 'school_student'
                ? ' School students cannot apply due to statutory minor curfew laws.'
                : ' Guardian/Emergency notification radar is activated for safe assignment.'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="safe-modal-form">
          {/* Rate & Proposal Section */}
          <div className="safe-form-row">
            <div className="safe-form-group rate-group">
              <label>Your Proposed Rate (₹) *</label>
              <div className="safe-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  min="50"
                  required
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  className="safe-input"
                  placeholder="Rate in INR"
                />
              </div>
            </div>
            <div className="safe-form-group">
              <label>Estimated Completion *</label>
              <input
                type="text"
                readOnly
                value={gig.duration || '2-3 Hours'}
                className="safe-input readonly"
              />
            </div>
          </div>

          <div className="safe-form-group">
            <label>Cover Pitch &amp; Qualification Notes *</label>
            <textarea
              rows={2}
              required
              value={proposalPitch}
              onChange={(e) => setProposalPitch(e.target.value)}
              placeholder={`Explain your experience, tools, and availability for "${gig.title}"...`}
              className="safe-textarea"
            />
          </div>

          {/* CRITERIA VERIFICATION CHECKLIST */}
          <div className="safe-criteria-section">
            <div className="safe-criteria-header">
              <div>
                <h4>
                  Required {activeTier === 'school_student' ? 'School Student' : activeTier === 'college_student' ? 'College Student' : 'Professional'} Safety Criteria
                </h4>
                <p className="safe-criteria-subtitle">
                  All criteria must be accepted before your proposal can be transmitted to the employer.
                </p>
              </div>
              <button
                type="button"
                className="safe-accept-all-btn"
                onClick={handleAcceptAll}
                disabled={hasBlockedCriteria}
              >
                <Check size={14} /> Accept All Criteria
              </button>
            </div>

            <div className="safe-criteria-list">
              {currentCriteriaList.map((crit) => {
                const IconComponent = crit.icon;
                const isChecked = !!acceptedCriteria[crit.id];
                const isBlocked = !!crit.isBlocked || (crit.isParentConsent && !parentConsentApproved);

                return (
                  <div
                    key={crit.id}
                    className={`safe-criteria-card ${isChecked ? 'accepted' : ''} ${isBlocked ? 'blocked' : ''}`}
                    onClick={() => !isBlocked && handleToggleCriteria(crit.id)}
                  >
                    <div className="safe-criteria-checkbox-wrap">
                      <input
                        type="checkbox"
                        id={crit.id}
                        checked={isChecked}
                        disabled={isBlocked}
                        onChange={() => handleToggleCriteria(crit.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="safe-criteria-icon-box">
                      <IconComponent size={18} />
                    </div>
                    <div className="safe-criteria-body">
                      <div className="safe-criteria-title-line">
                        <span className="crit-title">{crit.title}</span>
                        {crit.isBlocked ? (
                          <span className="crit-badge blocked">Legally Prohibited</span>
                        ) : crit.isPendingParent ? (
                          <span className="crit-badge pending" style={{ background: '#fef3c7', color: '#b45309' }}>
                            ⏳ Parent Approval Required
                          </span>
                        ) : isChecked ? (
                          <span className="crit-badge accepted">✓ Consent Approved by Parent</span>
                        ) : (
                          <span className="crit-badge pending">Requires Acceptance</span>
                        )}
                      </div>
                      <p className="crit-desc">{crit.desc}</p>

                      {/* Parent Consent Approval Button */}
                      {crit.isParentConsent && crit.isPendingParent && (
                        <div style={{ marginTop: '0.65rem' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveParentConsent();
                            }}
                            disabled={parentApproving}
                            style={{
                              background: '#f59e0b',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 14px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 5px rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <PhoneCall size={13} />
                            <span>
                              {parentApproving ? 'Verifying Consent...' : `Accept Message as Parent (${user?.guardian?.name || 'Suresh Kumar'})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress / Acceptance Tracker */}
          <div className="safe-progress-bar-wrap">
            <div className="safe-progress-info">
              <span>
                Safety Verification Progress: <strong>{acceptedCount} of {totalCount} Accepted</strong>
              </span>
              <span className={`safe-status-pill ${allCriteriaAccepted ? 'verified' : 'incomplete'}`}>
                {allCriteriaAccepted ? '✓ Safe to Apply' : 'Criteria Incomplete'}
              </span>
            </div>
            <div className="safe-progress-track">
              <div
                className="safe-progress-fill"
                style={{
                  width: `${(acceptedCount / totalCount) * 100}%`,
                  background: allCriteriaAccepted ? '#10b981' : '#3b82f6',
                }}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="safe-modal-footer">
            <button type="button" className="safe-btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={`safe-btn-submit ${allCriteriaAccepted ? 'enabled' : 'disabled'}`}
              disabled={!allCriteriaAccepted || isSubmitting}
            >
              {isSubmitting ? (
                <>Transmitting Proposal...</>
              ) : allCriteriaAccepted ? (
                <>
                  <ShieldCheck size={18} />
                  Submit Verified Application
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Accept All Criteria to Unlock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafeApplicationModal;
