const db = require('../../config/db');
const { logger } = require('../utils/logger');

class UserService {
  async findById(id) {
    return new Promise((resolve, reject) => {
      db.query('SELECT id, username, email, role FROM users WHERE id = ?', [id], (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows.length > 0 ? rows[0] : null);
      });
    });
  }

  async listUsers(options = {}) {
    const { limit = 25, offset = 0 } = options;
    return new Promise((resolve, reject) => {
      db.query('SELECT id, username, email, role, created_at FROM users LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  async countUsers() {
    return new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM users', (err, rows) => {
        if (err) return reject(err);
        resolve(rows && rows[0] ? rows[0].count : 0);
      });
    });
  }
}

module.exports = new UserService();
