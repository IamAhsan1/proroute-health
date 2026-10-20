import crypto from 'crypto';
import { Role } from '@prisma/client';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/index.js';
import { Argon2Service } from './argon2.service.js';
import { JwtService } from './jwt.service.js';
import { AuthRepository, authRepository, UserWithProfile } from './auth.repository.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ChangePasswordInput,
  GoogleAuthInput,
} from './auth.schema.js';
import { AuthTokens, UserResponseDto } from './auth.types.js';
import { emailService, EmailService } from '../../services/email.service.js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/index.js';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private repo: AuthRepository = authRepository,
    private email: EmailService = emailService,
    googleClient?: OAuth2Client
  ) {
    this.googleClient = googleClient || new OAuth2Client(config.GOOGLE_CLIENT_ID);
  }

  public async register(
    input: RegisterInput
  ): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await Argon2Service.hashPassword(input.password);

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const createdUser = await this.repo.createUserWithProfile({
      email: input.email,
      passwordHash,
      role: input.role as Role,
      name: input.name,
      phone: input.phone,
      bio: input.bio,
      verificationToken: verificationTokenHash,
      verificationExpires,
    });

    // Non-blocking dispatch: sends activation email in background
    void this.email
      .sendVerificationEmail(createdUser.email, rawVerificationToken)
      .catch((err: unknown) => {
        console.error('Failed to dispatch verification email:', err);
      });

    const tokens = JwtService.generateTokens({
      id: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    // Store hashed refresh token in database (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.repo.createRefreshToken(
      createdUser.id,
      JwtService.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.formatUserResponse(createdUser),
      tokens,
    };
  }

  public async login(input: LoginInput): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 1. Check if account is temporarily locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ForbiddenError(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account was registered with Google. Please sign in with Google.');
    }

    const isValid = await Argon2Service.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      const nextAttempts = user.failedLoginAttempts + 1;
      let lockUntil: Date | undefined;
      if (nextAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lockout
      }
      await this.repo.incrementFailedLoginAttempts(user.id, lockUntil);

      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed login attempts and lock on successful authentication
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await this.repo.resetFailedLoginAttempts(user.id);
    }

    const tokens = JwtService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.repo.createRefreshToken(
      user.id,
      JwtService.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  public async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    let payload;
    try {
      payload = JwtService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = JwtService.hashToken(refreshToken);
    const dbToken = await this.repo.findRefreshToken(tokenHash);

    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    // Revoke used token (Token Rotation)
    await this.repo.revokeRefreshToken(dbToken.id);

    // Issue fresh token pair
    const tokens = JwtService.generateTokens({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.repo.createRefreshToken(
      payload.id,
      JwtService.hashToken(tokens.refreshToken),
      expiresAt
    );

    return tokens;
  }

  public async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const tokenHash = JwtService.hashToken(refreshToken);
      const dbToken = await this.repo.findRefreshToken(tokenHash);
      if (dbToken && !dbToken.revoked) {
        await this.repo.revokeRefreshToken(dbToken.id);
      }
    } catch (err) {
      // Quietly handle logout token lookup failures
    }
  }

  public async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      // User enumeration & timing defense: execute equivalent dummy crypto work before returning
      const dummyToken = crypto.randomBytes(32).toString('hex');
      crypto.createHash('sha256').update(dummyToken).digest('hex');
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.repo.setPasswordResetToken(user.id, tokenHash, expiresAt);

    // Non-blocking asynchronous dispatch: prevents SMTP latency from leaking existence via timing
    void this.email
      .sendPasswordResetEmail(user.email, rawToken)
      .catch((err: unknown) => {
        console.error('Failed to dispatch password reset email:', err);
      });
  }

  public async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');
    const newPasswordHash = await Argon2Service.hashPassword(input.newPassword);

    // Atomic transaction: validates unexpired token, consumes it via conditional update,
    // updates password, and revokes all active sessions in a single interactive transaction
    const user = await this.repo.resetPasswordAndRevokeSessions(tokenHash, newPasswordHash);

    // Send security alert email (outside transaction)
    void this.email
      .sendPasswordChangedAlert(user.email)
      .catch((err: unknown) => {
        console.error('Failed to dispatch password changed alert email:', err);
      });
  }

  public async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');
    await this.repo.verifyUserEmail(tokenHash);
  }

  public async resendVerification(input: ResendVerificationInput): Promise<void> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user || user.isEmailVerified) {
      // User enumeration & timing defense: execute equivalent dummy work before returning
      const dummyToken = crypto.randomBytes(32).toString('hex');
      crypto.createHash('sha256').update(dummyToken).digest('hex');
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.repo.setEmailVerificationToken(user.id, tokenHash, expiresAt);

    // Non-blocking dispatch
    void this.email
      .sendVerificationEmail(user.email, rawToken)
      .catch((err: unknown) => {
        console.error('Failed to dispatch verification email:', err);
      });
  }

  public async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestError('Cannot change password for an account created with Google OAuth.');
    }

    const isCurrentValid = await Argon2Service.verifyPassword(
      user.passwordHash,
      input.currentPassword
    );
    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await Argon2Service.hashPassword(input.newPassword);
    await this.repo.updatePasswordAndRevokeSessions(user.id, newPasswordHash);

    // Non-blocking security alert email
    void this.email
      .sendPasswordChangedAlert(user.email)
      .catch((err: unknown) => {
        console.error('Failed to dispatch password changed alert email:', err);
      });
  }

  public formatUserResponse(user: UserWithProfile): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      patient: user.patient
        ? {
            id: user.patient.id,
            name: user.patient.name,
            phone: user.patient.phone,
          }
        : null,
      professional: user.professional
        ? {
            id: user.professional.id,
            profession: user.professional.profession,
            specialtyId: user.professional.specialtyId,
            verificationStatus: user.professional.verificationStatus,
            consultationFee: user.professional.consultationFee,
            bio: user.professional.bio,
          }
        : null,
    };
  }

  public async loginWithGoogle(
    input: GoogleAuthInput
  ): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedError('Invalid or expired Google token');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError('Invalid Google token payload');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedError('Google email must be verified');
    }

    // 1. Check if user already linked this Google account
    let user = await this.repo.findUserByGoogleId(payload.sub);

    // 2. If not found by googleId, check by email (Account Linking)
    if (!user) {
      const existingUser = await this.repo.findUserByEmail(payload.email);
      if (existingUser) {
        user = await this.repo.linkGoogleId(existingUser.id, payload.sub);
      } else {
        // 3. New user registration via Google
        user = await this.repo.createGoogleUser({
          email: payload.email,
          googleId: payload.sub,
          role: (input.role as Role) || Role.PATIENT,
          name: payload.name || 'Google User',
        });
      }
    }

    // Generate tokens
    const tokens = JwtService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.repo.createRefreshToken(
      user.id,
      JwtService.hashToken(tokens.refreshToken),
      expiresAt
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }
}

export const authService = new AuthService();
