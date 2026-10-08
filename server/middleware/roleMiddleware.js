const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const effectiveRoles = [req.user.role];
    if (req.user.role === 'both') effectiveRoles.push('worker', 'customer');
    if (req.user.role === 'student_worker') effectiveRoles.push('worker');
    if (req.user.role === 'employer') effectiveRoles.push('customer');

    const authorized = roles.some((r) => effectiveRoles.includes(r));

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks required permissions.`,
      });
    }

    next();
  };
};

module.exports = { checkRole };
