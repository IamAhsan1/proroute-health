import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { updateProfileSchema } from './user.types.js';
import { userService, UserService } from './user.service.js';
import { asyncHandler, ApiResponse } from '../../utils/index.js';

export class UserController {
  constructor(private service: UserService = userService) {}

  /**
   * GET /api/users/me
   * Resolves identity strictly from req.user.id (IDOR-safe)
   */
  public getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const profile = await this.service.getProfile(userId);
    ApiResponse.success(res, profile, 'User profile retrieved successfully');
  });

  /**
   * PATCH /api/users/me
   * Mutates identity strictly for req.user.id
   */
  public updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const validatedInput = updateProfileSchema.parse(req.body);
    const updated = await this.service.updateProfile(userId, validatedInput);
    ApiResponse.success(res, updated, 'User profile updated successfully');
  });
}

export const userController = new UserController();

