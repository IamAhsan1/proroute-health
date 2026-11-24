import { z } from 'zod';

const nullableTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val));

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: nullableTrimmed(30),
  dateOfBirth: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Date of birth must be in YYYY-MM-DD format'
    )
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', ''])
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN', ''])
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  allergies: nullableTrimmed(500),
  emergencyContactName: nullableTrimmed(100),
  emergencyContactPhone: nullableTrimmed(30),
  bio: z.string().max(500).optional(),
  consultationFee: z.number().min(0).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
