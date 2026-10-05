import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import { updateProfileSchema } from './user.types.js';
import { userService, UserService } from './user.service.js';

export class UserController {
  constructor(private service: UserService = userService) {}

  /**
   * GET /api/users/me
   * Resolves identity strictly from req.user.id (IDOR-safe)
   */
  public getMe = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.service.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/users/me
   * Mutates identity strictly for req.user.id
   */
  public updateMe = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedInput = updateProfileSchema.parse(req.body);
      const updated = await this.service.updateProfile(userId, validatedInput);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();
