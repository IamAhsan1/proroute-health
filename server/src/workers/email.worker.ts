import { Worker, Job } from 'bullmq';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';
import { emailService } from '../services/email.service.js';
import { EMAIL_QUEUE_NAME, EmailJobPayload } from '../queues/email.queue.js';
import { logger } from '../lib/logger.js';

let emailWorker: Worker | null = null;

export async function processEmailJob(payload: EmailJobPayload): Promise<void> {
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
    default:
      logger.warn({ payload }, 'Unknown email job payload type');
  }
}

export function startEmailWorker(): Worker | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!emailWorker) {
    const client = getRedisClient();
    if (client) {
      emailWorker = new Worker(
        EMAIL_QUEUE_NAME,
        async (job: Job<EmailJobPayload>) => {
          logger.info({ jobId: job.id, type: job.data.type, to: job.data.to }, 'Processing BullMQ email job');
          await processEmailJob(job.data);
        },
        {
          connection: client.duplicate(),
          concurrency: 3,
        }
      );

      emailWorker.on('completed', (job) => {
        logger.debug({ jobId: job.id }, 'BullMQ email job completed');
      });

      emailWorker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err }, 'BullMQ email job failed');
      });
    }
  }

  return emailWorker;
}

export async function stopEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
  }
}
