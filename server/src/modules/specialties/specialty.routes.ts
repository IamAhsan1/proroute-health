import { Router } from 'express';
import { specialtyController } from './specialty.controller.js';

const router = Router();

// Public routes for medical specialty querying
router.get('/', specialtyController.getSpecialties);
router.get('/:slug', specialtyController.getSpecialtyBySlug);

export default router;
