import { AppointmentStatus, Role } from '@prisma/client';
import { BadRequestError } from '../../utils/apiErrors';

export const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
] as const;

export const TERMINAL_APPOINTMENT_STATUSES = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.EXPIRED,
  AppointmentStatus.NO_SHOW,
] as const;

export const CANCELLATION_NOTICE_MS = 2 * 60 * 60 * 1000; // 2 hours

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.EXPIRED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.EXPIRED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

/**
 * Validates that transitioning from `from` to `to` is permitted by the deterministic
 * appointment lifecycle state machine. Throws BadRequestError for invalid or terminal jumps.
 */
export function assertValidTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestError(`Invalid appointment status transition from ${from} to ${to}`);
  }
}

/**
 * Enforces cancellation eligibility and policy rules:
 * - Only PENDING or CONFIRMED appointments may be cancelled.
 * - CONFIRMED appointments require at least 2 hours notice before startTimeUtc.
 * - Doctors must provide a non-empty cancellation reason.
 */
export function assertCanCancel(
  appointment: { status: AppointmentStatus; startTimeUtc: Date },
  actorRole: Role,
  reason?: string,
  now: Date = new Date()
): void {
  if (
    appointment.status !== AppointmentStatus.PENDING &&
    appointment.status !== AppointmentStatus.CONFIRMED
  ) {
    throw new BadRequestError(
      `Cannot cancel appointment in ${appointment.status} status`
    );
  }

  if (actorRole === Role.DOCTOR && (!reason || reason.trim().length === 0)) {
    throw new BadRequestError('Cancellation reason is required when a doctor cancels an appointment');
  }

  if (actorRole === Role.PATIENT && appointment.status === AppointmentStatus.CONFIRMED) {
    const msUntilStart = appointment.startTimeUtc.getTime() - now.getTime();
    if (msUntilStart < CANCELLATION_NOTICE_MS) {
      throw new BadRequestError(
        'Confirmed appointments must be cancelled at least 2 hours before the scheduled start time'
      );
    }
  }
}

