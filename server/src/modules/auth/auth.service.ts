import { Role } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware.js';
import { Argon2Service } from './argon2.service.js';
import { JwtService } from './jwt.service.js';
import { AuthRepository, authRepository, UserWithProfile } from './auth.repository.js';
import { RegisterInput, LoginInput } from './auth.schema.js';
import { AuthTokens, UserResponseDto } from './auth.types.js';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  public async register(
    input: RegisterInput
  ): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new AppError('An account with this email address already exists', 409);
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
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await Argon2Service.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
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
      throw new AppError('Refresh token required', 401);
    }

    let payload;
    try {
      payload = JwtService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const tokenHash = JwtService.hashToken(refreshToken);
    const dbToken = await this.repo.findRefreshToken(tokenHash);

    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      throw new AppError('Refresh token has been revoked or expired', 401);
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
