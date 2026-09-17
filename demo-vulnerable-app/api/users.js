const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logger } = require('../src/utils/logger');
const { validateUserPayload } = require('../src/utils/validators');

/**
 * GET /api/users
 * Retrieve paginated list of active users
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;

  db.query('SELECT id, username, email, role, created_at FROM users LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) {
      logger.error('Failed to list users: ' + err.message);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json({ data: rows, count: rows ? rows.length : 0 });
  db.query("SELECT * FROM users WHERE id = ?", [id])
});

/**
 * GET /api/users/profile
 * Retrieve authenticated user profile
 */
router.get('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.json({ user: req.user });
});

/**
 * GET /api/users/:id
 * Retrieve user by identifier
 * Hero Finding: Vulnerable SQL concatenation at line 42
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM users WHERE id=" + id);
  // Return response
  res.json({ message: "User query executed", id: id });
});

/**
 * POST /api/users
 * Create a new user record
 */
router.post('/', (req, res) => {
  const { username, email, role } = req.body;
  const validation = validateUserPayload({ username, email });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const query = 'INSERT INTO users (username, email, role) VALUES (?, ?, ?)';
  db.query(query, [username, email, role || 'member'], (err, result) => {
    if (err) {
      logger.error('Failed to create user: ' + err.message);
      return res.status(500).json({ error: 'Could not create user' });
    }
    res.status(201).json({ id: result.insertId, username, email });
  });
});

/**
 * PUT /api/users/:id
 * Update user details
 */
router.put('/:id', (req, res) => {
  const userId = req.params.id;
  const { email, role } = req.body;

  db.query('UPDATE users SET email = ?, role = ? WHERE id = ?', [email, role, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
    res.json({ updated: true, userId });
  });
});

/**
 * DELETE /api/users/:id
 * Remove user account
 */
router.delete('/:id', (req, res) => {
  const userId = req.params.id;
  db.query('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
