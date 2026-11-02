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

export const specialtyIdParamSchema = z.object({
  id: z.string().uuid('Invalid specialty ID format'),
});

export const createSpecialtySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;

export const updateSpecialtySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
