import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { professionalController } from './professional.controller.js';

const router = Router();

// Doctor Private Profile Management
router.get(
  '/me',
  authenticate,
  requireRole(Role.DOCTOR),
  professionalController.getMe
);

router.patch(
  '/me',
  authenticate,
  requireRole(Role.DOCTOR),
  requireVerifiedEmail,
  professionalController.updateMe
);

export default router;
