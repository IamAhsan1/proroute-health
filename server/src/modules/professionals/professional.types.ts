import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';

export const updateProfessionalProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  specialtyId: z.string().uuid('Invalid specialty ID').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  consultationFee: z.number().min(0, 'Consultation fee cannot be negative').finite('Consultation fee must be a valid finite number').optional(),
  licenseNumber: z.string().trim().min(3, 'License number must be at least 3 characters').max(50).optional(),
  medicalBoard: z.string().trim().min(2, 'Medical board name must be at least 2 characters').max(100).optional(),
  yearsOfExperience: z.number().int().min(0, 'Years of experience cannot be negative').max(70).optional(),
  credentialDocumentUrl: z.string().trim().max(500).optional(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;

export interface ProfessionalProfileResponseDto {
  id: string;
  userId: string;
  email: string;
  name: string;
  user?: {
    id: string;
    name: string;
    email: string;
    isEmailVerified: boolean;
  };
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
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
