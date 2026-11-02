import { z } from 'zod';

export const doctorCredentialsSchema = z.object({
  licenseNumber: z
    .string()
    .min(3, 'License number must be at least 3 characters')
    .max(50, 'License number is too long')
    .trim(),
  medicalBoard: z
    .string()
    .min(3, 'Licensing medical board or council is required')
    .max(100, 'Board name is too long')
    .trim(),
  specialtyId: z
    .string()
    .min(1, 'Please select your primary medical specialty'),
  yearsOfExperience: z.coerce
    .number({ invalid_type_error: 'Years of experience must be a number' })
    .int('Years of experience must be an integer')
    .min(0, 'Experience cannot be negative')
    .max(70, 'Experience cannot exceed 70 years')
    .default(5),
  consultationFee: z.coerce
    .number({ invalid_type_error: 'Consultation fee must be a valid amount' })
    .min(0, 'Fee cannot be negative')
    .max(5000, 'Fee cannot exceed $5,000')
    .default(45),
  bio: z
    .string()
    .max(2000, 'Summary cannot exceed 2000 characters')
    .optional()
    .default(''),
  credentialDocumentUrl: z
    .string()
    .url('Please provide a valid document URL')
    .optional()
    .or(z.literal(''))
    .default(''),
});

export type DoctorCredentialsFormData = z.infer<typeof doctorCredentialsSchema>;

