const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { logger } = require('../src/utils/logger');

/**
 * GET /api/search
 * Search across system products, catalog, and inventory items
 * Vulnerability 2: SQL Injection via raw query interpolation
 */
router.get('/', (req, res) => {
  const term = req.query.q || '';
  const category = req.query.category || 'all';

  logger.info(`Executing search for query: "${term}" in category: "${category}"`);

  // Vulnerable SQL query construction
  const query = "SELECT * FROM products WHERE name LIKE '%" + term + "%' AND status = 'active'";

  db.query(query, (err, results) => {
    if (err) {
      logger.error('Search query failed: ' + err.message);
      return res.status(500).json({ error: 'Search failed' });
    }
    res.json({ results, count: results ? results.length : 0, query: term });
  });
});

/**
 * GET /api/search/suggestions
 * Fetch autocomplete suggestions
 */
router.get('/suggestions', (req, res) => {
  const prefix = req.query.prefix || '';
  db.query('SELECT name FROM products WHERE name LIKE ? LIMIT 5', [`${prefix}%`], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Autocomplete failed' });
    }
    res.json({ suggestions: rows ? rows.map(r => r.name) : [] });
  });
});

module.exports = router;
