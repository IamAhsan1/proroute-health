import {
  Appointment,
  AppointmentStatus,
  DoctorAvailability,
  DoctorScheduleOverride,
  Prisma,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../utils/apiErrors.js';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  TERMINAL_APPOINTMENT_STATUSES,
} from './appointment.state-machine.js';

export interface LockedDoctorRow {
  id: string;
  userId: string;
  verificationStatus: VerificationStatus;
  consultationFee: Prisma.Decimal | null;
  timezone: string;
}

export interface ActiveAppointmentWindow {
  id: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  status: AppointmentStatus;
}

export interface BookSlotValidationContext {
  doctor: LockedDoctorRow;
  rules: DoctorAvailability[];
  overrides: DoctorScheduleOverride[];
  doctorOverlappingAppointments: ActiveAppointmentWindow[];
  patientActiveAppointments: ActiveAppointmentWindow[];
}

export interface BookSlotValidationResult {
  status: AppointmentStatus;
  consultationFee: Prisma.Decimal | null;
  expiresAt: Date | null;
  confirmedAt: Date | null;
}

export interface BookSlotTransactionParams {
  userId: string;
  patientId: string;
  professionalId: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
  notes?: string;
}

export const appointmentIncludeParticipants = {
  patient: {
    select: {
      id: true,
      userId: true,
      name: true,
      phone: true,
      user: { select: { id: true, email: true } },
    },
  },
  professional: {
    select: {
      id: true,
      userId: true,
      name: true,
      timezone: true,
      consultationFee: true,
      user: { select: { id: true, email: true } },
      specialty: { select: { id: true, name: true, slug: true } },
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      changedBy: true,
      reason: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithParticipants = Prisma.AppointmentGetPayload<{
  include: typeof appointmentIncludeParticipants;
}>;

export class AppointmentRepository {
  async findPatientByUserId(userId: string) {
    return prisma.patient.findUnique({
      where: { userId },
      select: { id: true, userId: true, name: true },
    });
  }

  async findProfessionalByUserId(userId: string) {
    return prisma.professional.findUnique({
      where: { userId },
      select: { id: true, userId: true, name: true },
    });
  }

  async bookSlotTransaction(
    params: BookSlotTransactionParams,
    validator: (ctx: BookSlotValidationContext) => BookSlotValidationResult
  ): Promise<Appointment> {
    return prisma.$transaction(async (tx) => {
      // 1. Row-level lock on Professional to serialize concurrent bookings for this doctor
      const lockedDoctors = await tx.$queryRaw<LockedDoctorRow[]>`
        SELECT id, "userId", "verificationStatus", "consultationFee", timezone
        FROM "Professional"
        WHERE id = ${params.professionalId}
        FOR UPDATE
      `;

      const doctor = lockedDoctors[0];
      if (!doctor) {
        throw new NotFoundError('Doctor not found');
      }

      // Fetch schedule overrides across +/- 1 day UTC window to cover any local timezone offset
      const overrideRangeStart = new Date(params.startTimeUtc.getTime() - 24 * 60 * 60 * 1000);
      const overrideRangeEnd = new Date(params.endTimeUtc.getTime() + 24 * 60 * 60 * 1000);

      const [rules, overrides, doctorOverlappingAppointments, patientActiveAppointments] =
        await Promise.all([
          tx.doctorAvailability.findMany({
            where: { professionalId: params.professionalId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          }),
          tx.doctorScheduleOverride.findMany({
            where: {
              professionalId: params.professionalId,
              date: {
                gte: overrideRangeStart,
                lte: overrideRangeEnd,
              },
            },
          }),
          tx.appointment.findMany({
            where: {
              professionalId: params.professionalId,
              status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
              startTimeUtc: { lt: params.endTimeUtc },
              endTimeUtc: { gt: params.startTimeUtc },
            },
            select: {
              id: true,
              startTimeUtc: true,
              endTimeUtc: true,
              status: true,
            },
          }),
          tx.appointment.findMany({
            where: {
              patientId: params.patientId,
              status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
            },
            select: {
              id: true,
              startTimeUtc: true,
              endTimeUtc: true,
              status: true,
            },
          }),
        ]);

      const decision = validator({
        doctor,
        rules,
        overrides,
        doctorOverlappingAppointments,
        patientActiveAppointments,
      });

      const created = await tx.appointment.create({
        data: {
          patientId: params.patientId,
          professionalId: params.professionalId,
          startTimeUtc: params.startTimeUtc,
          endTimeUtc: params.endTimeUtc,
          status: decision.status,
          consultationFee: decision.consultationFee,
          notes: params.notes ?? null,
          expiresAt: decision.expiresAt,
          confirmedAt: decision.confirmedAt,
        },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: created.id,
          fromStatus: null,
          toStatus: decision.status,
          changedBy: params.userId,
          reason:
            decision.status === AppointmentStatus.CONFIRMED
              ? 'Auto-confirmed free consultation'
              : 'Initial 15-minute reservation hold',
        },
      });

      return created;
    });
  }

  async findActiveAppointmentsForDoctor(
    professionalId: string,
    startUtc: Date,
    endUtc: Date
  ): Promise<ActiveAppointmentWindow[]> {
    return prisma.appointment.findMany({
      where: {
        professionalId,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        startTimeUtc: { lt: endUtc },
        endTimeUtc: { gt: startUtc },
      },
      select: {
        id: true,
        startTimeUtc: true,
        endTimeUtc: true,
        status: true,
      },
      orderBy: { startTimeUtc: 'asc' },
    });
  }

  async findByIdWithParticipants(id: string): Promise<AppointmentWithParticipants | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: appointmentIncludeParticipants,
    });
  }

  async listForPatient(
    patientId: string,
    scope: 'upcoming' | 'past' | 'all',
    page: number,
    limit: number
  ) {
    const where: Prisma.AppointmentWhereInput = { patientId };
    if (scope === 'upcoming') {
      where.status = { in: [...ACTIVE_APPOINTMENT_STATUSES] };
    } else if (scope === 'past') {
      where.status = { in: [...TERMINAL_APPOINTMENT_STATUSES] };
    }

    const orderBy: Prisma.AppointmentOrderByWithRelationInput =
      scope === 'upcoming' ? { startTimeUtc: 'asc' } : { startTimeUtc: 'desc' };

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          professional: {
            select: {
              id: true,
              name: true,
              timezone: true,
              consultationFee: true,
              specialty: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  async listForProfessional(
    professionalId: string,
    scope: 'upcoming' | 'past' | 'all',
    page: number,
    limit: number
  ) {
    const where: Prisma.AppointmentWhereInput = { professionalId };
    if (scope === 'upcoming') {
      where.status = { in: [...ACTIVE_APPOINTMENT_STATUSES] };
    } else if (scope === 'past') {
      where.status = { in: [...TERMINAL_APPOINTMENT_STATUSES] };
    }

    const orderBy: Prisma.AppointmentOrderByWithRelationInput =
      scope === 'upcoming' ? { startTimeUtc: 'asc' } : { startTimeUtc: 'desc' };

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, total };
  }

  async transitionStatus(
    id: string,
    expectedFromStatuses: readonly AppointmentStatus[],
    toStatus: AppointmentStatus,
    updateData: Prisma.AppointmentUpdateManyMutationInput,
    historyEntry: { fromStatus: AppointmentStatus; changedBy?: string; reason?: string }
  ): Promise<Appointment> {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.updateMany({
        where: {
          id,
          status: { in: [...expectedFromStatuses] },
        },
        data: {
          status: toStatus,
          ...updateData,
        },
      });

      if (updated.count === 0) {
        throw new ConflictError(
          'Appointment status changed concurrently; please refresh and try again',
          'APPOINTMENT_STATE_CONFLICT'
        );
      }

      const appointment = await tx.appointment.findUniqueOrThrow({
        where: { id },
      });

      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: id,
          fromStatus: historyEntry.fromStatus,
          toStatus,
          changedBy: historyEntry.changedBy ?? null,
          reason: historyEntry.reason ?? null,
        },
      });

      return appointment;
    });
  }
}

export const appointmentRepository = new AppointmentRepository();
