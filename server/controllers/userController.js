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
        kycStatus: updatedUser.kycStatus,
        maskedAadhaar: updatedUser.maskedAadhaar,
        employerStatus: updatedUser.employerStatus,
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
