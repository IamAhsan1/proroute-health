import { Role, User, Patient, Professional, RefreshToken } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { BadRequestError } from '../../utils/apiErrors.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  phone?: string;
  bio?: string;
  verificationToken?: string;
  verificationExpires?: Date;
}

export type UserWithProfile = User & {
  patient: Patient | null;
  professional: Professional | null;
};

export class AuthRepository {
  public async findUserByEmail(email: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  public async findUserById(id: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  public async createUserWithProfile(data: CreateUserData): Promise<UserWithProfile> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          emailVerificationToken: data.verificationToken || null,
          emailVerificationExpires: data.verificationExpires || null,
        },
      });

      if (data.role === Role.DOCTOR) {
        await tx.professional.create({
          data: {
            userId: user.id,
            profession: 'DOCTOR',
            bio: data.bio || null,
          },
        });
      } else {
        await tx.patient.create({
          data: {
            userId: user.id,
            name: data.name,
            phone: data.phone || null,
          },
        });
      }

      const createdUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          patient: true,
          professional: true,
        },
      });

      return createdUser;
    });
  }

  public async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  public async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  public async revokeAllUserRefreshTokens(userId: string): Promise<{ count: number }> {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  public async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expiresAt,
      },
    });
  }

  public async resetPasswordAndRevokeSessions(
    tokenHash: string,
    newPasswordHash: string
  ): Promise<{ id: string; email: string }> {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Locate account via unique index on passwordResetToken
      const user = await tx.user.findUnique({
        where: { passwordResetToken: tokenHash },
        select: { id: true, email: true, passwordResetExpires: true },
      });

      if (!user || !user.passwordResetExpires || user.passwordResetExpires <= now) {
        throw new BadRequestError('Password reset token is invalid or has expired');
      }

      // 2. Atomically consume token and update password (conditional update prevents double-spend)
      const result = await tx.user.updateMany({
        where: {
          id: user.id,
          passwordResetToken: tokenHash,
          passwordResetExpires: { gt: now },
        },
        data: {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestError('Password reset token is invalid or has expired');
      }

      // 3. Revoke all active sessions
      await tx.refreshToken.updateMany({
        where: {
          userId: user.id,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });

      return { id: user.id, email: user.email };
    });
  }

  public async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: expiresAt,
      },
    });
  }

  public async verifyUserEmail(tokenHash: string): Promise<User> {
    const now = new Date();
    // Locate account via unique index on emailVerificationToken
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: tokenHash },
      select: { id: true, emailVerificationExpires: true },
    });

    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires <= now) {
      throw new BadRequestError('Email verification token is invalid or has expired');
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  public async purgeExpiredRefreshTokens(olderThanDays = 30): Promise<{ count: number }> {
    const thresholdDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    return prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revoked: true, createdAt: { lt: thresholdDate } },
        ],
      },
    });
  }

  public async updatePasswordAndRevokeSessions(
    userId: string,
    newPasswordHash: string
  ): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      }),
    ]);
  }

  public async incrementFailedLoginAttempts(
    userId: string,
    lockUntil?: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        ...(lockUntil ? { lockUntil } : {}),
      },
    });
  }

  public async resetFailedLoginAttempts(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  }

  public async findUserByGoogleId(googleId: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { googleId },
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  public async linkGoogleId(userId: string, googleId: string): Promise<UserWithProfile> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        isEmailVerified: true,
      },
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  public async createGoogleUser(data: {
    email: string;
    googleId: string;
    role: Role;
    name: string;
  }): Promise<UserWithProfile> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          googleId: data.googleId,
          role: data.role,
          isEmailVerified: true,
        },
      });

      if (data.role === Role.DOCTOR) {
        await tx.professional.create({
          data: {
            userId: user.id,
            profession: 'DOCTOR',
          },
        });
      } else {
        await tx.patient.create({
          data: {
            userId: user.id,
            name: data.name,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          patient: true,
          professional: true,
        },
      });
    });
  }
}

export const authRepository = new AuthRepository();
