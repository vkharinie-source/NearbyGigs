/**
 * Recursive sanitizer that removes any Object keys starting with '$' or containing '.'
 * to protect against NoSQL query selector injection attacks.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys starting with $ (e.g. $gt, $ne, $where) or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value && typeof value === 'object') {
      clean[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      // Trim excessive whitespace
      clean[key] = value.trim();
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = {
  mongoSanitize,
  sanitizeObject,
};
