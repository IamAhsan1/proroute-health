import { prisma } from '../../lib/prisma.js';
import { UserWithProfile } from '../auth/auth.repository.js';
import { UpdateProfileInput } from './user.types.js';

export class UserRepository {
  /**
   * Fetches user strictly by userId derived from authentication context
   */
  public async findProfileByUserId(userId: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        professional: true,
      },
    });
  }

  /**
   * Updates user profile (patient or professional) strictly for the authenticated userId
   */
  public async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserWithProfile> {
    const user = await this.findProfileByUserId(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.patient && (data.name || data.phone !== undefined)) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          patient: {
            update: {
              ...(data.name && { name: data.name }),
              ...(data.phone !== undefined && { phone: data.phone }),
            },
          },
        },
        include: {
          patient: true,
          professional: true,
        },
      });
    }

    if (user.professional && (data.bio !== undefined || data.consultationFee !== undefined)) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          professional: {
            update: {
              ...(data.bio !== undefined && { bio: data.bio }),
              ...(data.consultationFee !== undefined && { consultationFee: data.consultationFee }),
            },
          },
        },
        include: {
          patient: true,
          professional: true,
        },
      });
    }

    return user;
  }
}

export const userRepository = new UserRepository();
