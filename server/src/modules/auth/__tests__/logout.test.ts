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

  it('should reject refresh if token was already revoked with 401 Unauthorized', async () => {
    const tokens = JwtService.generateTokens(samplePayload);
    const tokenHash = JwtService.hashToken(tokens.refreshToken);

    vi.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({
      id: 'token-db-1',
      tokenHash,
      userId: samplePayload.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      revoked: true, // already revoked
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${tokens.refreshToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
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
});
