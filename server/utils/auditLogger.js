const AuditLog = require('../models/AuditLog');

/**
 * Strips sensitive keys like password, token, aadhaar, otp from metadata before saving to audit logs.
 */
function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};
  const cleaned = { ...metadata };
  const sensitiveKeys = [
    'password',
    'confirmPassword',
    'token',
    'jwt',
    'aadhaar',
    'otp',
    'otpSecret',
    'secret',
    'authorization',
  ];

  for (const key of Object.keys(cleaned)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

/**
 * Log a critical platform event safely to MongoDB.
 * @param {Object} param0
 */
async function logAuditEvent({
  user,
  action,
  status = 'SUCCESS',
  req,
  resourceType,
  resourceId,
  metadata = {},
}) {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'unknown'
      : 'system';
    const userAgent = req ? req.headers['user-agent'] || 'unknown' : 'system';
    const userId = user || req?.user?._id;

    await AuditLog.create({
      user: userId,
      action,
      status,
      ipAddress: String(ipAddress).slice(0, 50),
      userAgent: String(userAgent).slice(0, 200),
      resourceType,
      resourceId,
      metadata: sanitizeMetadata(metadata),
    });
  } catch (err) {
    // Non-blocking catch to prevent application flow interruption
    console.error('Audit log write notice:', err.message);
  }
}

module.exports = {
  logAuditEvent,
};
