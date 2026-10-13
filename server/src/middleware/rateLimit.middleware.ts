import rateLimit from 'express-rate-limit';

/**
 * Sensitive authentication rate limiter (Login, Forgot Password, Reset Password)
 * Limits IP to 5 requests per 15 minutes in development and production.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT ? 1000 : 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Resend email verification rate limiter
 * Limits IP to 2 requests per 5 minutes to prevent email spam.
 */
export const resendVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT ? 1000 : 2,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification email requests. Please wait a few minutes before trying again.',
  },
});
