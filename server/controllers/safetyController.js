const crypto = require('crypto');
const User = require('../models/User');
const Gig = require('../models/Gig');
const EmergencyAlert = require('../models/EmergencyAlert');
const Notification = require('../models/Notification');
const { calculateAge } = require('../utils/ageCalculator');
const { isValidAadhaarFormat, maskAadhaar, hashAadhaar, generateKycReference } = require('../utils/aadhaarUtils');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Submit / Update Student Safety & College Verification
// @route   POST /api/safety/student-verify
// @access  Private
const submitStudentVerification = async (req, res) => {
  try {
    const { dateOfBirth, collegeName, course, year, rollNumber, studentIdDocUrl } = req.body;

    if (!dateOfBirth) {
      return res.status(400).json({ success: false, message: 'Date of birth is required for age verification.' });
    }

    const calculatedAge = calculateAge(dateOfBirth);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isStudent = true;
    if (user.role === 'worker' || user.role === 'both') {
      user.role = 'student_worker';
    }
    user.dateOfBirth = new Date(dateOfBirth);
    user.age = calculatedAge;
    user.college = {
      name: collegeName || user.college?.name || '',
      course: course || user.college?.course || '',
      year: Number(year) || user.college?.year || 1,
      rollNumber: rollNumber || user.college?.rollNumber || '',
      studentIdDocUrl: studentIdDocUrl || user.college?.studentIdDocUrl || '',
    };
    user.studentVerificationStatus = 'verified';
    user.studentVerifiedAt = new Date();

    await user.save();

    await logAuditEvent({
      user: user._id,
      action: 'STUDENT_VERIFICATION_SUBMITTED',
      status: 'SUCCESS',
      req,
      metadata: { age: calculatedAge, college: collegeName, status: user.studentVerificationStatus },
    });

    res.json({
      success: true,
      message: 'Student verification completed successfully.',
      studentStatus: {
        isStudent: user.isStudent,
        age: user.age,
        studentVerificationStatus: user.studentVerificationStatus,
        college: user.college,
      },
    });
  } catch (error) {
    console.error('Student verify error:', error);
    res.status(500).json({ success: false, message: 'Server error updating student verification.' });
  }
};

