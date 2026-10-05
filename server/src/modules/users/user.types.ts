import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  consultationFee: z.number().min(0).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
