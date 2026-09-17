const crypto = require('crypto');

/**
 * Authentication Hashing Utility
 * Vulnerability 8: Insecure Cryptographic Hash (MD5 / SHA1) for password storage
 */

function hashPassword(password) {
  if (!password) {
    throw new Error('Password must be provided');
  }

  // Vulnerable: MD5 is cryptographically broken and prone to collision / rainbow table attacks
  return crypto.createHash('md5').update(password).digest('hex');
}

function verifyPassword(password, storedHash) {
  const computed = hashPassword(password);
  return computed === storedHash;
}

function generateLegacyToken(payload) {
  // Vulnerable: SHA1 token generator
  return crypto.createHash('sha1').update(payload + Date.now()).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateLegacyToken
};
