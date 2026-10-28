import { VerificationStatus } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/apiErrors.js';
import { specialtyRepository, SpecialtyRepository } from '../specialties/specialty.repository.js';
import {
  ProfessionalRepository,
  professionalRepository,
  ProfessionalWithDetails,
} from './professional.repository.js';
import {
  ProfessionalProfileResponseDto,
  UpdateProfessionalProfileInput,
} from './professional.types.js';

export class ProfessionalService {
  constructor(
    private repo: ProfessionalRepository = professionalRepository,
    private specialtyRepo: SpecialtyRepository = specialtyRepository
  ) {}

  public formatProfessionalResponse(
    prof: ProfessionalWithDetails
  ): ProfessionalProfileResponseDto {
    return {
      id: prof.id,
      userId: prof.userId,
      email: prof.user.email,
      name: prof.user.patient?.name || 'Dr. Unknown',
      phone: prof.user.patient?.phone || null,
      profession: prof.profession,
      specialtyId: prof.specialtyId,
      specialty: prof.specialty
        ? {
            id: prof.specialty.id,
            name: prof.specialty.name,
            slug: prof.specialty.slug,
          }
        : null,
      verificationStatus: prof.verificationStatus,
      consultationFee:
        prof.consultationFee !== null ? Number(prof.consultationFee) : null,
      bio: prof.bio,
      licenseNumber: prof.licenseNumber,
      medicalBoard: prof.medicalBoard,
      yearsOfExperience: prof.yearsOfExperience,
      credentialDocumentUrl: prof.credentialDocumentUrl,
      rejectionReason: prof.rejectionReason,
      verifiedAt: prof.verifiedAt,
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
    };
  }

  public async getProfileByUserId(userId: string): Promise<ProfessionalProfileResponseDto> {
    const prof = await this.repo.findByUserId(userId);
    if (!prof) {
      throw new NotFoundError('Doctor profile not found');
    }
    return this.formatProfessionalResponse(prof);
  }

  public async updateProfile(
    userId: string,
    input: UpdateProfessionalProfileInput
  ): Promise<ProfessionalProfileResponseDto> {
    const current = await this.repo.findByUserId(userId);
    if (!current) {
      throw new NotFoundError('Doctor profile not found');
    }

    // Verify specialty exists and is active if provided
    if (input.specialtyId) {
      const specialty = await this.specialtyRepo.findById(input.specialtyId);
      if (!specialty || !specialty.isActive) {
        throw new BadRequestError('Invalid medical specialty selected');
      }
    }

    // Verify licenseNumber uniqueness if changing
    if (input.licenseNumber && input.licenseNumber !== current.licenseNumber) {
      const existing = await this.repo.findByLicenseNumber(input.licenseNumber);
      if (existing && existing.userId !== userId) {
        throw new ConflictError('A doctor with this license number already exists');
      }
    }

    // Determine if we should reset to PENDING:
    // 1. If currently REJECTED, submitting updates resets to PENDING
    // 2. If currently APPROVED, changing critical medical credentials (license, board, specialty) resets to PENDING
    const isChangingCriticalCredentials =
      (input.licenseNumber && input.licenseNumber !== current.licenseNumber) ||
      (input.specialtyId && input.specialtyId !== current.specialtyId) ||
      (input.medicalBoard && input.medicalBoard !== current.medicalBoard) ||
      input.credentialDocumentUrl !== undefined;

    const shouldResetToPending =
      current.verificationStatus === VerificationStatus.REJECTED ||
      (current.verificationStatus === VerificationStatus.APPROVED && isChangingCriticalCredentials);

    const updated = await this.repo.updateProfile(userId, input, Boolean(shouldResetToPending));
    return this.formatProfessionalResponse(updated);
  }

  public async getPendingDoctors(
    page = 1,
    limit = 20
  ): Promise<{ items: ProfessionalProfileResponseDto[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.repo.findPending(page, limit);
    return {
      items: items.map((item) => this.formatProfessionalResponse(item)),
      total,
      page,
      limit,
    };
  }

  public async approveDoctor(id: string): Promise<ProfessionalProfileResponseDto> {
    const doctor = await this.repo.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    if (!doctor.licenseNumber) {
      throw new BadRequestError('Doctor cannot be approved without a verified license number');
    }

    const approved = await this.repo.updateVerificationStatus(id, VerificationStatus.APPROVED);
    return this.formatProfessionalResponse(approved);
  }

  public async rejectDoctor(
    id: string,
    rejectionReason?: string
  ): Promise<ProfessionalProfileResponseDto> {
    const doctor = await this.repo.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }

    const rejected = await this.repo.updateVerificationStatus(
      id,
      VerificationStatus.REJECTED,
      rejectionReason || 'Application does not meet verification requirements'
    );
    return this.formatProfessionalResponse(rejected);
  }

  public async getApprovedDoctors(params: {
    specialtySlug?: string;
    search?: string;
    minFee?: number;
    maxFee?: number;
    page?: number;
    limit?: number;
  }): Promise<{ items: ProfessionalProfileResponseDto[]; total: number; page: number; limit: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const { items, total } = await this.repo.findApprovedDoctors({
      ...params,
      page,
      limit,
    });

    return {
      items: items.map((item) => this.formatProfessionalResponse(item)),
      total,
      page,
      limit,
    };
  }
}

export const professionalService = new ProfessionalService();
