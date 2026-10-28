import { Professional, VerificationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { UpdateProfessionalProfileInput } from './professional.types.js';

export type ProfessionalWithDetails = Professional & {
  user: {
    id: string;
    email: string;
    patient: { name: string; phone: string | null } | null;
  };
  specialty: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export class ProfessionalRepository {
  public async findByUserId(userId: string): Promise<ProfessionalWithDetails | null> {
    return prisma.professional.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            patient: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  public async findById(id: string): Promise<ProfessionalWithDetails | null> {
    return prisma.professional.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            patient: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  public async findByLicenseNumber(licenseNumber: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { licenseNumber },
    });
  }

  public async updateProfile(
    userId: string,
    data: UpdateProfessionalProfileInput,
    resetToPending: boolean = false
  ): Promise<ProfessionalWithDetails> {
    return prisma.professional.update({
      where: { userId },
      data: {
        ...(data.specialtyId !== undefined && { specialtyId: data.specialtyId }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.consultationFee !== undefined && { consultationFee: data.consultationFee }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.medicalBoard !== undefined && { medicalBoard: data.medicalBoard }),
        ...(data.yearsOfExperience !== undefined && { yearsOfExperience: data.yearsOfExperience }),
        ...(data.credentialDocumentUrl !== undefined && {
          credentialDocumentUrl: data.credentialDocumentUrl,
        }),
        ...(resetToPending && {
          verificationStatus: VerificationStatus.PENDING,
          rejectionReason: null,
          verifiedAt: null,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            patient: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  public async findPending(page = 1, limit = 20): Promise<{ items: ProfessionalWithDetails[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.professional.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              patient: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          specialty: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.professional.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    return { items, total };
  }

  public async updateVerificationStatus(
    id: string,
    status: VerificationStatus,
    rejectionReason?: string | null
  ): Promise<ProfessionalWithDetails> {
    return prisma.professional.update({
      where: { id },
      data: {
        verificationStatus: status,
        rejectionReason: status === VerificationStatus.REJECTED ? rejectionReason : null,
        verifiedAt: status === VerificationStatus.APPROVED ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            patient: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  public async findApprovedDoctors(params: {
    specialtySlug?: string;
    search?: string;
    minFee?: number;
    maxFee?: number;
    page?: number;
    limit?: number;
  }): Promise<{ items: ProfessionalWithDetails[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (params.specialtySlug) {
      where.specialty = {
        slug: params.specialtySlug,
        isActive: true,
      };
    }

    if (params.search) {
      where.OR = [
        { bio: { contains: params.search, mode: 'insensitive' } },
        { user: { patient: { name: { contains: params.search, mode: 'insensitive' } } } },
      ];
    }

    if (params.minFee !== undefined || params.maxFee !== undefined) {
      where.consultationFee = {
        ...(params.minFee !== undefined && { gte: params.minFee }),
        ...(params.maxFee !== undefined && { lte: params.maxFee }),
      };
    }

    const [items, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: { consultationFee: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              patient: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          specialty: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.professional.count({ where }),
    ]);

    return { items, total };
  }
}

export const professionalRepository = new ProfessionalRepository();
