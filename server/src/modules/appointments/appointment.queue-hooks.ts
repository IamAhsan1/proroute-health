import {
  scheduleAppointmentExpiration,
  cancelAppointmentExpiration,
} from '../../queues/appointment.queue.js';
import { enqueueEmailJob } from '../../queues/email.queue.js';
import { logger } from '../../lib/logger.js';

export interface AppointmentEmailPayload {
  appointmentId: string;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  startTimeUtc: string;
  endTimeUtc?: string;
  reason?: string | null;
}

/**
 * Queue & notification adapter for Appointment lifecycle events,
 * backed by persistent BullMQ queues with graceful local fallback.
 */
export const appointmentQueueHooks = {
  async scheduleExpiration(appointmentId: string, expiresAt: Date): Promise<void> {
    const delayMs = expiresAt.getTime() - Date.now();
    await scheduleAppointmentExpiration(appointmentId, delayMs);
  },

  async cancelExpiration(appointmentId: string): Promise<void> {
    await cancelAppointmentExpiration(appointmentId);
  },

  async sendConfirmationEmail(payload: AppointmentEmailPayload): Promise<void> {
    logger.info(
      { appointmentId: payload.appointmentId, to: payload.patientEmail },
      'Queueing appointment confirmation email'
    );
    await enqueueEmailJob({
      type: 'appointment-confirmed',
      to: payload.patientEmail,
      details: {
        doctorName: payload.doctorName,
        patientName: payload.patientName,
        startTimeUtc: payload.startTimeUtc,
        endTimeUtc: payload.endTimeUtc,
      },
    });
  },

  async sendCancellationEmail(payload: AppointmentEmailPayload): Promise<void> {
    logger.info(
      { appointmentId: payload.appointmentId, to: payload.patientEmail },
      'Queueing appointment cancellation email'
    );
    await enqueueEmailJob({
      type: 'appointment-cancelled',
      to: payload.patientEmail,
      details: {
        doctorName: payload.doctorName,
        patientName: payload.patientName,
        startTimeUtc: payload.startTimeUtc,
        reason: payload.reason ?? undefined,
      },
    });
  },
};
