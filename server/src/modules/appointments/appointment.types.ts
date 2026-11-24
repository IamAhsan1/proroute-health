import { z } from 'zod';
import { AppointmentStatus, Role } from '@prisma/client';

export const createAppointmentSchema = z
  .object({
    professionalId: z.string().uuid('Invalid professional ID'),
    startTimeUtc: z.string().datetime('Invalid ISO-8601 startTimeUtc'),
    endTimeUtc: z.string().datetime('Invalid ISO-8601 endTimeUtc'),
    notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  })
  .refine((data) => new Date(data.endTimeUtc).getTime() > new Date(data.startTimeUtc).getTime(), {
    message: 'endTimeUtc must be strictly after startTimeUtc',
    path: ['endTimeUtc'],
  })
  .refine((data) => new Date(data.startTimeUtc).getTime() > Date.now(), {
    message: 'Appointment startTimeUtc must be in the future',
    path: ['startTimeUtc'],
  });

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW']),
  reason: z.string().trim().max(500).optional(),
});

export const listAppointmentsQuerySchema = z.object({
  scope: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

export interface AppointmentResponseDto {
  id: string;
  patientId: string;
  professionalId: string;
  startTimeUtc: string;
  endTimeUtc: string;
  status: AppointmentStatus;
  consultationFee: number | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledByRole: Role | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

