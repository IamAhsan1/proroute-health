import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { Argon2Service } from '../argon2.service.js';
import { Role, Prisma } from '@prisma/client';

describe('POST /api/auth/login', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const credentials = {
    email: 'doctor@example.com',
    password: 'DoctorPassword123!',
  };

  it('should authenticate user with valid credentials and return access token + set cookies', async () => {
    const passwordHash = await Argon2Service.hashPassword(credentials.password);

    const mockDoctorUser: UserWithProfile = {
      id: 'uuid-doc-1',
      email: credentials.email,
      passwordHash,
      googleId: null,
      role: Role.DOCTOR,
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
      professional: {
        id: 'uuid-prof-1',
        userId: 'uuid-doc-1',
        profession: 'DOCTOR',
        specialtyId: 'spec-1',
        verificationStatus: 'APPROVED',
        consultationFee: new Prisma.Decimal(150),
        bio: 'Cardiologist',
        licenseNumber: 'MD-12345',
        medicalBoard: 'State Board',
        yearsOfExperience: 10,
        credentialDocumentUrl: null,
        rejectionReason: null,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockDoctorUser);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'uuid-token-2',
      tokenHash: 'hash',
      userId: 'uuid-doc-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.role).toBe('DOCTOR');
    expect(res.body.data.accessToken).toBeDefined();

    // Verify cookies set
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.join(';');
    expect(cookieHeader).toContain('access_token=');
    expect(cookieHeader).toContain('refresh_token=');
  });

  it('should reject login with wrong password with 401 Unauthorized', async () => {
    const passwordHash = await Argon2Service.hashPassword(credentials.password);

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'uuid-doc-1',
      email: credentials.email,
      passwordHash,
      googleId: null,
      role: Role.DOCTOR,
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
    });
    vi.spyOn(authRepository, 'incrementFailedLoginAttempts').mockResolvedValue({} as any);

    const res = await request(app).post('/api/auth/login').send({
      email: credentials.email,
      password: 'IncorrectPassword999!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid email or password');
  });

  it('should reject login for non-existent email with 401 Unauthorized', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'SomePassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with password exceeding 128 characters with 400 Bad Request', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: credentials.email,
      password: 'A1!' + 'x'.repeat(130),
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject login with 403 Forbidden when account status is SUSPENDED', async () => {
    const passwordHash = await Argon2Service.hashPassword(credentials.password);

    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'uuid-doc-suspended',
      email: credentials.email,
      passwordHash,
      googleId: null,
      role: Role.PATIENT,
      status: 'SUSPENDED',
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
    });

    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Account is suspended');
  });
});
