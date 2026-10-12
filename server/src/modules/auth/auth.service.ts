import crypto from 'crypto';
import { Role } from '@prisma/client';
import {
  ConflictError,
  UnauthorizedError,
} from '../../utils/index.js';
import { Argon2Service } from './argon2.service.js';
import { JwtService } from './jwt.service.js';
import { AuthRepository, authRepository, UserWithProfile } from './auth.repository.js';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema.js';
import { AuthTokens, UserResponseDto } from './auth.types.js';
import { emailService, EmailService } from '../../services/email.service.js';

export class AuthService {
  constructor(
    private repo: AuthRepository = authRepository,
    private email: EmailService = emailService
  ) {}

  public async register(
    input: RegisterInput
  ): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await Argon2Service.hashPassword(input.password);

    const createdUser = await this.repo.createUserWithProfile({
      email: input.email,
      passwordHash,
      role: input.role as Role,
      name: input.name,
      phone: input.phone,
      bio: input.bio,
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

    const isValid = await Argon2Service.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
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
      // User enumeration defense: return early without leaking email existence
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.repo.setPasswordResetToken(user.id, tokenHash, expiresAt);
    await this.email.sendPasswordResetEmail(user.email, rawToken);
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

  public formatUserResponse(user: UserWithProfile): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
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
}

export const authService = new AuthService();
