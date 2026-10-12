import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../../app.js';
import { authRepository, UserWithProfile } from '../auth.repository.js';
import { emailService } from '../../../services/email.service.js';
import { Role } from '@prisma/client';
import { BadRequestError } from '../../../utils/apiErrors.js';

describe('Password Recovery Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser: UserWithProfile = {
    id: 'user-uuid-1',
    email: 'patient@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$someOldPasswordHash',
    role: Role.PATIENT,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: 'patient-uuid-1',
      userId: 'user-uuid-1',
      name: 'John Patient',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    professional: null,
  };

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 generic message and send email when user exists', async () => {
      vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser);
      const setTokenSpy = vi
        .spyOn(authRepository, 'setPasswordResetToken')
        .mockResolvedValue(mockUser as any);
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendPasswordResetEmail')
        .mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'patient@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account exists');
      expect(setTokenSpy).toHaveBeenCalledOnce();
      expect(sendEmailSpy).toHaveBeenCalledOnce();
    });

    it('should return 200 without leaking when email does not exist (User Enumeration Defense)', async () => {
      vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendPasswordResetEmail')
        .mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account exists');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('should reject invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should successfully reset password, clear tokens, and revoke sessions', async () => {
      const rawToken = 'test-raw-reset-token-12345';
      const expectedTokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const resetTxSpy = vi
        .spyOn(authRepository, 'resetPasswordAndRevokeSessions')
        .mockResolvedValue({ id: mockUser.id, email: mockUser.email });
      const emailSpy = vi
        .spyOn(emailService, 'sendPasswordChangedAlert')
        .mockResolvedValue(undefined);

      const res = await request(app).post('/api/auth/reset-password').send({
        token: rawToken,
        newPassword: 'NewSecurePassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password reset successfully');
      expect(resetTxSpy).toHaveBeenCalledWith(expectedTokenHash, expect.any(String));
      expect(emailSpy).toHaveBeenCalledWith(mockUser.email);
    });

    it('should reject reset request when token is invalid or expired with 400 Bad Request', async () => {
      vi.spyOn(authRepository, 'resetPasswordAndRevokeSessions').mockRejectedValue(
        new BadRequestError('Password reset token is invalid or has expired')
      );

      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'expired-or-fake-token',
        newPassword: 'NewSecurePassword123!',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('invalid or has expired');
    });
  });
});
