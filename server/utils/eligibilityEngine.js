/**
 * Smart Profile Completion and Eligibility Engine
 * Evaluates job/gig eligibility based on age, student safeguards, skills,
 * experience, verification, safety policies, and lawful requirements.
 */

function evaluateEligibility(user, gig) {
  if (!user) {
    return {
      status: 'Requires Verification',
      isEligible: false,
      reasons: ['Please sign in to verify your job eligibility.'],
      summary: 'Sign in to check your eligibility for this job.',
      score: 0,
      breakdown: {
        ageCheck: { pass: false, note: 'Authentication required' },
        safetyCheck: { pass: false, note: 'Authentication required' },
        skillsCheck: { pass: false, note: 'Authentication required' },
        experienceCheck: { pass: false, note: 'Authentication required' },
        verificationCheck: { pass: false, note: 'Authentication required' },
      },
    };
  }

  const reasons = [];
  const missingRequirements = [];
  let isEligible = true;
  let requiresVerification = false;
  let additionalInfoRequired = false;
  let legallyProhibited = false;

  // 1. AGE & LEGAL RESTRICTIONS
  let userAge = user.age !== undefined && user.age !== null ? user.age : null;
  if (userAge === null && user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      userAge = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
    }
  }
  const gigMinAge = gig.minimumAge || gig.minAge || 18;

  let agePass = true;
  let ageNote = 'Age requirements satisfied';

  if (userAge !== null) {
    // Under 14: Strict statutory child labour prohibition
    if (userAge < 14) {
      isEligible = false;
      legallyProhibited = true;
      agePass = false;
      ageNote = 'Statutory Child Labour Law: Minimum age of 14 is required for any work.';
      reasons.push(ageNote);
    } else if (userAge < gigMinAge) {
      isEligible = false;
      agePass = false;
      ageNote = `This job requires a minimum age of ${gigMinAge} (your verified age is ${userAge}).`;
      reasons.push(ageNote);
    } else {
      reasons.push(`Age requirement verified (${userAge} >= ${gigMinAge} years).`);
    }
  } else {
    // Date of birth missing
    additionalInfoRequired = true;
    agePass = false;
    ageNote = 'Date of birth is required to verify legal age eligibility.';
    missingRequirements.push('dateOfBirth');
    reasons.push(ageNote);
  }

  // 2. STUDENT SAFEGUARDS & NIGHT WORK RESTRICTIONS
  let safetyPass = true;
  let safetyNote = 'Safe for your profile category';

  // Night gig detection: explicit flag OR start/end times between 20:00 and 06:00
  let isNight = Boolean(gig.isNightGig);
  if (!isNight && gig.startTime) {
    const hour = parseInt(gig.startTime.split(':')[0], 10);
    if (hour >= 20 || hour < 6) isNight = true;
  }
  if (!isNight && gig.endTime) {
    const endHour = parseInt(gig.endTime.split(':')[0], 10);
    if (endHour > 21 || endHour <= 6) isNight = true;
  }

  const isSchoolStudent = user.userType === 'school_student' || (userAge !== null && userAge < 18 && user.isStudent);

  if (isSchoolStudent) {
    if (isNight) {
      isEligible = false;
      legallyProhibited = true;
      safetyPass = false;
      safetyNote = 'Legal curfew restriction: School students and minors are not permitted to engage in late-night work.';
      reasons.push(safetyNote);
    } else if (!user.school?.parentConsentVerified && !user.guardian?.isVerified && !user.parentConsentVerified) {
      requiresVerification = true;
      safetyPass = false;
      safetyNote = 'Parent or guardian consent verification is required before minors can apply.';
      reasons.push(safetyNote);
      missingRequirements.push('guardianConsent');
    } else {
      reasons.push('School student daytime guidelines and verified guardian consent confirmed.');
    }
  } else if (user.isStudent && isNight) {
    if (!user.guardian?.isVerified && (!user.emergencyContacts || user.emergencyContacts.length === 0)) {
      requiresVerification = true;
      safetyPass = false;
      safetyNote = 'Night gig requirement: Verified guardian or emergency safety contact needed for alert dispatch.';
      reasons.push(safetyNote);
      missingRequirements.push('emergencyContact');
    } else {
      reasons.push('Night work safety active: Automated guardian/contact alerts will dispatch upon work start.');
    }
  }

  // 3. SKILLS MATCH
  let skillsPass = true;
  let skillsNote = 'All required skills matched';
  const jobSkills = Array.isArray(gig.requiredSkills)
    ? gig.requiredSkills
    : (Array.isArray(gig.skillsRequired) ? gig.skillsRequired : []);
  const userSkills = Array.isArray(user.skills) ? user.skills : [];

  let matchedSkills = [];
  if (jobSkills.length > 0) {
    const userSkillsLower = userSkills.map((s) => s.toLowerCase().trim());
    matchedSkills = jobSkills.filter((js) =>
      userSkillsLower.some((us) => us.includes(js.toLowerCase().trim()) || js.toLowerCase().trim().includes(us))
    );

    if (matchedSkills.length > 0) {
      reasons.push(`Matched skills: ${matchedSkills.join(', ')}.`);
    } else if (userSkills.length === 0) {
      additionalInfoRequired = true;
      skillsPass = false;
      skillsNote = `Job requires: ${jobSkills.join(', ')}. Please update your profile skills.`;
      missingRequirements.push('skills');
      reasons.push(skillsNote);
    } else {
      skillsPass = false;
      skillsNote = `Job prefers: ${jobSkills.join(', ')}. (You have: ${userSkills.slice(0, 3).join(', ')}).`;
      reasons.push(skillsNote);
    }
  } else {
    reasons.push('No mandatory specialized skills required.');
  }

  // 4. EXPERIENCE CHECK
  let expPass = true;
  let expNote = 'Experience requirement met';
  const reqExp = gig.requiredExperience || 0;
  const userExp = user.experience || 0;

  if (reqExp > 0) {
    if (userExp >= reqExp) {
      reasons.push(`Experience verified: ${userExp} yrs (requires ${reqExp} yrs).`);
    } else {
      expPass = false;
      expNote = `Requires at least ${reqExp} year(s) of experience (profile has ${userExp} yrs).`;
      reasons.push(expNote);
    }
  }

  // 5. VERIFICATION STATUS (CATEGORY-SPECIFIC DOCUMENT & IDENTITY VERIFICATION)
  let verifyPass = true;
  let verifyNote = 'Category document verification confirmed';

  if (user.userType === 'school_student') {
    const guardianOk = Boolean(user.guardian?.isVerified || user.school?.parentConsentVerified);
    if (!guardianOk) {
      requiresVerification = true;
      verifyPass = false;
      verifyNote = 'Parent/Guardian consent verification is required before school students can apply.';
      missingRequirements.push('guardianConsent');
      reasons.push(verifyNote);
    }
  } else if (user.userType === 'college_student') {
    if (user.studentVerificationStatus !== 'verified') {
      requiresVerification = true;
      verifyPass = false;
      verifyNote = 'College student ID and enrollment document verification is pending review.';
      missingRequirements.push('collegeVerification');
      reasons.push(verifyNote);
    }
  } else if (user.userType === 'teacher') {
    if (user.teacher?.verificationStatus !== 'verified') {
      requiresVerification = true;
      verifyPass = false;
      verifyNote = 'Teacher educational qualifications and teaching credentials verification is pending review.';
      missingRequirements.push('teacherCredentials');
      reasons.push(verifyNote);
    }
  } else if (user.userType === 'graduate') {
    if (user.graduate?.verificationStatus !== 'verified' && user.kycStatus !== 'verified') {
      requiresVerification = true;
      verifyPass = false;
      verifyNote = 'Graduate degree documents and identity verification are pending review.';
      missingRequirements.push('graduateDegreeVerification');
      reasons.push(verifyNote);
    }
  } else {
    // Professional worker / general worker
    if (user.kycStatus !== 'verified' && user.professionalVerificationStatus !== 'verified') {
      requiresVerification = true;
      verifyPass = false;
      verifyNote = 'Identity verification (masked Aadhaar KYC / Professional credentials) is required before applying.';
      missingRequirements.push('kycVerification');
      reasons.push(verifyNote);
    }
  }

  // 6. EMPLOYER STATUS CONTEXT
  if (gig.postedBy?.employerStatus === 'VERIFIED') {
    reasons.push('Employer identity is verified on NearbyGigs.');
  }

  // DETERMINE FINAL OVERALL STATUS
  let finalStatus = 'Eligible to Apply';

  if (legallyProhibited || (!agePass && userAge !== null && userAge < gigMinAge)) {
    finalStatus = 'Not Eligible for This Job';
    isEligible = false;
  } else if (additionalInfoRequired) {
    finalStatus = 'Additional Information Required';
    isEligible = false;
  } else if (requiresVerification) {
    finalStatus = 'Requires Verification';
    isEligible = false;
  } else if (!skillsPass && jobSkills.length > 0 && matchedSkills.length === 0) {
    // If skills don't match at all
    finalStatus = 'Additional Information Required';
    isEligible = false;
  } else {
    finalStatus = 'Eligible to Apply';
    isEligible = true;
  }

  // Generate an informative, human-readable summary
  let summary = '';
  if (finalStatus === 'Eligible to Apply') {
    summary = `You are eligible to apply. Your profile matches this job's criteria and safety guidelines.`;
  } else if (finalStatus === 'Requires Verification') {
    summary = `Your profile matches key qualifications, but requires verification (${missingRequirements.join(', ') || 'KYC / Student'}) before submitting a proposal.`;
  } else if (finalStatus === 'Additional Information Required') {
    summary = `Please complete your profile details (${missingRequirements.join(', ') || 'skills / DOB'}) to apply.`;
  } else {
    summary = reasons.find((r) => r.includes('Statutory') || r.includes('curfew') || r.includes('minimum age')) ||
      'You do not meet the legal or policy requirements for this job.';
  }

  return {
    status: finalStatus,
    isEligible,
    reasons,
    summary,
    missingRequirements,
    breakdown: {
      ageCheck: { pass: agePass, note: ageNote },
      safetyCheck: { pass: safetyPass, note: safetyNote },
      skillsCheck: { pass: skillsPass, note: skillsNote, matchedSkills },
      experienceCheck: { pass: expPass, note: expNote },
      verificationCheck: { pass: verifyPass, note: verifyNote },
    },
  };
}

module.exports = { evaluateEligibility };
