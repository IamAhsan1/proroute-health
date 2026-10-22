import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { Argon2Service } from '../argon2.service.js';
import { Role } from '@prisma/client';

describe('Brute-Force & Account Lockout Defenses', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const testUserEmail = 'doctor.lockout@example.com';
  const correctPassword = 'StrongPassword123!';
  const wrongPassword = 'WrongPassword999!';

  const createMockUser = (overrides: Partial<UserWithProfile> = {}): UserWithProfile => ({
    id: 'uuid-lockout-1',
    email: testUserEmail,
    passwordHash: '',
    googleId: null,
    role: Role.DOCTOR,
    status: 'ACTIVE',
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    failedLoginAttempts: 0,
    lockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: null,
    professional: null,
    ...overrides,
  });

  it('should lock user out after 5 consecutive failed login attempts', async () => {
    const passwordHash = await Argon2Service.hashPassword(correctPassword);
    let attemptsCount = 0;
    let currentLockUntil: Date | null = null;

    vi.spyOn(authRepository, 'findUserByEmail').mockImplementation(async () =>
      createMockUser({
        passwordHash,
        failedLoginAttempts: attemptsCount,
        lockUntil: currentLockUntil,
      })
    );

    const incrementSpy = vi.spyOn(authRepository, 'incrementFailedLoginAttempts').mockImplementation(
      async (_userId: string, lockUntil?: Date) => {
        attemptsCount++;
        if (lockUntil) {
          currentLockUntil = lockUntil;
        }
        return {} as any;
      }
    );

    // Attempts 1 to 4: wrong password -> 401 Unauthorized
    for (let i = 1; i <= 4; i++) {
      const res = await request(app).post('/api/auth/login').send({
        email: testUserEmail,
        password: wrongPassword,
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid email or password');
    }
    expect(incrementSpy).toHaveBeenCalledTimes(4);
    expect(currentLockUntil).toBeNull();

    // Attempt 5: triggers lockout
    const res5 = await request(app).post('/api/auth/login').send({
      email: testUserEmail,
      password: wrongPassword,
    });
    expect(res5.status).toBe(401);
    expect(incrementSpy).toHaveBeenCalledTimes(5);
    expect(currentLockUntil).not.toBeNull();
    expect(currentLockUntil!.getTime()).toBeGreaterThan(Date.now());

    // Attempt 6 (while locked): returns 403 Forbidden even with correct password
    const res6 = await request(app).post('/api/auth/login').send({
      email: testUserEmail,
      password: correctPassword,
    });
    expect(res6.status).toBe(403);
    expect(res6.body.error).toContain('Account is temporarily locked');
  });

  it('should reset failed login counter upon successful authentication', async () => {
    const passwordHash = await Argon2Service.hashPassword(correctPassword);

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(
      createMockUser({
        passwordHash,
        failedLoginAttempts: 3,
      })
    );

    const resetSpy = vi.spyOn(authRepository, 'resetFailedLoginAttempts').mockResolvedValue({} as any);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'uuid-token-reset',
      tokenHash: 'hash',
      userId: 'uuid-lockout-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testUserEmail,
      password: correctPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(resetSpy).toHaveBeenCalledWith('uuid-lockout-1');
  });

  it('should allow login if previous lockout has expired', async () => {
    const passwordHash = await Argon2Service.hashPassword(correctPassword);
    const expiredLock = new Date(Date.now() - 60 * 1000); // 1 minute in past

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(
      createMockUser({
        passwordHash,
        failedLoginAttempts: 5,
        lockUntil: expiredLock,
      })
    );

    const resetSpy = vi.spyOn(authRepository, 'resetFailedLoginAttempts').mockResolvedValue({} as any);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'uuid-token-reset-2',
      tokenHash: 'hash',
      userId: 'uuid-lockout-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testUserEmail,
      password: correctPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(resetSpy).toHaveBeenCalledWith('uuid-lockout-1');
  });
});
