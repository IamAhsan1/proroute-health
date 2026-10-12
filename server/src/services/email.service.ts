import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { config } from '../config/index.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isEthereal = false;

  /**
   * Lazily initializes the Nodemailer Transporter.
   * If production SMTP credentials exist, connects using them.
   * If in development/test without credentials, creates an Ethereal disposable inbox.
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
      this.isEthereal = false;
    } else {
      // In development or test without explicit SMTP, provision an Ethereal disposable inbox
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isEthereal = true;
    }

    return this.transporter;
  }

  /**
   * Sends an email and prints a test preview URL in dev/test.
   */
  public async sendMail(options: EmailOptions): Promise<SentMessageInfo> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: config.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (this.isEthereal || config.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️ [EmailService] Preview delivered email: ${previewUrl}`);
      }
    }

    return info;
  }

  public async sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
    const resetUrl = `${config.CORS_ORIGIN}/reset-password?token=${rawToken}`;
    const subject = 'Reset your ProRoute password';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0284c7; margin: 0; font-size: 28px; font-weight: 800;">ProRoute Health</h1>
          <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Secure Healthcare Appointment Platform</p>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            We received a request to reset the password for your ProRoute account. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
            This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure.
          </p>
        </div>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Reset your ProRoute password by visiting: ${resetUrl}. This link is valid for 15 minutes.`,
    });
  }

  public async sendPasswordChangedAlert(to: string): Promise<void> {
    const subject = 'Security Alert: Your ProRoute password was changed';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0284c7; margin: 0; font-size: 28px; font-weight: 800;">ProRoute Health</h1>
        </div>
        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Changed</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            The password for your ProRoute account was recently changed. All other active sessions on your devices have been logged out for your security.
          </p>
          <p style="font-size: 14px; color: #dc2626; font-weight: 600;">
            If you did not make this change, please contact support immediately.
          </p>
        </div>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: 'Security Alert: Your ProRoute password was changed. If you did not make this change, please contact support immediately.',
    });
  }
}

export const emailService = new EmailService();
export default emailService;
