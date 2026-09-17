const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { logger } = require('../src/utils/logger');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

/**
 * GET /api/files/download
 * File retrieval and download endpoint
 * Vulnerability 9: Path Traversal (Arbitrary File Read)
 */
router.get('/download', (req, res) => {
  const fileName = req.query.file;

  if (!fileName) {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  logger.info(`Requested file download: ${fileName}`);

  // Vulnerable: Direct path resolution without sanitizing '../'
  const filePath = path.join(UPLOADS_DIR, fileName);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.send(fileContent);
  } catch (err) {
    logger.error(`Error reading file: ${err.message}`);
    res.status(404).json({ error: 'File not found or inaccessible' });
  }
});

/**
 * GET /api/files/list
 * List exported system log files
 */
router.get('/list', (req, res) => {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      return res.json({ files: ['telemetry_2026.csv', 'audit_export.log'] });
    }
    res.json({ files });
  });
});

module.exports = router;
