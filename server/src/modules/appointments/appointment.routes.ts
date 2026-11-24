import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { bookingRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { appointmentController } from './appointment.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(Role.PATIENT),
  requireVerifiedEmail,
  bookingRateLimiter,
  appointmentController.reserveSlot
);

router.get('/me', authenticate, appointmentController.listMyAppointments);

router.get('/:id', authenticate, appointmentController.getAppointmentById);

router.patch('/:id/cancel', authenticate, appointmentController.cancelAppointment);

router.patch('/:id/confirm', authenticate, appointmentController.confirmPendingAppointment);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(Role.DOCTOR),
  appointmentController.updateLifecycleStatus
);

export default router;
