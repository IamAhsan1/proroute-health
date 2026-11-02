import rateLimit from 'express-rate-limit';

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
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
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
  message: {
    success: false,
    error: 'Too many verification email requests. Please wait a few minutes before trying again.',
  },
});
