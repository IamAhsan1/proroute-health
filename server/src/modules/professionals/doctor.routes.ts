import { Router } from 'express';
import { professionalController } from './professional.controller.js';

const router = Router();

// Public doctor discovery directory (approved doctors only)
router.get('/', professionalController.getApprovedDoctors);
router.get('/:id', professionalController.getDoctorById);
router.get('/:id/slots', professionalController.getDoctorSlots);

export default router;
