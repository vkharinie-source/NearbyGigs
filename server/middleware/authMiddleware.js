const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      }

      // Verify token
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: JWT_SECRET environment variable is missing!');
      }

      const decoded = jwt.verify(token, secret || 'nearbygigs_super_secret_jwt_key');

      // Fetch user with security projections (hide password, hashes, and internal secrets)
      const user = await User.findById(decoded.id)
        .select('-password -aadhaarHash -otpSecret -guardian.otp -passwordResetToken');

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid session. User account not found.' });
      }

      // Check account lockout
      if (user.isLocked()) {
        return res.status(403).json({
          success: false,
          message: 'Account is temporarily locked due to excessive failed attempts. Try again later.',
        });
      }

      // Check employer/worker suspension status
      if (user.employerStatus === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Account is suspended by platform administration.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid or malformed authentication token.' });
    }
  }

  return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userRole = req.user.role;

    // Admin has access to all roles
    if (userRole === 'admin') {
      return next();
    }

    // Handle 'both' role as worker/customer
    const effectiveRoles = [userRole];
    if (userRole === 'both') {
      effectiveRoles.push('worker', 'customer');
    }
    if (userRole === 'student_worker') {
      effectiveRoles.push('worker');
    }
    if (userRole === 'employer') {
      effectiveRoles.push('customer');
    }

    const hasPermission = roles.some((role) => effectiveRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