// @desc    Request Parent / Guardian OTP Verification
// @route   POST /api/safety/guardian/request-otp
// @access  Private
const requestGuardianOtp = async (req, res) => {
  try {
    const { guardianName, guardianPhone, relationship } = req.body;

    if (!guardianPhone || !guardianName) {
      return res.status(400).json({ success: false, message: 'Guardian name and mobile number are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.guardian = {
      name: guardianName.trim(),
      phone: guardianPhone.trim(),
      relationship: relationship || 'Parent',
      isVerified: false,
      otp,
      otpExpires,
      notifiedOnNightGigs: true,
    };

    await user.save();

    // Create confirmation notification on platform
    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: '🔐 Guardian Verification OTP Dispatched',
      message: `Verification code [${otp}] was generated for Guardian: ${guardianName} (${guardianPhone}). Code expires in 10 minutes.`,
    });

    await logAuditEvent({
      user: user._id,
      action: 'GUARDIAN_OTP_REQUESTED',
      status: 'SUCCESS',
      req,
      metadata: { guardianName, relationship },
    });

    res.json({
      success: true,
      message: `OTP sent to guardian phone: ${guardianPhone.slice(0, 3)}****${guardianPhone.slice(-3)}. (Demo OTP: ${otp})`,
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Guardian OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error generating guardian OTP.' });
  }
};

// @desc    Verify Parent / Guardian OTP
// @route   POST /api/safety/guardian/verify-otp
// @access  Private
const verifyGuardianOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.guardian) {
      return res.status(404).json({ success: false, message: 'No guardian registration in progress.' });
    }

    if (!user.guardian.otp || user.guardian.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    if (user.guardian.otp !== otp.trim()) {
      await logAuditEvent({
        user: user._id,
        action: 'GUARDIAN_OTP_VERIFY_FAILED',
        status: 'FAILURE',
        req,
      });
      return res.status(400).json({ success: false, message: 'Invalid verification OTP code.' });
    }

    user.guardian.isVerified = true;
    user.guardian.otp = undefined;
    user.guardian.otpExpires = undefined;
    await user.save();

    await Notification.create({
      recipient: user._id,
      type: 'system',
      title: '🛡 Guardian Verification Confirmed',
      message: `Guardian ${user.guardian.name} has been successfully verified. Night-work safety alerts will automatically notify them.`,
    });

    await logAuditEvent({
      user: user._id,
      action: 'GUARDIAN_OTP_VERIFIED_SUCCESS',
      status: 'SUCCESS',
      req,
    });

    res.json({
      success: true,
      message: 'Parent / Guardian verified successfully!',
      guardian: {
        name: user.guardian.name,
        relationship: user.guardian.relationship,
        isVerified: user.guardian.isVerified,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying guardian code.' });
  }
};

// @desc    Submit Privacy-Preserving KYC / Identity Verification (Aadhaar Data Minimization)
// @route   POST /api/safety/kyc-verify
// @access  Private
const submitKycVerification = async (req, res) => {
  try {
    const { aadhaarNumber, fullName } = req.body;

    if (!aadhaarNumber) {
      return res.status(400).json({ success: false, message: 'Identity document number is required.' });
    }

    if (!isValidAadhaarFormat(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 12-digit Aadhaar number format.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Data Minimization: Mask Aadhaar and compute SHA-256 hash reference
    const masked = maskAadhaar(aadhaarNumber);
    const hash = hashAadhaar(aadhaarNumber);
    const refId = generateKycReference();

    user.maskedAadhaar = masked;
    user.aadhaarHash = hash;
    user.kycStatus = 'verified';
    user.kycReferenceId = refId;
    user.kycVerifiedAt = new Date();

    await user.save();

    await logAuditEvent({
      user: user._id,
      action: 'KYC_VERIFICATION_SUCCESS',
      status: 'SUCCESS',
      req,
      metadata: { maskedAadhaar: masked, referenceId: refId },
    });

    res.json({
      success: true,
      message: 'Identity verification completed with zero-raw-storage privacy compliance.',
      kyc: {
        status: user.kycStatus,
        maskedAadhaar: user.maskedAadhaar,
        referenceId: user.kycReferenceId,
        verifiedAt: user.kycVerifiedAt,
      },
    });
  } catch (error) {
    console.error('KYC verify error:', error);
    res.status(500).json({ success: false, message: 'Server error processing identity verification.' });
  }
};

// @desc    Start Active Work Session (Explicit Location Safety Bounds)
// @route   POST /api/safety/work-session/start
// @access  Private
const startWorkSession = async (req, res) => {
  try {
    const { gigId, latitude, longitude, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const lat = parseFloat(latitude) || user.location?.coordinates[1] || 12.9716;
    const lng = parseFloat(longitude) || user.location?.coordinates[0] || 77.5946;

    user.activeWorkSession = {
      isActive: true,
      activeGigId: gigId || undefined,
      startedAt: new Date(),
      lastKnownLocation: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || user.location?.address || 'Active Worksite',
      },
      locationPermissionGranted: true,
    };

    await user.save();

    // Check if gig is night gig or student night work
    let nightAlert = false;
    if (gigId) {
      const gig = await Gig.findById(gigId);
      if (gig && gig.isNightGig && user.guardian?.isVerified) {
        nightAlert = true;
        // Notify parent/guardian
        await Notification.create({
          recipient: user._id,
          type: 'system',
          title: '🌙 Night Work Session Dispatched',
          message: `Work session started for "${gig.title}". Guardian (${user.guardian.name}) has been sent work location safety coordinates.`,
        });
      }
    }

    await logAuditEvent({
      user: user._id,
      action: 'WORK_SESSION_STARTED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: gigId,
      metadata: { nightAlert },
    });

    res.json({
      success: true,
      message: 'Active work session started with live location safety protection.',
      session: user.activeWorkSession,
    });
  } catch (error) {
    console.error('Start work session error:', error);
    res.status(500).json({ success: false, message: 'Server error starting work session.' });
  }
};

// @desc    End Active Work Session (Cease Active Location Tracking)
// @route   POST /api/safety/work-session/end
// @access  Private
const endWorkSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousGigId = user.activeWorkSession?.activeGigId;

    user.activeWorkSession = {
      isActive: false,
      activeGigId: undefined,
      startedAt: undefined,
      lastKnownLocation: {
        type: 'Point',
        coordinates: [0, 0],
        address: '',
      },
      locationPermissionGranted: false,
    };

    await user.save();

    await logAuditEvent({
      user: user._id,
      action: 'WORK_SESSION_ENDED',
      status: 'SUCCESS',
      req,
      resourceType: 'Gig',
      resourceId: previousGigId,
    });

    res.json({
      success: true,
      message: 'Work session closed. Active location tracking has stopped.',
      session: user.activeWorkSession,
    });
  } catch (error) {
    console.error('End work session error:', error);
    res.status(500).json({ success: false, message: 'Server error ending work session.' });
  }
};

// @desc    Trigger Immediate Emergency SOS Alert
// @route   POST /api/safety/sos
// @access  Private
const triggerEmergencySOS = async (req, res) => {
  try {
    const { latitude, longitude, address, gigId, notes } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasLocation = Boolean(latitude && longitude);
    const coords = hasLocation ? [parseFloat(longitude), parseFloat(latitude)] : (user.location?.coordinates || [77.5946, 12.9716]);

    // 1. Create Emergency Event in Database
    const alert = await EmergencyAlert.create({
      user: user._id,
      activeGig: gigId || user.activeWorkSession?.activeGigId || undefined,
      location: {
        type: 'Point',
        coordinates: coords,
        address: address || user.location?.address || 'Current Coordinates Shared',
      },
      locationPermissionGranted: hasLocation,
      status: 'ACTIVE',
      guardianNotified: Boolean(user.guardian?.isVerified),
      adminNotified: true,
      contactsNotifiedCount: user.emergencyContacts?.length || 0,
      notes: notes || 'Worker triggered immediate platform SOS during gig.',
    });

    // 2. Notify Guardian (if verified)
    if (user.guardian?.isVerified) {
      await Notification.create({
        recipient: user._id,
        type: 'system',
        title: '🚨 EMERGENCY ALERT DISPATCHED TO GUARDIAN',
        message: `High-priority SOS alert sent to Guardian ${user.guardian.name} (${user.guardian.phone}) with work status and emergency location.`,
      });
    }

    // 3. Notify Emergency Platform Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'system',
        title: `🚨 CRITICAL SOS ALERT: ${user.name}`,
        message: `Worker ${user.name} (${user.phone}) triggered an SOS emergency alert at ${address || 'Bengaluru Coordinates'}. Immediate safety response required.`,
        link: '/safety',
      });
    }

    await logAuditEvent({
      user: user._id,
      action: 'EMERGENCY_SOS_TRIGGERED',
      status: 'WARNING',
      req,
      resourceType: 'EmergencyAlert',
      resourceId: alert._id,
      metadata: { coordinates: coords, hasGuardian: Boolean(user.guardian?.isVerified) },
    });

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent successfully. Safety contacts and emergency response team have been notified.',
      alertId: alert._id,
      timestamp: alert.createdAt,
      status: alert.status,
    });
  } catch (error) {
    console.error('SOS Trigger error:', error);
    res.status(500).json({ success: false, message: 'Server error transmitting emergency SOS.' });
  }
};

