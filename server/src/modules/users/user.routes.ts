import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { userController } from './user.controller.js';

const router = Router();

// All /api/users endpoints require authentication
router.use(authenticate);

// Current user profile management
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);

export default router;
