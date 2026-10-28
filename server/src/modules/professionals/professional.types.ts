import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

export const updateProfessionalProfileSchema = z.object({
  specialtyId: z.string().uuid('Invalid specialty ID').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
  licenseNumber: z.string().min(3, 'License number must be at least 3 characters').max(50).optional(),
  medicalBoard: z.string().min(2, 'Medical board name must be at least 2 characters').max(100).optional(),
  yearsOfExperience: z.number().int().min(0, 'Years of experience cannot be negative').max(70).optional(),
  credentialDocumentUrl: z.string().max(500).optional(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;

export interface ProfessionalProfileResponseDto {
  id: string;
  userId: string;
  email: string;
  name: string;
  phone: string | null;
  profession: string;
  specialtyId: string | null;
  specialty: {
    id: string;
    name: string;
    slug: string;
  } | null;
  verificationStatus: VerificationStatus;
  consultationFee: number | null;
  bio: string | null;
  licenseNumber: string | null;
  medicalBoard: string | null;
  yearsOfExperience: number | null;
  credentialDocumentUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
