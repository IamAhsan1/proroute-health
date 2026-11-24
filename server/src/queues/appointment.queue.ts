import { Queue } from 'bullmq';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

export const APPOINTMENT_EXPIRATION_QUEUE_NAME = 'appointment-expiration';

let appointmentExpirationQueue: Queue | null = null;
const inMemoryTimers = new Map<string, NodeJS.Timeout>();

export function getAppointmentExpirationQueue(): Queue | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!appointmentExpirationQueue) {
    const client = getRedisClient();
    if (client) {
      appointmentExpirationQueue = new Queue(APPOINTMENT_EXPIRATION_QUEUE_NAME, {
        connection: client.duplicate(),
      });
    }
  }

  return appointmentExpirationQueue;
}

export async function scheduleAppointmentExpiration(
  appointmentId: string,
  delayMs: number = 15 * 60 * 1000
): Promise<void> {
  const queue = getAppointmentExpirationQueue();
  const jobId = `expire-apt-${appointmentId}`;

  if (queue) {
    try {
      await queue.add(
        'expire-appointment',
        { appointmentId },
        {
          delay: Math.max(0, delayMs),
          jobId,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
      logger.info({ appointmentId, delayMs, jobId }, 'BullMQ: Scheduled appointment expiration job');
      return;
    } catch (err) {
      logger.error({ err, appointmentId }, 'Failed to schedule BullMQ expiration job; falling back to in-memory timer');
    }
  }

  // Fallback for dev / test when Redis is not running
  if (inMemoryTimers.has(appointmentId)) {
    clearTimeout(inMemoryTimers.get(appointmentId)!);
  }

  const timer = setTimeout(async () => {
    inMemoryTimers.delete(appointmentId);
    try {
      const { processExpirationJob } = await import('../workers/appointment-expiration.worker.js');
      await processExpirationJob(appointmentId);
    } catch (err) {
      logger.error({ err, appointmentId }, 'In-memory timer expiration job failed');
    }
  }, Math.min(delayMs, 2147483647));

  // Do not hold Node process alive if timer is long
  if (timer.unref) {
    timer.unref();
  }
  inMemoryTimers.set(appointmentId, timer);
}

export async function cancelAppointmentExpiration(appointmentId: string): Promise<void> {
  const queue = getAppointmentExpirationQueue();
  const jobId = `expire-apt-${appointmentId}`;

  if (queue) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info({ appointmentId, jobId }, 'BullMQ: Removed appointment expiration job early');
      }
    } catch (err) {
      logger.error({ err, appointmentId }, 'Failed to remove BullMQ expiration job');
    }
  }

  const timer = inMemoryTimers.get(appointmentId);
  if (timer) {
    clearTimeout(timer);
    inMemoryTimers.delete(appointmentId);
  }
}

export async function closeAppointmentQueue(): Promise<void> {
  if (appointmentExpirationQueue) {
    await appointmentExpirationQueue.close();
    appointmentExpirationQueue = null;
  }
  for (const timer of inMemoryTimers.values()) {
    clearTimeout(timer);
  }
  inMemoryTimers.clear();
}
