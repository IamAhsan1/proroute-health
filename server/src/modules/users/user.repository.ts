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

    const hasPatientFields =
      data.name !== undefined ||
      data.phone !== undefined ||
      data.dateOfBirth !== undefined ||
      data.gender !== undefined ||
      data.bloodGroup !== undefined ||
      data.allergies !== undefined ||
      data.emergencyContactName !== undefined ||
      data.emergencyContactPhone !== undefined;

    if (user.patient && hasPatientFields) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          patient: {
            update: {
              ...(data.name !== undefined && { name: data.name }),
              ...(data.phone !== undefined && { phone: data.phone }),
              ...(data.dateOfBirth !== undefined && {
                dateOfBirth: data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00.000Z`) : null,
              }),
              ...(data.gender !== undefined && { gender: data.gender }),
              ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
              ...(data.allergies !== undefined && { allergies: data.allergies }),
              ...(data.emergencyContactName !== undefined && {
                emergencyContactName: data.emergencyContactName,
              }),
              ...(data.emergencyContactPhone !== undefined && {
                emergencyContactPhone: data.emergencyContactPhone,
              }),
            },
          },
        },
        include: {
          patient: true,
          professional: true,
        },
      });
    }

    if (
      user.professional &&
      (data.name !== undefined || data.bio !== undefined || data.consultationFee !== undefined)
    ) {
      return prisma.user.update({
        where: { id: userId },
        data: {
          professional: {
            update: {
              ...(data.name !== undefined && { name: data.name }),
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
