const authService = require('../src/services/authService');

describe('Auth Service Suite', () => {
  test('generates and verifies JWT token', () => {
    const user = { id: 101, username: 'testuser', role: 'admin' };
    const token = authService.generateToken(user);
    expect(typeof token).toBe('string');

    const decoded = authService.verifyToken(token);
    expect(decoded.username).toBe(user.username);
    expect(decoded.role).toBe(user.role);
  });

  test('returns null on invalid token verification', () => {
    const invalid = authService.verifyToken('invalid.token.payload');
    expect(invalid).toBeNull();
  });
});