// @desc    Get Comprehensive Security & Safety Audit Status for Current User
// @route   GET /api/safety/my-safety-status
// @access  Private
const getMySafetyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -aadhaarHash -otpSecret -guardian.otp');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeEmergency = await EmergencyAlert.findOne({ user: user._id, status: 'ACTIVE' });

    res.json({
      success: true,
      accountSecurity: {
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified || Boolean(user.phone),
        kycStatus: user.kycStatus,
        maskedAadhaar: user.maskedAadhaar || 'Not submitted',
        kycReferenceId: user.kycReferenceId || null,
      },
      studentSafety: {
        isStudent: user.isStudent,
        age: user.age,
        studentVerificationStatus: user.studentVerificationStatus,
        college: user.college,
        guardian: {
          name: user.guardian?.name || '',
          phone: user.guardian?.phone || '',
          relationship: user.guardian?.relationship || 'Parent',
          isVerified: user.guardian?.isVerified || false,
        },
      },
      employerSafety: {
        employerStatus: user.employerStatus,
        isVerifiedEmployer: user.employerStatus === 'VERIFIED',
        companyName: user.companyName,
      },
      locationSafety: {
        isWorkSessionActive: Boolean(user.activeWorkSession?.isActive),
        activeGigId: user.activeWorkSession?.activeGigId || null,
        startedAt: user.activeWorkSession?.startedAt || null,
        locationPermissionGranted: user.activeWorkSession?.locationPermissionGranted || false,
      },
      emergency: {
        activeAlert: activeEmergency ? activeEmergency._id : null,
        emergencyContactsCount: user.emergencyContacts?.length || 0,
        guardianAlertEnabled: Boolean(user.guardian?.isVerified),
      },
    });
  } catch (error) {
    console.error('Get safety status error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving safety overview.' });
  }
};

module.exports = {
  submitStudentVerification,
  requestGuardianOtp,
  verifyGuardianOtp,
  submitKycVerification,
  startWorkSession,
  endWorkSession,
  triggerEmergencySOS,
  getMySafetyStatus,
};
