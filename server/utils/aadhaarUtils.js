const crypto = require('crypto');

/**
 * Validates 12-digit Indian Aadhaar number format
 * @param {string} aadhaar 
 * @returns {boolean}
 */
function isValidAadhaarFormat(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') return false;
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  return /^[2-9]{1}[0-9]{11}$/.test(cleaned);
}

/**
 * Mask Aadhaar number to display only the last 4 digits (e.g. XXXX-XXXX-1234)
 * NEVER store the full Aadhaar in plain text.
 * @param {string} aadhaar 
 * @returns {string}
 */
function maskAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') return '';
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  if (cleaned.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = cleaned.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Compute SHA-256 hash for identity uniqueness checking without storing raw Aadhaar.
 * @param {string} aadhaar 
 * @returns {string}
 */
function hashAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== 'string') return '';
  const cleaned = aadhaar.replace(/[\s-]/g, '');
  const salt = process.env.AADHAAR_HASH_SALT || 'nearbygigs_privacy_salt_2026';
  return crypto.createHmac('sha256', salt).update(cleaned).digest('hex');
}

/**
 * Generate a random KYC verification reference ID (e.g. KYC-8F4A-9012)
 * @returns {string}
 */
function generateKycReference() {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KYC-NG-${Date.now().toString().slice(-6)}-${rand}`;
}

module.exports = {
  isValidAadhaarFormat,
  maskAadhaar,
  hashAadhaar,
  generateKycReference,
};
