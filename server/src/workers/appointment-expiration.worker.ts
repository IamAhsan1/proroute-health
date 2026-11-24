import { Worker, Job } from 'bullmq';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';
import { APPOINTMENT_EXPIRATION_QUEUE_NAME } from '../queues/appointment.queue.js';
import { logger } from '../lib/logger.js';

let expirationWorker: Worker | null = null;

/**
 * Idempotently processes an appointment hold expiration.
 * Only transitions if the appointment is currently in PENDING status.
 */
export async function processExpirationJob(appointmentId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, status: true },
    });

    if (!appointment) {
      logger.warn({ appointmentId }, 'Appointment expiration worker: Appointment not found');
      return false;
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      logger.info(
        { appointmentId, currentStatus: appointment.status },
        'Appointment expiration worker: Appointment is no longer PENDING; skipping expiration (idempotent no-op)'
      );
      return false;
    }

    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.EXPIRED,
      },
    });

    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.PENDING,
        toStatus: AppointmentStatus.EXPIRED,
        reason: 'Reservation hold expired after 15 minutes',
      },
    });

    logger.info(
      { appointmentId },
      'Appointment hold expired successfully; slot is now freed for re-booking'
    );
    return true;
  });
}

export function startAppointmentExpirationWorker(): Worker | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!expirationWorker) {
    const client = getRedisClient();
    if (client) {
      expirationWorker = new Worker(
        APPOINTMENT_EXPIRATION_QUEUE_NAME,
        async (job: Job<{ appointmentId: string }>) => {
          logger.info({ jobId: job.id, data: job.data }, 'Processing BullMQ appointment expiration job');
          await processExpirationJob(job.data.appointmentId);
        },
        {
          connection: client.duplicate(),
          concurrency: 5,
        }
      );

      expirationWorker.on('completed', (job) => {
        logger.debug({ jobId: job.id }, 'BullMQ appointment expiration job completed');
      });

      expirationWorker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err }, 'BullMQ appointment expiration job failed');
      });
    }
  }

  return expirationWorker;
}

export async function stopAppointmentExpirationWorker(): Promise<void> {
  if (expirationWorker) {
    await expirationWorker.close();
    expirationWorker = null;
  }
}
