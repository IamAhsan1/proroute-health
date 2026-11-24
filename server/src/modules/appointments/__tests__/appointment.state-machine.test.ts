import { describe, it, expect } from 'vitest';
import { AppointmentStatus, Role } from '@prisma/client';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  ALLOWED_TRANSITIONS,
  TERMINAL_APPOINTMENT_STATUSES,
  assertCanCancel,
  assertValidTransition,
} from '../appointment.state-machine';
import { BadRequestError } from '../../../utils/apiErrors';

describe('appointment.state-machine', () => {
  describe('ACTIVE_APPOINTMENT_STATUSES', () => {
    it('contains PENDING, CONFIRMED, and IN_PROGRESS', () => {
      expect(ACTIVE_APPOINTMENT_STATUSES).toEqual([
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.IN_PROGRESS,
      ]);
    });
  });

  describe('assertValidTransition', () => {
    it('allows all valid lifecycle transitions', () => {
      const validPairs: Array<[AppointmentStatus, AppointmentStatus]> = [
        [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        [AppointmentStatus.PENDING, AppointmentStatus.CANCELLED],
        [AppointmentStatus.PENDING, AppointmentStatus.EXPIRED],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.NO_SHOW],
        [AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED],
      ];

      for (const [from, to] of validPairs) {
        expect(() => assertValidTransition(from, to)).not.toThrow();
      }
    });

    it('rejects invalid non-terminal transitions with BadRequestError', () => {
      const invalidPairs: Array<[AppointmentStatus, AppointmentStatus]> = [
        [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS],
        [AppointmentStatus.PENDING, AppointmentStatus.COMPLETED],
        [AppointmentStatus.PENDING, AppointmentStatus.NO_SHOW],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.EXPIRED],
        [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
        [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CONFIRMED],
        [AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW],
      ];

      for (const [from, to] of invalidPairs) {
        expect(() => assertValidTransition(from, to)).toThrow(BadRequestError);
      }
    });

    it('rejects all outgoing transitions from terminal states', () => {
      const allStatuses = Object.values(AppointmentStatus);

      for (const terminal of TERMINAL_APPOINTMENT_STATUSES) {
        expect(ALLOWED_TRANSITIONS[terminal]).toEqual([]);
        for (const target of allStatuses) {
          expect(() => assertValidTransition(terminal, target)).toThrow(BadRequestError);
        }
      }
    });
  });

  describe('assertCanCancel', () => {
    const baseNow = new Date('2026-11-15T10:00:00.000Z');

    it('allows patient to cancel PENDING appointment even close to start time without a reason', () => {
      const fiveMinutesLater = new Date(baseNow.getTime() + 5 * 60 * 1000);
      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.PENDING, startTimeUtc: fiveMinutesLater },
          Role.PATIENT,
          undefined,
          baseNow
        )
      ).not.toThrow();
    });

    it('requires a non-empty cancellation reason when a doctor cancels', () => {
      const threeHoursLater = new Date(baseNow.getTime() + 3 * 60 * 60 * 1000);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.PENDING, startTimeUtc: threeHoursLater },
          Role.DOCTOR,
          undefined,
          baseNow
        )
      ).toThrow(BadRequestError);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: threeHoursLater },
          Role.DOCTOR,
          '   ',
          baseNow
        )
      ).toThrow(BadRequestError);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: threeHoursLater },
          Role.DOCTOR,
          'Doctor emergency leave',
          baseNow
        )
      ).not.toThrow();
    });

    it('enforces the 2-hour cancellation policy window for CONFIRMED appointments', () => {
      const oneHour59MinLater = new Date(baseNow.getTime() + 119 * 60 * 1000);
      const exactlyTwoHoursLater = new Date(baseNow.getTime() + 120 * 60 * 1000);
      const twoHours1MinLater = new Date(baseNow.getTime() + 121 * 60 * 1000);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: oneHour59MinLater },
          Role.PATIENT,
          'Changed my mind',
          baseNow
        )
      ).toThrow(BadRequestError);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: exactlyTwoHoursLater },
          Role.PATIENT,
          'Changed my mind',
          baseNow
        )
      ).not.toThrow();

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: twoHours1MinLater },
          Role.PATIENT,
          undefined,
          baseNow
        )
      ).not.toThrow();
    });

    it('allows a doctor to cancel a CONFIRMED appointment with reason even inside the 2-hour window (clinical emergency)', () => {
      const thirtyMinutesLater = new Date(baseNow.getTime() + 30 * 60 * 1000);

      expect(() =>
        assertCanCancel(
          { status: AppointmentStatus.CONFIRMED, startTimeUtc: thirtyMinutesLater },
          Role.DOCTOR,
          'Urgent operating room emergency',
          baseNow
        )
      ).not.toThrow();
    });

    it('rejects cancellation for IN_PROGRESS and terminal statuses', () => {
      const futureStart = new Date(baseNow.getTime() + 5 * 60 * 60 * 1000);
      const nonCancellable: AppointmentStatus[] = [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.EXPIRED,
        AppointmentStatus.NO_SHOW,
      ];

      for (const status of nonCancellable) {
        expect(() =>
          assertCanCancel(
            { status, startTimeUtc: futureStart },
            Role.PATIENT,
            'Reason',
            baseNow
          )
        ).toThrow(BadRequestError);
      }
    });
  });
});

