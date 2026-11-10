import rateLimit from 'express-rate-limit';

/**
 * Global API rate limiter for all /api/v1 endpoints (DoS, resource exhaustion, and scraping defense).
 * In production: Allows up to 300 requests per 15 minutes per IP.
 * In development / test: Allows generous threshold (2000) so automated test suites and HMR run unhindered.
 */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId =
      (req as any).id ||
      (req.headers['x-request-id'] as string) ||
      (res.getHeader('x-request-id') as string) ||
      undefined;

    res.status(429).json({
      success: false,
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests from this IP. Please slow down and try again later.',
      ...(requestId && { requestId }),
    });
  },
});

/**
 * Sensitive authentication rate limiter (Login, Forgot Password, Reset Password)
 * In production: Limits IP to 10 failed attempts per 15 minutes.
 * In development / test: Allows generous threshold (100) so developer testing is not blocked.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts against the rate limiter
  handler: (req, res) => {
    const requestId =
      (req as any).id ||
      (req.headers['x-request-id'] as string) ||
      (res.getHeader('x-request-id') as string) ||
      undefined;

    res.status(429).json({
      success: false,
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      ...(requestId && { requestId }),
    });
  },
});

/**
 * Resend email verification rate limiter
 * Limits IP to prevent email spam.
 */
export const resendVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: process.env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    const requestId =
      (req as any).id ||
      (req.headers['x-request-id'] as string) ||
      (res.getHeader('x-request-id') as string) ||
      undefined;

    res.status(429).json({
      success: false,
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'EMAIL_RATE_LIMIT_EXCEEDED',
      message: 'Too many verification email requests. Please wait a few minutes before trying again.',
      ...(requestId && { requestId }),
    });
  },
});
