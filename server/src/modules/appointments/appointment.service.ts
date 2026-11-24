import { Appointment, AppointmentStatus, Prisma, Role, VerificationStatus } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/apiErrors.js';
import { logger } from '../../lib/logger.js';
import { expandDoctorSlots } from '../availability/slot-expansion.service.js';
import {
  appointmentRepository,
  AppointmentRepository,
  AppointmentWithParticipants,
} from './appointment.repository.js';
import {
  assertCanCancel,
  assertValidTransition,
} from './appointment.state-machine.js';
import {
  AppointmentResponseDto,
  CreateAppointmentInput,
  ListAppointmentsQuery,
} from './appointment.types.js';
import { appointmentQueueHooks } from './appointment.queue-hooks.js';

const PENDING_HOLD_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ACTIVE_PENDING_HOLDS = 2;

function formatDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export class AppointmentService {
  constructor(private repo: AppointmentRepository = appointmentRepository) {}

  private toDto(appointment: Appointment): AppointmentResponseDto {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      startTimeUtc: appointment.startTimeUtc.toISOString(),
      endTimeUtc: appointment.endTimeUtc.toISOString(),
      status: appointment.status,
      consultationFee:
        appointment.consultationFee !== null ? Number(appointment.consultationFee) : null,
      notes: appointment.notes,
      cancellationReason: appointment.cancellationReason,
      cancelledByRole: appointment.cancelledByRole,
      cancelledAt: appointment.cancelledAt ? appointment.cancelledAt.toISOString() : null,
      expiresAt: appointment.expiresAt ? appointment.expiresAt.toISOString() : null,
      confirmedAt: appointment.confirmedAt ? appointment.confirmedAt.toISOString() : null,
      startedAt: appointment.startedAt ? appointment.startedAt.toISOString() : null,
      completedAt: appointment.completedAt ? appointment.completedAt.toISOString() : null,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  private assertParticipantOwnership(
    appointment: AppointmentWithParticipants,
    userId: string,
    role: Role
  ): void {
    if (role === Role.PATIENT) {
      if (appointment.patient.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this appointment');
      }
      return;
    }

    if (role === Role.DOCTOR) {
      if (appointment.professional.userId !== userId) {
        throw new ForbiddenError('You do not have permission to access this appointment');
      }
      return;
    }

    if (role !== Role.ADMIN) {
      throw new ForbiddenError('Insufficient privileges to access this appointment');
    }
  }

  public async reserveSlot(
    userId: string,
    input: CreateAppointmentInput
  ): Promise<AppointmentResponseDto> {
    const patient = await this.repo.findPatientByUserId(userId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found');
    }

    const startTimeUtc = new Date(input.startTimeUtc);
    const endTimeUtc = new Date(input.endTimeUtc);

    let created: Appointment;
    try {
      created = await this.repo.bookSlotTransaction(
        {
          userId,
          patientId: patient.id,
          professionalId: input.professionalId,
          startTimeUtc,
          endTimeUtc,
          notes: input.notes,
        },
        ({
          doctor,
          rules,
          overrides,
          doctorOverlappingAppointments,
          patientActiveAppointments,
        }) => {
          if (doctor.verificationStatus !== VerificationStatus.APPROVED) {
            throw new NotFoundError('Doctor not found or not approved for booking');
          }

          if (doctor.userId === userId) {
            throw new BadRequestError('Doctors cannot book appointments with themselves');
          }

          const doctorTimezone = doctor.timezone || 'Asia/Karachi';
          const localDateStr = formatDateInTimezone(startTimeUtc, doctorTimezone);

          const expandedSlots = expandDoctorSlots({
            timezone: doctorTimezone,
            rules,
            overrides,
            startDateStr: localDateStr,
            endDateStr: localDateStr,
          });

          const requestedStartMs = startTimeUtc.getTime();
          const requestedEndMs = endTimeUtc.getTime();

          const matchesExpandedSlot = expandedSlots.some(
            (slot) =>
              new Date(slot.startUtc).getTime() === requestedStartMs &&
              new Date(slot.endUtc).getTime() === requestedEndMs
          );

          if (!matchesExpandedSlot) {
            throw new BadRequestError(
              'Requested time is not an available slot on this doctor’s schedule'
            );
          }

          if (doctorOverlappingAppointments.length > 0) {
            throw new ConflictError(
              'This time slot is already reserved or booked',
              'SLOT_ALREADY_BOOKED'
            );
          }

          const hasPatientOverlap = patientActiveAppointments.some(
            (apt) =>
              apt.startTimeUtc.getTime() < requestedEndMs &&
              apt.endTimeUtc.getTime() > requestedStartMs
          );

          if (hasPatientOverlap) {
            throw new ConflictError(
              'You already have another active appointment during this time slot',
              'PATIENT_TIME_CONFLICT'
            );
          }

          const activePendingCount = patientActiveAppointments.filter(
            (apt) => apt.status === AppointmentStatus.PENDING
          ).length;

          if (activePendingCount >= MAX_ACTIVE_PENDING_HOLDS) {
            throw new ConflictError(
              `You cannot hold more than ${MAX_ACTIVE_PENDING_HOLDS} pending appointments at the same time`,
              'MAX_PENDING_HOLDS_REACHED'
            );
          }

          const feeNumber =
            doctor.consultationFee !== null ? Number(doctor.consultationFee) : null;
          const isFree = feeNumber === null || feeNumber === 0;
          const now = new Date();

          return {
            status: isFree ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
            consultationFee: doctor.consultationFee,
            expiresAt: isFree ? null : new Date(now.getTime() + PENDING_HOLD_DURATION_MS),
            confirmedAt: isFree ? now : null,
          };
        }
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(
          'This time slot is already reserved or booked',
          'SLOT_ALREADY_BOOKED'
        );
      }
      throw err;
    }

    if (created.status === AppointmentStatus.PENDING && created.expiresAt) {
      void appointmentQueueHooks
        .scheduleExpiration(created.id, created.expiresAt)
        .catch((err: unknown) => {
          logger.warn({ err, appointmentId: created.id }, 'Failed to schedule expiration job');
        });
    } else if (created.status === AppointmentStatus.CONFIRMED) {
      void this.dispatchConfirmationEmail(created.id).catch((err: unknown) => {
        logger.warn({ err, appointmentId: created.id }, 'Failed to dispatch confirmation email');
      });
    }

    return this.toDto(created);
  }

  public async getAppointmentById(userId: string, role: Role, appointmentId: string) {
    const appointment = await this.repo.findByIdWithParticipants(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    this.assertParticipantOwnership(appointment, userId, role);

    return {
      ...this.toDto(appointment),
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.name,
        phone: appointment.patient.phone,
      },
      professional: {
        id: appointment.professional.id,
        name: appointment.professional.name,
        timezone: appointment.professional.timezone,
        consultationFee:
          appointment.professional.consultationFee !== null
            ? Number(appointment.professional.consultationFee)
            : null,
        specialty: appointment.professional.specialty,
      },
      statusHistory: (appointment.statusHistory || []).map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: h.changedBy,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  public async listMyAppointments(userId: string, role: Role, query: ListAppointmentsQuery) {
    if (role === Role.PATIENT) {
      const patient = await this.repo.findPatientByUserId(userId);
      if (!patient) {
        throw new NotFoundError('Patient profile not found');
      }

      const { items, total } = await this.repo.listForPatient(
        patient.id,
        query.scope,
        query.page,
        query.limit
      );

      return {
        items: items.map((item) => ({
          ...this.toDto(item),
          professional: {
            id: item.professional.id,
            name: item.professional.name,
            timezone: item.professional.timezone,
            consultationFee:
              item.professional.consultationFee !== null
                ? Number(item.professional.consultationFee)
                : null,
            specialty: item.professional.specialty,
          },
        })),
        total,
        page: query.page,
        limit: query.limit,
      };
    }

    if (role === Role.DOCTOR) {
      const professional = await this.repo.findProfessionalByUserId(userId);
      if (!professional) {
        throw new NotFoundError('Doctor profile not found');
      }

      const { items, total } = await this.repo.listForProfessional(
        professional.id,
        query.scope,
        query.page,
        query.limit
      );

      return {
        items: items.map((item) => ({
          ...this.toDto(item),
          patient: item.patient,
        })),
        total,
        page: query.page,
        limit: query.limit,
      };
    }

    throw new ForbiddenError('Only patients and doctors can list personal appointments');
  }

  public async cancelAppointment(
    userId: string,
    role: Role,
    appointmentId: string,
    reason?: string
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.repo.findByIdWithParticipants(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    this.assertParticipantOwnership(appointment, userId, role);

    assertCanCancel(
      { status: appointment.status, startTimeUtc: appointment.startTimeUtc },
      role,
      reason
    );

    const updated = await this.repo.transitionStatus(
      appointment.id,
      [appointment.status],
      AppointmentStatus.CANCELLED,
      {
        cancellationReason: reason?.trim() || null,
        cancelledByRole: role,
        cancelledAt: new Date(),
        expiresAt: null,
      },
      {
        fromStatus: appointment.status,
        changedBy: userId,
        reason: reason?.trim() || `Cancelled by ${role}`,
      }
    );

    if (appointment.status === AppointmentStatus.PENDING) {
      void appointmentQueueHooks.cancelExpiration(appointment.id).catch((err: unknown) => {
        logger.warn({ err, appointmentId: appointment.id }, 'Failed to cancel expiration job');
      });
    }

    void appointmentQueueHooks
      .sendCancellationEmail({
        appointmentId: appointment.id,
        patientEmail: appointment.patient.user.email,
        patientName: appointment.patient.name ?? 'Patient',
        doctorName: appointment.professional.name ?? 'Doctor',
        startTimeUtc: appointment.startTimeUtc.toISOString(),
        reason: reason?.trim() || null,
      })
      .catch((err: unknown) => {
        logger.warn({ err, appointmentId: appointment.id }, 'Failed to dispatch cancellation email');
      });

    return this.toDto(updated);
  }

  public async confirmPendingAppointment(
    userId: string,
    role: Role,
    appointmentId: string
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.repo.findByIdWithParticipants(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    this.assertParticipantOwnership(appointment, userId, role);

    if (appointment.expiresAt && appointment.expiresAt < new Date()) {
      throw new ConflictError(
        'This pending slot reservation has expired. Please select a new slot.',
        'SLOT_EXPIRED'
      );
    }

    assertValidTransition(appointment.status, AppointmentStatus.CONFIRMED);

    const updated = await this.repo.transitionStatus(
      appointment.id,
      [AppointmentStatus.PENDING],
      AppointmentStatus.CONFIRMED,
      {
        confirmedAt: new Date(),
        expiresAt: null,
      },
      {
        fromStatus: appointment.status,
        changedBy: userId,
        reason: `Confirmed by ${role} (pre-payment bridge)`,
      }
    );

    void appointmentQueueHooks.cancelExpiration(appointment.id).catch((err: unknown) => {
      logger.warn({ err, appointmentId: appointment.id }, 'Failed to cancel expiration job');
    });

    void appointmentQueueHooks
      .sendConfirmationEmail({
        appointmentId: appointment.id,
        patientEmail: appointment.patient.user.email,
        patientName: appointment.patient.name ?? 'Patient',
        doctorName: appointment.professional.name ?? 'Doctor',
        startTimeUtc: appointment.startTimeUtc.toISOString(),
      })
      .catch((err: unknown) => {
        logger.warn({ err, appointmentId: appointment.id }, 'Failed to dispatch confirmation email');
      });

    return this.toDto(updated);
  }

  public async updateLifecycleStatus(
    userId: string,
    appointmentId: string,
    targetStatus: AppointmentStatus,
    reason?: string
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.repo.findByIdWithParticipants(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.professional.userId !== userId) {
      throw new ForbiddenError('Only the assigned doctor can update this appointment status');
    }

    if (targetStatus === AppointmentStatus.NO_SHOW && new Date() < appointment.startTimeUtc) {
      throw new BadRequestError('Cannot mark appointment as NO_SHOW before scheduled start time');
    }

    if (
      targetStatus === AppointmentStatus.IN_PROGRESS &&
      new Date().getTime() < appointment.startTimeUtc.getTime() - 15 * 60 * 1000
    ) {
      throw new BadRequestError(
        'Cannot start appointment more than 15 minutes before scheduled start time'
      );
    }

    assertValidTransition(appointment.status, targetStatus);

    const now = new Date();
    const updateData: Prisma.AppointmentUpdateManyMutationInput = {};
    if (targetStatus === AppointmentStatus.CONFIRMED) {
      updateData.confirmedAt = now;
      updateData.expiresAt = null;
    } else if (targetStatus === AppointmentStatus.IN_PROGRESS) {
      updateData.startedAt = now;
    } else if (targetStatus === AppointmentStatus.COMPLETED) {
      updateData.completedAt = now;
    }

    const updated = await this.repo.transitionStatus(
      appointment.id,
      [appointment.status],
      targetStatus,
      updateData,
      {
        fromStatus: appointment.status,
        changedBy: userId,
        reason: reason?.trim() || `Status updated to ${targetStatus} by doctor`,
      }
    );

    if (appointment.status === AppointmentStatus.PENDING) {
      void appointmentQueueHooks.cancelExpiration(appointment.id).catch((err: unknown) => {
        logger.warn({ err, appointmentId: appointment.id }, 'Failed to cancel expiration job');
      });
    }

    if (targetStatus === AppointmentStatus.CONFIRMED) {
      void appointmentQueueHooks
        .sendConfirmationEmail({
          appointmentId: appointment.id,
          patientEmail: appointment.patient.user.email,
          patientName: appointment.patient.name ?? 'Patient',
          doctorName: appointment.professional.name ?? 'Doctor',
          startTimeUtc: appointment.startTimeUtc.toISOString(),
        })
        .catch((err: unknown) => {
          logger.warn(
            { err, appointmentId: appointment.id },
            'Failed to dispatch confirmation email'
          );
        });
    }

    return this.toDto(updated);
  }

  private async dispatchConfirmationEmail(appointmentId: string): Promise<void> {
    const full = await this.repo.findByIdWithParticipants(appointmentId);
    if (!full) return;
    await appointmentQueueHooks.sendConfirmationEmail({
      appointmentId: full.id,
      patientEmail: full.patient.user.email,
      patientName: full.patient.name ?? 'Patient',
      doctorName: full.professional.name ?? 'Doctor',
      startTimeUtc: full.startTimeUtc.toISOString(),
    });
  }
}

export const appointmentService = new AppointmentService();
