import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { Role } from '@prisma/client';

describe('POST /api/auth/register', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validPatient = {
    email: 'newpatient@example.com',
    password: 'Password123!',
    role: 'PATIENT',
    name: 'Jane Doe',
    phone: '+1234567890',
  };

  it('should successfully register a patient, set auth cookies, and return user profile', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    const mockCreatedUser: UserWithProfile = {
      id: 'uuid-user-1',
      email: validPatient.email,
      passwordHash: '$argon2id$...',
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
      patient: {
        id: 'uuid-patient-1',
        userId: 'uuid-user-1',
        name: validPatient.name,
        phone: validPatient.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      professional: null,
    };

    vi.spyOn(authRepository, 'createUserWithProfile').mockResolvedValue(mockCreatedUser);
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'uuid-token-1',
      tokenHash: 'hash',
      userId: 'uuid-user-1',
      expiresAt: new Date(),
      revoked: false,
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/register').send(validPatient);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validPatient.email);
    expect(res.body.data.user.role).toBe('PATIENT');
    expect(res.body.data.accessToken).toBeDefined();

    // Verify cookies set
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.join(';');
    expect(cookieHeader).toContain('access_token=');
    expect(cookieHeader).toContain('refresh_token=');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Strict');
  });

  it('should reject registration if email is already taken with 409 Conflict', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'existing-id',
      email: validPatient.email,
      passwordHash: 'hash',
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
    });

    const res = await request(app).post('/api/auth/register').send(validPatient);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('already exists');
  });

  it('should reject registration with weak password (missing special char or uppercase) with 400 Bad Request', async () => {
    const invalidData = {
      ...validPatient,
      password: 'weakpassword',
    };

    const res = await request(app).post('/api/auth/register').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject registration with excessively long password (> 128 chars) to mitigate Argon2 CPU DoS', async () => {
    const invalidData = {
      ...validPatient,
      password: 'A1!' + 'a'.repeat(130), // 133 chars
    };

    const res = await request(app).post('/api/auth/register').send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
    expect(JSON.stringify(res.body.details)).toContain('Password cannot exceed 128 characters');
  });

  it('should reject registration attempts with privileged role ADMIN with 400 Bad Request', async () => {
    const privilegedData = {
      ...validPatient,
      role: 'ADMIN',
    };

    const res = await request(app).post('/api/auth/register').send(privilegedData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject registration attempts with privileged role SUPER_ADMIN with 400 Bad Request', async () => {
    const privilegedData = {
      ...validPatient,
      role: 'SUPER_ADMIN',
    };

    const res = await request(app).post('/api/auth/register').send(privilegedData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should propagate 500 error and not issue tokens if database transaction fails during user creation', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'createUserWithProfile').mockRejectedValue(
      new Error('Database transaction deadlocked or connection reset')
    );

    const res = await request(app).post('/api/auth/register').send(validPatient);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeUndefined();
  });
});
