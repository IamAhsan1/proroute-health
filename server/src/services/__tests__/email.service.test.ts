import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import { EmailService } from '../email.service.js';
import { config } from '../../config/index.js';

describe('EmailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize Ethereal transporter in development and send email when no external provider is configured', async () => {
    const originalResend = config.RESEND_API_KEY;
    const originalSendgrid = config.SENDGRID_API_KEY;
    config.RESEND_API_KEY = undefined;
    config.SENDGRID_API_KEY = undefined;

    const mockSendMail = vi.fn().mockResolvedValue({
      messageId: '<test-message-id@ethereal.email>',
    });

    vi.spyOn(nodemailer, 'createTestAccount').mockResolvedValue({
      user: 'test.ethereal@ethereal.email',
      pass: 'testpass123',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
      imap: { host: 'imap.ethereal.email', port: 993, secure: true },
      pop3: { host: 'pop3.ethereal.email', port: 995, secure: true },
      web: 'https://ethereal.email',
    });

    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    try {
      const emailService = new EmailService();

      const result = await emailService.sendMail({
        to: 'patient@example.com',
        subject: 'Welcome to ProRoute',
        html: '<h1>Welcome!</h1>',
        text: 'Welcome!',
      });

      expect(nodemailer.createTestAccount).toHaveBeenCalledOnce();
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'test.ethereal@ethereal.email',
            pass: 'testpass123',
          },
        })
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'patient@example.com',
          subject: 'Welcome to ProRoute',
          html: '<h1>Welcome!</h1>',
        })
      );
      expect(result.messageId).toBe('<test-message-id@ethereal.email>');
    } finally {
      config.RESEND_API_KEY = originalResend;
      config.SENDGRID_API_KEY = originalSendgrid;
    }
  });

  it('should initialize Resend transporter when RESEND_API_KEY is configured', async () => {
    const originalResend = config.RESEND_API_KEY;
    config.RESEND_API_KEY = 're_test_key_12345';

    const mockSendMail = vi.fn().mockResolvedValue({
      messageId: '<resend-msg-id>',
    });

    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    try {
      const emailService = new EmailService();

      await emailService.sendMail({
        to: 'patient@example.com',
        subject: 'Welcome to ProRoute',
        html: '<h1>Welcome!</h1>',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: 're_test_key_12345',
          },
        })
      );
    } finally {
      config.RESEND_API_KEY = originalResend;
    }
  });

  it('should reuse existing transporter for multiple emails', async () => {
    const originalResend = config.RESEND_API_KEY;
    const originalSendgrid = config.SENDGRID_API_KEY;
    config.RESEND_API_KEY = undefined;
    config.SENDGRID_API_KEY = undefined;

    const mockSendMail = vi.fn().mockResolvedValue({
      messageId: '<msg-1>',
    });

    vi.spyOn(nodemailer, 'createTestAccount').mockResolvedValue({
      user: 'test@ethereal.email',
      pass: 'pass',
    } as any);

    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    try {
      const emailService = new EmailService();

      await emailService.sendMail({
        to: 'user1@example.com',
        subject: 'First email',
        html: '<p>1</p>',
      });

      await emailService.sendMail({
        to: 'user2@example.com',
        subject: 'Second email',
        html: '<p>2</p>',
      });

      expect(nodemailer.createTransport).toHaveBeenCalledOnce();
      expect(mockSendMail).toHaveBeenCalledTimes(2);
    } finally {
      config.RESEND_API_KEY = originalResend;
      config.SENDGRID_API_KEY = originalSendgrid;
    }
  });

  it('should format and send email verification template', async () => {
    const emailService = new EmailService();
    const sendMailSpy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({} as any);

    await emailService.sendVerificationEmail('patient@example.com', 'raw-verify-token-123');

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'patient@example.com',
        subject: 'Verify your ProRoute Health account',
        html: expect.stringContaining('/verify-email?token=raw-verify-token-123'),
      })
    );
  });
});
