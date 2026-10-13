import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { emailService } from '../../../services/email.service.js';
import { Role } from '@prisma/client';
import { BadRequestError } from '../../../utils/apiErrors.js';

describe('Email Verification Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser: UserWithProfile = {
    id: 'user-uuid-1',
    email: 'patient@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$someOldPasswordHash',
    role: Role.PATIENT,
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
      id: 'patient-uuid-1',
      userId: 'user-uuid-1',
      name: 'John Doe',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    professional: null,
  };

  describe('GET /api/auth/verify-email', () => {
    it('should successfully verify email when token is valid and unexpired', async () => {
      const rawToken = 'test-raw-verification-token-12345';
      const expectedTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const verifySpy = vi
        .spyOn(authRepository, 'verifyUserEmail')
        .mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const res = await request(app).get(`/api/auth/verify-email?token=${rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Email verified successfully');
      expect(verifySpy).toHaveBeenCalledWith(expectedTokenHash);
    });

    it('should reject verification request when token is invalid or expired with 400 Bad Request', async () => {
      vi.spyOn(authRepository, 'verifyUserEmail').mockRejectedValue(
        new BadRequestError('Email verification token is invalid or has expired')
      );

      const res = await request(app).get('/api/auth/verify-email?token=expired-or-fake');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('invalid or has expired');
    });

    it('should reject request when token parameter is missing', async () => {
      const res = await request(app).get('/api/auth/verify-email');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should accept token in JSON body and verify email', async () => {
      const rawToken = 'test-body-verification-token';
      const expectedTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const verifySpy = vi
        .spyOn(authRepository, 'verifyUserEmail')
        .mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(verifySpy).toHaveBeenCalledWith(expectedTokenHash);
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should generate new token and dispatch email for unverified user', async () => {
      vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser);
      const setTokenSpy = vi
        .spyOn(authRepository, 'setEmailVerificationToken')
        .mockResolvedValue(mockUser as any);
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'patient@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an unverified account exists');
      expect(setTokenSpy).toHaveBeenCalledOnce();
      expect(sendEmailSpy).toHaveBeenCalledWith('patient@example.com', expect.any(String));
    });

    it('should return 200 without sending email if user does not exist (Enumeration Defense)', async () => {
      vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an unverified account exists');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('should return 200 without sending email if user is already verified', async () => {
      vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'patient@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('should reject invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
