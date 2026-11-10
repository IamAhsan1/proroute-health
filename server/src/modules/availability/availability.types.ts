import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const TimeWindowSchema = z
  .object({
    startTime: z.string().regex(timeRegex, { message: 'Invalid start time format (HH:mm)' }),
    endTime: z.string().regex(timeRegex, { message: 'Invalid end time format (HH:mm)' }),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

export type TimeWindowDto = z.infer<typeof TimeWindowSchema>;

function checkWindowsOverlap(windows: TimeWindowDto[]): boolean {
  if (windows.length <= 1) return false;
  const sorted = [...windows].sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endTime > sorted[i + 1].startTime) {
      return true; // Overlap detected
    }
  }
  return false;
}

export const DayScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    isActive: z.boolean(),
    windows: z.array(TimeWindowSchema).default([]),
    slotDuration: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
    bufferTime: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15)]).default(5),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true;
      if (data.windows.length === 0) return false; // Active day must have at least one window
      return !checkWindowsOverlap(data.windows);
    },
    {
      message: 'Active days must have at least one non-overlapping time window',
      path: ['windows'],
    }
  );

export type DayScheduleDto = z.infer<typeof DayScheduleSchema>;

export const SetWeeklyScheduleSchema = z.object({
  timezone: z.string().min(2).max(100).default('Asia/Karachi'),
  days: z.array(DayScheduleSchema).length(7, { message: 'Weekly schedule must contain exactly 7 days (0 to 6)' }),
});

export type SetWeeklyScheduleDto = z.infer<typeof SetWeeklyScheduleSchema>;

export const CreateOverrideSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
    isBlocked: z.boolean().default(false),
    customStartTime: z.string().regex(timeRegex, { message: 'Invalid start time format' }).optional().nullable(),
    customEndTime: z.string().regex(timeRegex, { message: 'Invalid end time format' }).optional().nullable(),
    reason: z.string().max(200, { message: 'Reason must be at most 200 characters' }).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.isBlocked) return true;
      if (!data.customStartTime || !data.customEndTime) return false;
      return data.customStartTime < data.customEndTime;
    },
    {
      message: 'Unblocked overrides require valid customStartTime and customEndTime where start < end',
      path: ['customEndTime'],
    }
  );

export type CreateOverrideDto = z.infer<typeof CreateOverrideSchema>;

export interface ScheduleOverrideResponse {
  id: string;
  professionalId: string;
  date: string;
  isBlocked: boolean;
  customStartTime: string | null;
  customEndTime: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyScheduleResponse {
  timezone: string;
  days: DayScheduleDto[];
}

export interface SlotDto {
  startUtc: string;
  endUtc: string;
  localStartTime: string;
  localEndTime: string;
  period: 'morning' | 'afternoon' | 'evening';
}

