const { validateUserPayload } = require('../src/utils/validators');

describe('User Validation Suite', () => {
  test('validates legitimate user payload', () => {
    const result = validateUserPayload({ username: 'alex_dev', email: 'alex@example.com' });
    expect(result.valid).toBe(true);
  });

  test('rejects malformed email', () => {
    const result = validateUserPayload({ username: 'alex_dev', email: 'not-an-email' });
    expect(result.valid).toBe(false);
  });

  test('rejects short username', () => {
    const result = validateUserPayload({ username: 'al', email: 'al@example.com' });
    expect(result.valid).toBe(false);
  });
});
