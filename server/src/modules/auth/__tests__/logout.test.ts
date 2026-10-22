import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository } from '../auth.repository.js';
import { JwtService } from '../jwt.service.js';
import { Role } from '@prisma/client';

describe('POST /api/auth/logout and POST /api/auth/refresh', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const samplePayload = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    role: Role.PATIENT,
  };

  it('should rotate refresh token and return new access token on valid refresh request', async () => {
    const tokens = JwtService.generateTokens(samplePayload);
    const tokenHash = JwtService.hashToken(tokens.refreshToken);

    vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
      revoked: false,
      createdAt: new Date(),
    });

    vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(),
      revoked: true,
      createdAt: new Date(),
    });

    vi.spyOn(authRepository, 'findUserById').mockResolvedValue({
      id: samplePayload.id,
      email: samplePayload.email,
      role: samplePayload.role,
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
      patient: null,
      professional: null,
    });

    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'token-db-2',
      tokenHash: 'new-hash',
      userId: samplePayload.id,
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${tokens.refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify old token was revoked
    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-db-1');
  });

  it('should reject refresh if token was already revoked with 401 Unauthorized and revoke all user sessions (RFC 6819)', async () => {
    const tokens = JwtService.generateTokens(samplePayload);
    const tokenHash = JwtService.hashToken(tokens.refreshToken);

    vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      revoked: true, // already revoked (replay attempt)
      createdAt: new Date(),
    });

    vi.spyOn(authRepository, 'revokeAllUserRefreshTokens').mockResolvedValue({
      count: 3,
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${tokens.refreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Compromised session token detected');
    expect(authRepository.revokeAllUserRefreshTokens).toHaveBeenCalledWith(samplePayload.id);
  });

  it('should clear cookies and revoke refresh token on logout', async () => {
    const tokens = JwtService.generateTokens(samplePayload);
    const tokenHash = JwtService.hashToken(tokens.refreshToken);

    vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      revoked: false,
      createdAt: new Date(),
    });

    vi.spyOn(authRepository, 'revokeRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(),
      revoked: true,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`refresh_token=${tokens.refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out');

    // Confirm cookies cleared
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.join(';');
    expect(cookieHeader).toContain('access_token=;');
    expect(cookieHeader).toContain('refresh_token=;');
  });

  it('should detect token reuse and reject second concurrent refresh attempt when token is rotated', async () => {
    const tokens = JwtService.generateTokens(samplePayload);
    const tokenHash = JwtService.hashToken(tokens.refreshToken);

    let isRevoked = false;
    vi.spyOn(authRepository, 'findRefreshToken').mockImplementation(async () => {
      return {
        id: 'token-race-1',
        tokenHash,
        userId: samplePayload.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        revoked: isRevoked,
        createdAt: new Date(),
      };
    });

    vi.spyOn(authRepository, 'revokeRefreshToken').mockImplementation(async () => {
      isRevoked = true;
      return {} as any;
    });

    vi.spyOn(authRepository, 'findUserById').mockResolvedValue({
      id: samplePayload.id,
      email: samplePayload.email,
      role: samplePayload.role,
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
      patient: null,
      professional: null,
    });

    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'token-race-2',
      tokenHash: 'new-race-hash',
      userId: samplePayload.id,
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    vi.spyOn(authRepository, 'revokeAllUserRefreshTokens').mockResolvedValue({ count: 2 });

    // Execute concurrently
    const [res1, res2] = await Promise.all([
      request(app).post('/api/auth/refresh').set('Cookie', [`refresh_token=${tokens.refreshToken}`]),
      request(app).post('/api/auth/refresh').set('Cookie', [`refresh_token=${tokens.refreshToken}`]),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 401]);
  });
});
