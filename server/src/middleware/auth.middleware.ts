import { Response, NextFunction } from 'express';
import { JwtService } from '../modules/auth/jwt.service.js';
import { AuthenticatedRequest } from '../modules/auth/auth.types.js';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token =
    req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
    return;
  }

  try {
    const payload = JwtService.verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
};
