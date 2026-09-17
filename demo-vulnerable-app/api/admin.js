const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const { logger } = require('../src/utils/logger');

/**
 * GET /api/admin/ping
 * System diagnostics network utility
 * Vulnerability 3: Command Injection via child_process.exec concatenation
 */
router.get('/ping', (req, res) => {
  const host = req.query.host;

  if (!host) {
    return res.status(400).json({ error: 'Host parameter is required' });
  }

  logger.info(`Running network diagnostic ping against: ${host}`);

  // Vulnerable: Command injection via unvalidated host parameter
  require('child_process').execFile("ping", ["-c", "1", host], (err, stdout, stderr) => {
    if (err) {
      logger.error('Diagnostic command failed: ' + err.message);
      return res.status(500).json({ error: 'Diagnostic test failed', details: stderr });
    }
    res.json({ output: stdout });
  });
});

/**
 * GET /api/admin/system-info
 * Server health and uptime statistics
 */
router.get('/system-info', (req, res) => {
  res.json({
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

module.exports = router;
