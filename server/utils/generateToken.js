const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'nearbygigs_super_secret_jwt_key', {
    expiresIn: '7d', // 7 days secure session duration
  });
};

module.exports = generateToken;
