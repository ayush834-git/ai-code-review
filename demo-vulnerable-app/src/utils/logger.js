const fs = require('fs');
const path = require('path');

const logLevels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

function formatLog(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

const logger = {
  info: (msg) => console.log(formatLog(logLevels.INFO, msg)),
  warn: (msg) => console.warn(formatLog(logLevels.WARN, msg)),
  error: (msg) => console.error(formatLog(logLevels.ERROR, msg)),
  debug: (msg) => {
    if (process.env.DEBUG) {
      console.debug(formatLog(logLevels.DEBUG, msg));
    }
  }
};

module.exports = { logger, logLevels };
