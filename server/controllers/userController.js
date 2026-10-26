const User = require('../models/User');
const { calculateAge } = require('../utils/ageCalculator');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Get user profile with strict privacy projection
// @route   GET /api/users/:id
// @access  Public (for viewing public profiles) or Private
const getUserProfile = async (req, res) => {
  try {
    const isSelf =
      req.params.id === 'profile' ||
      req.params.id === 'me' ||
      (req.user && req.user._id.toString() === req.params.id);

    const targetId = isSelf ? req.user?._id : req.params.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (isSelf) {
      // Return full user profile for authenticated self
      const user = await User.findById(targetId)
        .select('-password -aadhaarHash -otpSecret -guardian.otp -passwordResetToken');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json(user);
    }

    // Public Profile Projection (Data Minimization: hide raw phone, aadhaar, emergency contacts, internal secrets)
    const publicUser = await User.findById(targetId).select(
      'name role bio skills experience availability address rating reviews profileImage kycStatus employerStatus isStudent studentVerificationStatus companyName'
    );

    if (publicUser) {
      res.json(publicUser);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile with backend validation and audit logging
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const targetId =
      req.params.id === 'profile' || req.params.id === 'me'
        ? req.user._id
        : req.params.id;

    const user = await User.findById(targetId);

    if (user) {
      // Ensure the logged-in user is updating their own profile
      if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
      }

      if (req.body.name !== undefined) user.name = String(req.body.name).trim();
      if (req.body.bio !== undefined) user.bio = String(req.body.bio).trim();
      if (req.body.phone !== undefined) user.phone = String(req.body.phone).trim();
      if (req.body.experience !== undefined) user.experience = Number(req.body.experience) || 0;
      if (req.body.availability !== undefined) user.availability = req.body.availability;
      if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;
      if (req.body.companyName !== undefined) user.companyName = String(req.body.companyName).trim();
      if (req.body.companyRegistration !== undefined) user.companyRegistration = String(req.body.companyRegistration).trim();

      // Handle Student DOB update
      if (req.body.dateOfBirth) {
        user.dateOfBirth = new Date(req.body.dateOfBirth);
        user.age = calculateAge(req.body.dateOfBirth);
      }

      // Handle address and location
      if (req.body.address !== undefined) {
        user.address = req.body.address;
        if (!user.location) user.location = { type: 'Point', coordinates: [77.5946, 12.9716] };
        user.location.address = req.body.address;
      }
      if (req.body.location !== undefined) {
        user.location = {
          ...(user.location?.toObject?.() || user.location),
          ...req.body.location,
        };
      }

      if (req.body.skills !== undefined) {
        user.skills = Array.isArray(req.body.skills)
          ? req.body.skills.map((s) => String(s).trim()).filter(Boolean)
          : typeof req.body.skills === 'string'
          ? req.body.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : user.skills;
      }

      if (req.body.userType !== undefined) user.userType = req.body.userType;
      if (req.body.purpose !== undefined) user.purpose = req.body.purpose;
      if (req.body.onboardingCompleted !== undefined) user.onboardingCompleted = Boolean(req.body.onboardingCompleted);
      if (req.body.country !== undefined) user.country = String(req.body.country).trim();

      // School Student Safeguard Fields
      if (req.body.school) {
        user.school = {
          name: req.body.school.name || user.school?.name || '',
          grade: req.body.school.grade || user.school?.grade || '',
          daytimeAvailability: req.body.school.daytimeAvailability || user.school?.daytimeAvailability || 'After School (3 PM - 7 PM)',
          generalServiceArea: req.body.school.generalServiceArea || user.school?.generalServiceArea || '',
          parentConsentVerified: req.body.school.parentConsentVerified !== undefined ? Boolean(req.body.school.parentConsentVerified) : user.school?.parentConsentVerified || false,
        };
      }

      // College Student Fields
      if (req.body.college) {
        user.college = {
          name: req.body.college.name || user.college?.name || '',
          course: req.body.college.course || user.college?.course || '',
          year: Number(req.body.college.year) || user.college?.year || 1,
          rollNumber: req.body.college.rollNumber || user.college?.rollNumber || '',
          studentIdDocUrl: req.body.college.studentIdDocUrl || user.college?.studentIdDocUrl || '',
        };
      }

      // Guardian & Safety Fields
      if (req.body.guardian) {
        user.guardian = {
          name: req.body.guardian.name || user.guardian?.name || '',
          phone: req.body.guardian.phone || user.guardian?.phone || '',
          relationship: req.body.guardian.relationship || user.guardian?.relationship || 'Parent',
          isVerified: req.body.guardian.isVerified !== undefined ? Boolean(req.body.guardian.isVerified) : user.guardian?.isVerified || false,
        };
      }
      if (req.body.emergencyContacts && Array.isArray(req.body.emergencyContacts)) {
        user.emergencyContacts = req.body.emergencyContacts;
      }
      if (req.body.maskedAadhaar) user.maskedAadhaar = req.body.maskedAadhaar;
      if (req.body.kycStatus) user.kycStatus = req.body.kycStatus;
      if (req.body.studentVerificationStatus) user.studentVerificationStatus = req.body.studentVerificationStatus;
      if (req.body.isStudent !== undefined) user.isStudent = Boolean(req.body.isStudent);

      // Professional Worker Fields
      if (req.body.certifications !== undefined) {
        user.certifications = Array.isArray(req.body.certifications) ? req.body.certifications : [];
      }
      if (req.body.portfolioLinks !== undefined) {
        user.portfolioLinks = Array.isArray(req.body.portfolioLinks) ? req.body.portfolioLinks : [];
      }
      if (req.body.expectedRate !== undefined) user.expectedRate = Number(req.body.expectedRate) || 0;
      if (req.body.rateType !== undefined) user.rateType = req.body.rateType;
      if (req.body.workArea !== undefined) user.workArea = String(req.body.workArea).trim();

      // Employer / Shop Fields
      if (req.body.businessCategory !== undefined) user.businessCategory = String(req.body.businessCategory).trim();
      if (req.body.businessLocation !== undefined) user.businessLocation = String(req.body.businessLocation).trim();

      const updatedUser = await user.save();
      const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';

      await logAuditEvent({
        user: user._id,
        action: 'PROFILE_UPDATED',
        status: 'SUCCESS',
        req,
      });

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        purpose: updatedUser.purpose,
        userType: updatedUser.userType,
        onboardingCompleted: updatedUser.onboardingCompleted,
        bio: updatedUser.bio || '',
        skills: updatedUser.skills || [],
        experience: updatedUser.experience ?? 0,
        availability: updatedUser.availability || 'available_today',
        profileImage: updatedUser.profileImage || '',
        address: updatedUser.address || updatedUser.location?.address || '',
        location: updatedUser.location,
        rating: updatedUser.rating || 5.0,
        isStudent: updatedUser.isStudent,
        age: updatedUser.age,
        school: updatedUser.school,
        college: updatedUser.college,
        guardian: updatedUser.guardian,
        certifications: updatedUser.certifications,
        portfolioLinks: updatedUser.portfolioLinks,
        expectedRate: updatedUser.expectedRate,
        rateType: updatedUser.rateType,
        workArea: updatedUser.workArea,
        companyName: updatedUser.companyName,
        companyRegistration: updatedUser.companyRegistration,
        businessCategory: updatedUser.businessCategory,
        businessLocation: updatedUser.businessLocation,
        kycStatus: updatedUser.kycStatus,
        maskedAadhaar: updatedUser.maskedAadhaar,
        employerStatus: updatedUser.employerStatus,
        studentVerificationStatus: updatedUser.studentVerificationStatus,
        savedGigs: updatedUser.savedGigs || [],
        token,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile };
