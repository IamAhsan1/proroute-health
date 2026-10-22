import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { emailService } from '../../../services/email.service.js';
import { Argon2Service } from '../argon2.service.js';
import { JwtService } from '../jwt.service.js';
import { Role } from '@prisma/client';

describe('POST /api/auth/change-password', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const currentUser = {
    id: 'user-uuid-1',
    email: 'patient@example.com',
    role: Role.PATIENT,
  };

  const currentPassword = 'CurrentPassword123!';
  const newPassword = 'NewSecurePassword999!';

  const getMockUser = (passwordHash: string): UserWithProfile => ({
    id: currentUser.id,
    email: currentUser.email,
    passwordHash,
    googleId: null,
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
      id: 'patient-uuid-1',
      userId: currentUser.id,
      name: 'John Doe',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    professional: null,
  });

  it('should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).post('/api/auth/change-password').send({
      currentPassword,
      newPassword,
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject request when current password is wrong with 401 Unauthorized', async () => {
    const token = JwtService.generateTokens(currentUser).accessToken;
    const realPasswordHash = await Argon2Service.hashPassword(currentPassword);

    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(getMockUser(realPasswordHash));

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Current password is incorrect');
  });

  it('should reject request when new password fails complexity rules with 400 Bad Request', async () => {
    const token = JwtService.generateTokens(currentUser).accessToken;

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword,
        newPassword: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should successfully change password, revoke all refresh tokens, clear cookies, and send alert', async () => {
    const token = JwtService.generateTokens(currentUser).accessToken;
    const realPasswordHash = await Argon2Service.hashPassword(currentPassword);

    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(getMockUser(realPasswordHash));
    const updateSpy = vi
      .spyOn(authRepository, 'updatePasswordAndRevokeSessions')
      .mockResolvedValue(undefined);
    const emailSpy = vi
      .spyOn(emailService, 'sendPasswordChangedAlert')
      .mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword,
        newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Password changed successfully');
    expect(updateSpy).toHaveBeenCalledWith(currentUser.id, expect.any(String));
    expect(emailSpy).toHaveBeenCalledWith(currentUser.email);

    // Verify cookies cleared
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies.join(';');
    expect(cookieHeader).toContain('access_token=;');
    expect(cookieHeader).toContain('refresh_token=;');
  });
});
