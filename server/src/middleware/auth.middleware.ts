import { Response, NextFunction } from 'express';
import { JwtService } from '../modules/auth/jwt.service.js';
import { AuthenticatedRequest } from '../modules/auth/auth.types.js';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: No token provided',
    });
    return;
  }

  try {
    const payload = JwtService.verifyAccessToken(token);
    if (payload.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Account is suspended. Please contact customer support.',
      });
      return;
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      status: payload.status || 'ACTIVE',
      isEmailVerified: payload.isEmailVerified ?? false,
    };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired token',
    });
  }
};

/**
 * Middleware requiring verified email address on protected mutation endpoints
 */
export const requireVerifiedEmail = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Email verification required to access this resource',
    });
    return;
  }

  next();
};
