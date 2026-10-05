import { Role, User, Patient, Professional, RefreshToken } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  phone?: string;
  bio?: string;
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
}

export const authRepository = new AuthRepository();
