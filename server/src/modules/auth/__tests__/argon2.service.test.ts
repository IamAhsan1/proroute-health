import { describe, it, expect } from 'vitest';
import { Argon2Service } from '../argon2.service.js';

describe('Argon2Service', () => {
  const password = 'SecurePassword123!';

  it('should hash a password producing an argon2id signature', async () => {
    const hash = await Argon2Service.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
  });

  it('should verify matching plain text password against hash', async () => {
    const hash = await Argon2Service.hashPassword(password);
    const isValid = await Argon2Service.verifyPassword(hash, password);
    expect(isValid).toBe(true);
  });

  it('should reject non-matching passwords', async () => {
    const hash = await Argon2Service.hashPassword(password);
    const isValid = await Argon2Service.verifyPassword(hash, 'WrongPassword123!');
    expect(isValid).toBe(false);
  });
});
