import { BadRequestError, NotFoundError } from '../../utils/apiErrors.js';
import {
  AvailabilityRepository,
  availabilityRepository,
  CreateAvailabilityItem,
} from './availability.repository.js';
import {
  CreateOverrideDto,
  DayScheduleDto,
  ScheduleOverrideResponse,
  SetWeeklyScheduleDto,
  WeeklyScheduleResponse,
} from './availability.types.js';

export class AvailabilityService {
  constructor(private repo: AvailabilityRepository = availabilityRepository) {}

  private async getDoctorOrThrow(userId: string) {
    const prof = await this.repo.findProfessionalByUserId(userId);
    if (!prof) {
      throw new NotFoundError('Doctor profile not found');
    }
    return prof;
  }

  async getDoctorWeeklySchedule(userId: string): Promise<WeeklyScheduleResponse> {
    const prof = await this.getDoctorOrThrow(userId);
    const rules = await this.repo.getAvailabilities(prof.id);

    // Group existing rules by dayOfWeek (0 = Sunday ... 6 = Saturday)
    const daysMap = new Map<number, DayScheduleDto>();

    // Initialize all 7 days
    for (let day = 0; day <= 6; day++) {
      // Default: Monday (1) to Friday (5) active 09:00 - 17:00, Saturday (6) & Sunday (0) inactive
      const isDefaultActive = day >= 1 && day <= 5;
      daysMap.set(day, {
        dayOfWeek: day,
        isActive: isDefaultActive,
        windows: isDefaultActive ? [{ startTime: '09:00', endTime: '17:00' }] : [],
        slotDuration: 30,
        bufferTime: 5,
      });
    }

    if (rules.length > 0) {
      // Clear defaults for days present in database
      const presentDays = new Set<number>();
      for (const rule of rules) {
        presentDays.add(rule.dayOfWeek);
      }

      for (const day of presentDays) {
        const dayRules = rules.filter((r) => r.dayOfWeek === day);
        const activeRules = dayRules.filter((r) => r.isActive);
        const firstRule = dayRules[0];

        daysMap.set(day, {
          dayOfWeek: day,
          isActive: activeRules.length > 0,
          windows: activeRules.map((r) => ({
            startTime: r.startTime,
            endTime: r.endTime,
          })),
          slotDuration: (firstRule?.slotDuration as 15 | 30 | 45 | 60) || 30,
          bufferTime: (firstRule?.bufferTime as 0 | 5 | 10 | 15) || 5,
        });
      }
    }

    const days: DayScheduleDto[] = [];
    for (let day = 0; day <= 6; day++) {
      days.push(daysMap.get(day)!);
    }

    return {
      timezone: prof.timezone || 'Asia/Karachi',
      days,
    };
  }

  async setDoctorWeeklySchedule(
    userId: string,
    data: SetWeeklyScheduleDto
  ): Promise<WeeklyScheduleResponse> {
    const prof = await this.getDoctorOrThrow(userId);

    const items: CreateAvailabilityItem[] = [];

    for (const day of data.days) {
      if (day.isActive && day.windows.length > 0) {
        for (const win of day.windows) {
          items.push({
            dayOfWeek: day.dayOfWeek,
            startTime: win.startTime,
            endTime: win.endTime,
            slotDuration: day.slotDuration,
            bufferTime: day.bufferTime,
            isActive: true,
          });
        }
      } else {
        // Record inactive day with placeholder hours
        items.push({
          dayOfWeek: day.dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: day.slotDuration,
          bufferTime: day.bufferTime,
          isActive: false,
        });
      }
    }

    await this.repo.replaceWeeklySchedule(prof.id, data.timezone, items);
    return this.getDoctorWeeklySchedule(userId);
  }

  async getDoctorOverrides(
    userId: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<ScheduleOverrideResponse[]> {
    const prof = await this.getDoctorOrThrow(userId);

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr + 'T00:00:00.000Z');
      if (isNaN(startDate.getTime())) {
        throw new BadRequestError('Invalid startDate format');
      }
    }
    if (endDateStr) {
      endDate = new Date(endDateStr + 'T23:59:59.999Z');
      if (isNaN(endDate.getTime())) {
        throw new BadRequestError('Invalid endDate format');
      }
    }

    const overrides = await this.repo.getOverrides(prof.id, startDate, endDate);

    return overrides.map((o) => ({
      id: o.id,
      professionalId: o.professionalId,
      date: o.date.toISOString().slice(0, 10),
      isBlocked: o.isBlocked,
      customStartTime: o.customStartTime,
      customEndTime: o.customEndTime,
      reason: o.reason,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  async addDoctorOverride(
    userId: string,
    data: CreateOverrideDto
  ): Promise<ScheduleOverrideResponse> {
    const prof = await this.getDoctorOrThrow(userId);
    const dateObj = new Date(data.date + 'T00:00:00.000Z');

    if (isNaN(dateObj.getTime())) {
      throw new BadRequestError('Invalid date format');
    }

    const override = await this.repo.upsertOverride(prof.id, {
      date: dateObj,
      isBlocked: data.isBlocked,
      customStartTime: data.customStartTime || null,
      customEndTime: data.customEndTime || null,
      reason: data.reason || null,
    });

    return {
      id: override.id,
      professionalId: override.professionalId,
      date: override.date.toISOString().slice(0, 10),
      isBlocked: override.isBlocked,
      customStartTime: override.customStartTime,
      customEndTime: override.customEndTime,
      reason: override.reason,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
    };
  }

  async deleteDoctorOverride(userId: string, overrideId: string): Promise<void> {
    const prof = await this.getDoctorOrThrow(userId);
    const deleted = await this.repo.deleteOverride(prof.id, overrideId);

    if (!deleted) {
      throw new NotFoundError('Override not found or unauthorized');
    }
  }
}

export const availabilityService = new AvailabilityService();

