import { z } from 'zod';

export const specialtyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SpecialtyResponseDto = z.infer<typeof specialtyResponseSchema>;

export const specialtyParamsSchema = z.object({
  slug: z.string().min(1, 'Specialty slug is required'),
});

export type SpecialtyParams = z.infer<typeof specialtyParamsSchema>;
