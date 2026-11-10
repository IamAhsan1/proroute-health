import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

describe('Rate Limiting Middlewares', () => {
  it('should allow requests within limit and return standard headers', async () => {
    const testApp = express();
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    });

    testApp.use(testLimiter);
    testApp.get('/test', (_req, res) => {
      res.json({ success: true });
    });

    const res = await request(testApp).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['ratelimit']).toBeDefined();
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });

  it('should return 429 when rate limit is exceeded', async () => {
    const testApp = express();
    const strictLimiter = rateLimit({
      windowMs: 60 * 1000,
      limit: 2,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          statusCode: 429,
          error: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for test',
        });
      },
    });

    testApp.use(strictLimiter);
    testApp.get('/test', (_req, res) => {
      res.json({ success: true });
    });

    // 1st request -> 200
    await request(testApp).get('/test');
    // 2nd request -> 200
    await request(testApp).get('/test');
    // 3rd request -> 429
    const thirdRes = await request(testApp).get('/test');

    expect(thirdRes.status).toBe(429);
    expect(thirdRes.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(thirdRes.body.statusCode).toBe(429);
  });
});
