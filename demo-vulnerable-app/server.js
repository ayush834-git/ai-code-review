const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRoute = require('./api/users');
const searchRoute = require('./api/search');
const adminRoute = require('./api/admin');
const filesRoute = require('./api/files');
const { logger } = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Mount modular API routes
app.use('/api/users', usersRoute);
app.use('/api/search', searchRoute);
app.use('/api/admin', adminRoute);
app.use('/api/files', filesRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cloudpulse-api', uptime: process.uptime() });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
