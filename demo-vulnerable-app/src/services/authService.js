const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_in_prod';

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      logger.warn('Invalid token attempt: ' + err.message);
      return null;
    }
  }
}

module.exports = new AuthService();
