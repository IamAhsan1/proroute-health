import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app.js';
import { authRepository } from '../auth.repository.js';
import { userRepository } from '../../users/user.repository.js';
import { Role } from '@prisma/client';
import { config } from '../../../config/index.js';
import {
  setUserRevokedBefore,
  getUserRevokedBefore,
  clearInMemoryRevokedBeforeStore,
} from '../../../lib/redis.js';

describe('Instant JWT Token Revocation & Global Logout (SEC-02, APT-04)', () => {
  const app = createApp();

  const userId = 'user-instant-revocation-1';
  const userPayload = {
    id: userId,
    email: 'patient.revoked@example.com',
    role: Role.PATIENT,
    status: 'ACTIVE' as const,
    isEmailVerified: true,
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearInMemoryRevokedBeforeStore();
  });

  it('rejects an otherwise valid unexpired access token when issued before revoked_before timestamp with 401 TOKEN_REVOKED', async () => {
    // Current time: T
    const nowSec = Math.floor(Date.now() / 1000);

    // Old token signed at T - 30s
    const oldIat = nowSec - 30;
    const oldToken = jwt.sign(
      { ...userPayload, iat: oldIat },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Set user:revoked_before to nowSec (T)
    await setUserRevokedBefore(userId, nowSec, 900);

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${oldToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_REVOKED');
    expect(res.body.error).toContain('Session has been revoked');
  });

  it('accepts a newly issued access token whose iat is after the revoked_before timestamp', async () => {
    const nowSec = Math.floor(Date.now() / 1000);

    // Set user:revoked_before to 10 seconds ago
    await setUserRevokedBefore(userId, nowSec - 10, 900);

    // New token signed at nowSec (after revoked_before)
    const newToken = jwt.sign(
      { ...userPayload, iat: nowSec },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    vi.spyOn(userRepository, 'findProfileByUserId').mockResolvedValue({
      id: userId,
      email: userPayload.email,
      role: userPayload.role,
      status: 'ACTIVE',
      isEmailVerified: true,
      passwordHash: 'hash',
      googleId: null,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      patient: {
        id: 'patient-1',
        userId,
        name: 'Patient Revoked Test',
        phone: null,
        dateOfBirth: null,
        gender: null,
        bloodGroup: null,
        allergies: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      professional: null,
    });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${newToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userId);
  });

  it('POST /api/v1/auth/logout-all revokes all database refresh tokens, sets Redis cutoff, and clears cookies', async () => {
    const validToken = jwt.sign(
      { ...userPayload, iat: Math.floor(Date.now() / 1000) },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const revokeAllSpy = vi
      .spyOn(authRepository, 'revokeAllUserRefreshTokens')
      .mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out from all devices');

    // Verifies database refresh tokens were revoked
    expect(revokeAllSpy).toHaveBeenCalledWith(userId);

    // Verifies revoked_before was set
    const cutoff = await getUserRevokedBefore(userId);
    expect(cutoff).not.toBeNull();
    expect(typeof cutoff).toBe('number');

    // Verifies auth cookies were cleared
    const setCookieHeaders = res.headers['set-cookie'] || [];
    const cookieStr = Array.isArray(setCookieHeaders) ? setCookieHeaders.join('; ') : setCookieHeaders;
    expect(cookieStr).toContain('access_token=;');
    expect(cookieStr).toContain('refresh_token=;');
  });
});
