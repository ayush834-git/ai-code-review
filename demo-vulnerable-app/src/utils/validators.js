/**
 * Input validation helpers
 */

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(username);
}

function validateUserPayload(payload) {
  if (!payload) return { valid: false, error: 'Empty payload' };
  if (!isValidUsername(payload.username)) {
    return { valid: false, error: 'Invalid username. Must be 3-30 alphanumeric characters.' };
  }
  if (!isValidEmail(payload.email)) {
    return { valid: false, error: 'Invalid email address format.' };
  }
  return { valid: true };
}

module.exports = {
  isValidEmail,
  isValidUsername,
  validateUserPayload
};
