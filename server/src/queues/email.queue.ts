import { Queue } from 'bullmq';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../lib/logger.js';

export const EMAIL_QUEUE_NAME = 'email';

export type EmailJobPayload =
  | { type: 'verification'; to: string; rawToken: string }
  | { type: 'password-reset'; to: string; rawToken: string }
  | { type: 'security-alert'; to: string }
  | {
      type: 'appointment-confirmed';
      to: string;
      details: { doctorName?: string; patientName?: string; startTimeUtc?: string; endTimeUtc?: string };
    }
  | {
      type: 'appointment-cancelled';
      to: string;
      details: { doctorName?: string; patientName?: string; startTimeUtc?: string; reason?: string };
    };

let emailQueue: Queue | null = null;

export function getEmailQueue(): Queue | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!emailQueue) {
    const client = getRedisClient();
    if (client) {
      emailQueue = new Queue(EMAIL_QUEUE_NAME, {
        connection: client.duplicate(),
      });
    }
  }

  return emailQueue;
}

export async function enqueueEmailJob(payload: EmailJobPayload): Promise<void> {
  const queue = getEmailQueue();

  if (queue) {
    try {
      await queue.add('send-email', payload, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
      logger.info({ type: payload.type, to: payload.to }, 'BullMQ: Enqueued email job');
      return;
    } catch (err) {
      logger.error({ err, type: payload.type, to: payload.to }, 'Failed to enqueue BullMQ email job; falling back to direct send');
    }
  }

  // Direct delivery fallback when Redis is unconfigured or enqueuing fails
  try {
    switch (payload.type) {
      case 'verification':
        await emailService.sendVerificationEmail(payload.to, payload.rawToken);
        break;
      case 'password-reset':
        await emailService.sendPasswordResetEmail(payload.to, payload.rawToken);
        break;
      case 'security-alert':
        await emailService.sendPasswordChangedAlert(payload.to);
        break;
      case 'appointment-confirmed':
        await emailService.sendAppointmentConfirmedEmail(payload.to, payload.details);
        break;
      case 'appointment-cancelled':
        await emailService.sendAppointmentCancelledEmail(payload.to, payload.details);
        break;
    }
  } catch (err) {
    logger.error({ err, type: payload.type, to: payload.to }, 'Direct email delivery failed');
  }
}

export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
}
