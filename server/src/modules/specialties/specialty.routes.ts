import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { specialtyController } from './specialty.controller.js';

const router = Router();

// 1. Admin-protected taxonomy management routes (Must come before /:slug)
router.get(
  '/admin/all',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  specialtyController.getAllAdmin
);
router.post(
  '/admin',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  specialtyController.createSpecialty
);
router.patch(
  '/admin/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  specialtyController.updateSpecialty
);
router.delete(
  '/admin/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  specialtyController.deleteSpecialty
);

// 2. Public routes for medical specialty querying
router.get('/', specialtyController.getSpecialties);
router.get('/:slug', specialtyController.getSpecialtyBySlug);

export default router;
