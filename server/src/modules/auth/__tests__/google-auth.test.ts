import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { OAuth2Client } from 'google-auth-library';
import { Role } from '@prisma/client';

describe('POST /api/auth/google', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockGooglePayload = {
    sub: 'google-sub-12345',
    email: 'google.user@example.com',
    email_verified: true,
    name: 'Google Patient',
  };

  const createMockTicket = (payload: unknown) => ({
    getPayload: () => payload,
  });

  it('should register and authenticate a brand new user via Google OAuth', async () => {
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(
      createMockTicket(mockGooglePayload) as any
    );

    vi.spyOn(authRepository, 'findUserByGoogleId').mockResolvedValue(null);
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    const mockCreatedUser: UserWithProfile = {
      id: 'uuid-google-1',
      email: mockGooglePayload.email,
      passwordHash: null,
      googleId: mockGooglePayload.sub,
      role: Role.PATIENT,
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
      patient: {
        id: 'patient-google-1',
        userId: 'uuid-google-1',
        name: mockGooglePayload.name,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      professional: null,
    };

    const createSpy = vi.spyOn(authRepository, 'createGoogleUser').mockResolvedValue(mockCreatedUser);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'token-uuid',
      tokenHash: 'hash',
      userId: 'uuid-google-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(mockGooglePayload.email);
    expect(res.body.data.user.isEmailVerified).toBe(true);
    expect(createSpy).toHaveBeenCalledWith({
      email: mockGooglePayload.email,
      googleId: mockGooglePayload.sub,
      role: Role.PATIENT,
      name: mockGooglePayload.name,
    });

    // Verify cookies set
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.join(';');
    expect(cookieHeader).toContain('access_token=');
    expect(cookieHeader).toContain('refresh_token=');
  });

  it('should link Google ID to existing user account with matching email', async () => {
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(
      createMockTicket(mockGooglePayload) as any
    );

    vi.spyOn(authRepository, 'findUserByGoogleId').mockResolvedValue(null);

    const existingUser: UserWithProfile = {
      id: 'uuid-existing-1',
      email: mockGooglePayload.email,
      passwordHash: 'existingPasswordHash',
      googleId: null,
      role: Role.PATIENT,
      status: 'ACTIVE',
      isEmailVerified: false,
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
    };

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(existingUser);
    const linkSpy = vi.spyOn(authRepository, 'linkGoogleId').mockResolvedValue({
      ...existingUser,
      googleId: mockGooglePayload.sub,
      isEmailVerified: true,
    });

    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'token-uuid-link',
      tokenHash: 'hash',
      userId: 'uuid-existing-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(linkSpy).toHaveBeenCalledWith('uuid-existing-1', mockGooglePayload.sub);
  });

  it('should reject invalid or expired Google tokens with 401 Unauthorized', async () => {
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(
      new Error('Token signature invalid')
    );

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'invalid-or-fake-token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid or expired Google token');
  });

  it('should reject unverified Google emails with 401 Unauthorized', async () => {
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue(
      createMockTicket({
        ...mockGooglePayload,
        email_verified: false,
      }) as any
    );

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token-unverified-email' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Google email must be verified');
  });

  it('should return 400 Bad Request when idToken is missing', async () => {
    const res = await request(app).post('/api/auth/google').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
