import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  authRateLimiter,
  resendVerificationLimiter,
} from '../../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/google', authRateLimiter, authController.googleAuth);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password Recovery
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);

// Email Verification
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, authController.resendVerification);

// Authenticated Password Management
router.post('/change-password', authenticate, authController.changePassword);

export default router;
