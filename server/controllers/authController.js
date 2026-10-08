const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { calculateAge } = require('../utils/ageCalculator');
const { logAuditEvent } = require('../utils/auditLogger');

// Password complexity regex: Minimum 6 characters (recommended 8+)
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      skills,
      location,
      // Student details
      isStudent,
      dateOfBirth,
      college,
      // Employer details
      companyName,
      companyRegistration,
    } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Validate role
    const allowedRoles = ['customer', 'worker', 'student_worker', 'employer', 'both', 'admin'];
    const chosenRole = role && allowedRoles.includes(role) ? role : 'customer';

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
    }

    // Student processing & age calculation
    let calculatedAge = undefined;
    let studentStatus = 'unverified';
    if (dateOfBirth) {
      calculatedAge = calculateAge(dateOfBirth);
    }
    const isStudentUser = Boolean(isStudent || chosenRole === 'student_worker');
    if (isStudentUser && college?.name) {
      studentStatus = 'pending';
    }

    // Build user document
    const userData = {
      name: name?.trim() || 'NearbyGig User',
      email: normalizedEmail,
      password,
      phone: phone?.trim() || '',
      role: isStudentUser && chosenRole === 'worker' ? 'student_worker' : chosenRole,
      skills: Array.isArray(skills)
        ? skills
        : skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      location: location || { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Bengaluru, Karnataka' },
      isStudent: isStudentUser,
      dateOfBirth: dateOfBirth || undefined,
      age: calculatedAge,
      college: college || { name: '', course: '', year: 1, rollNumber: '' },
      studentVerificationStatus: studentStatus,
      employerStatus: chosenRole === 'employer' ? 'PENDING' : 'VERIFIED',
      companyName: companyName || '',
      companyRegistration: companyRegistration || '',
    };

    const user = await User.create(userData);

    if (user) {
      const token = generateToken(user._id);

      await logAuditEvent({
        user: user._id,
        action: 'REGISTER_SUCCESS',
        status: 'SUCCESS',
        req,
        metadata: { role: user.role, isStudent: user.isStudent },
      });

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isStudent: user.isStudent,
          age: user.age,
          kycStatus: user.kycStatus,
          employerStatus: user.employerStatus,
          studentVerificationStatus: user.studentVerificationStatus,
        },
        token,
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user registration data.' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server Error during registration.' });
  }
};

// @desc    Auth user & get token with account lock protection
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await logAuditEvent({
        action: 'LOGIN_FAILURE',
        status: 'FAILURE',
        req,
        metadata: { email: normalizedEmail, reason: 'User not found' },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await logAuditEvent({
        user: user._id,
        action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
        status: 'WARNING',
        req,
      });
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed logins. Please try again in ${remainingMinutes} minute(s).`,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await user.save();

      await logAuditEvent({
        user: user._id,
        action: 'LOGIN_FAILED_PASSWORD_MISMATCH',
        status: 'FAILURE',
        req,
        metadata: { attempts: user.failedLoginAttempts },
      });

      return res.status(401).json({
        success: false,
        message:
          user.failedLoginAttempts >= 5
            ? 'Account locked for 15 minutes due to multiple failed login attempts.'
            : 'Invalid email or password.',
      });
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    const token = generateToken(user._id);

    await logAuditEvent({
      user: user._id,
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      req,
    });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        rating: user.rating,
        isStudent: user.isStudent,
        age: user.age,
        kycStatus: user.kycStatus,
        maskedAadhaar: user.maskedAadhaar,
        employerStatus: user.employerStatus,
        studentVerificationStatus: user.studentVerificationStatus,
        guardian: {
          name: user.guardian?.name || '',
          isVerified: user.guardian?.isVerified || false,
        },
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server Error during authentication.' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -aadhaarHash -otpSecret -guardian.otp -passwordResetToken');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Change password with verification of current password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      await logAuditEvent({
        user: user._id,
        action: 'PASSWORD_CHANGE_FAILED',
        status: 'FAILURE',
        req,
      });
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    await logAuditEvent({
      user: user._id,
      action: 'PASSWORD_CHANGE_SUCCESS',
      status: 'SUCCESS',
      req,
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating password.' });
  }
};

module.exports = { registerUser, loginUser, getMe, changePassword };
