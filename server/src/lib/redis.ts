import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
const inMemoryRevokedBeforeMap = new Map<string, { timestampSec: number; expiresAtMs: number }>();

export function isRedisConfigured(): boolean {
  return Boolean(config.REDIS_URL && config.REDIS_URL.trim().length > 0);
}

export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(config.REDIS_URL as string, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis connection error');
      });
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Redis client');
      redisClient = null;
    }
  }

  return redisClient;
}

export async function setUserRevokedBefore(
  userId: string,
  timestampSec: number,
  ttlSec: number = 15 * 60
): Promise<void> {
  const client = getRedisClient();
  const key = `user:revoked_before:${userId}`;

  if (client) {
    try {
      await client.set(key, timestampSec.toString(), 'EX', ttlSec);
      return;
    } catch (err) {
      logger.error({ err, userId }, 'Failed to write user:revoked_before to Redis; falling back to in-memory store');
    }
  }

  // Fallback to in-memory store when Redis is unavailable or unconfigured
  inMemoryRevokedBeforeMap.set(userId, {
    timestampSec,
    expiresAtMs: Date.now() + ttlSec * 1000,
  });
}

export async function getUserRevokedBefore(userId: string): Promise<number | null> {
  const client = getRedisClient();
  const key = `user:revoked_before:${userId}`;

  if (client) {
    try {
      const val = await client.get(key);
      if (val !== null) {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? null : parsed;
      }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to read user:revoked_before from Redis; falling back to in-memory store');
    }
  }

  // In-memory fallback lookup
  const entry = inMemoryRevokedBeforeMap.get(userId);
  if (!entry) return null;

  if (Date.now() > entry.expiresAtMs) {
    inMemoryRevokedBeforeMap.delete(userId);
    return null;
  }

  return entry.timestampSec;
}

export async function clearInMemoryRevokedBeforeStore(): Promise<void> {
  inMemoryRevokedBeforeMap.clear();
}

export async function closeRedisConnections(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}
