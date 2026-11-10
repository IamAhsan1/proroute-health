import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireVerifiedEmail } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { availabilityController } from './availability.controller.js';

const router = Router();

// All doctor availability endpoints require authentication, DOCTOR role, and verified email
router.use(authenticate, requireRole(Role.DOCTOR), requireVerifiedEmail);

router.get('/', availabilityController.getSchedule);
router.put('/', availabilityController.updateSchedule);

router.get('/overrides', availabilityController.getOverrides);
router.post('/overrides', availabilityController.createOverride);
router.delete('/overrides/:id', availabilityController.deleteOverride);

export const doctorAvailabilityRoutes = router;
