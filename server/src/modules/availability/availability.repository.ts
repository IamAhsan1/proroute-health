import { prisma } from '../../lib/prisma.js';
import { DoctorAvailability, DoctorScheduleOverride, Professional } from '@prisma/client';

export interface CreateAvailabilityItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  isActive: boolean;
}

export interface UpsertOverrideInput {
  date: Date;
  isBlocked: boolean;
  customStartTime?: string | null;
  customEndTime?: string | null;
  reason?: string | null;
}

export class AvailabilityRepository {
  async findProfessionalByUserId(userId: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { userId },
    });
  }

  async findProfessionalById(id: string): Promise<Professional | null> {
    return prisma.professional.findUnique({
      where: { id },
    });
  }

  async updateDoctorTimezone(professionalId: string, timezone: string): Promise<Professional> {
    return prisma.professional.update({
      where: { id: professionalId },
      data: { timezone },
    });
  }

  async getAvailabilities(professionalId: string): Promise<DoctorAvailability[]> {
    return prisma.doctorAvailability.findMany({
      where: { professionalId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async replaceWeeklySchedule(
    professionalId: string,
    timezone: string,
    items: CreateAvailabilityItem[]
  ): Promise<DoctorAvailability[]> {
    return prisma.$transaction(async (tx) => {
      // 1. Update timezone on doctor profile
      await tx.professional.update({
        where: { id: professionalId },
        data: { timezone },
      });

      // 2. Delete existing recurring rules
      await tx.doctorAvailability.deleteMany({
        where: { professionalId },
      });

      // 3. Insert new recurring items if any
      if (items.length > 0) {
        await tx.doctorAvailability.createMany({
          data: items.map((item) => ({
            professionalId,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            slotDuration: item.slotDuration,
            bufferTime: item.bufferTime,
            isActive: item.isActive,
          })),
        });
      }

      // 4. Return new schedule
      return tx.doctorAvailability.findMany({
        where: { professionalId },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  async getOverrides(
    professionalId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DoctorScheduleOverride[]> {
    const where: any = { professionalId };
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.date = { gte: startDate };
    }

    return prisma.doctorScheduleOverride.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async findOverrideById(id: string): Promise<DoctorScheduleOverride | null> {
    return prisma.doctorScheduleOverride.findUnique({
      where: { id },
    });
  }

  async upsertOverride(
    professionalId: string,
    data: UpsertOverrideInput
  ): Promise<DoctorScheduleOverride> {
    return prisma.doctorScheduleOverride.upsert({
      where: {
        professionalId_date: {
          professionalId,
          date: data.date,
        },
      },
      update: {
        isBlocked: data.isBlocked,
        customStartTime: data.customStartTime,
        customEndTime: data.customEndTime,
        reason: data.reason,
      },
      create: {
        professionalId,
        date: data.date,
        isBlocked: data.isBlocked,
        customStartTime: data.customStartTime,
        customEndTime: data.customEndTime,
        reason: data.reason,
      },
    });
  }

  async deleteOverride(professionalId: string, overrideId: string): Promise<DoctorScheduleOverride | null> {
    const existing = await prisma.doctorScheduleOverride.findFirst({
      where: {
        id: overrideId,
        professionalId,
      },
    });

    if (!existing) return null;

    return prisma.doctorScheduleOverride.delete({
      where: { id: overrideId },
    });
  }
}

export const availabilityRepository = new AvailabilityRepository();

