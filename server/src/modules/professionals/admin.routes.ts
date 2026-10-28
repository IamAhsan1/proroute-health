import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { professionalController } from './professional.controller.js';

const router = Router();

// All admin doctor management routes require ADMIN or SUPER_ADMIN
router.use(authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/pending', professionalController.getPending);
router.patch('/:id/approve', professionalController.approveDoctor);
router.patch('/:id/reject', professionalController.rejectDoctor);

export default router;
