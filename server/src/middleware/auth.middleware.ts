import { Response, NextFunction } from 'express';
import { JwtService } from '../modules/auth/jwt.service.js';
import { AuthenticatedRequest } from '../modules/auth/auth.types.js';
import { getUserRevokedBefore } from '../lib/redis.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Redis instant token invalidation check:
    // If user's sessions were revoked (password changed or logout-all), reject immediately even if 15m JWT has not expired
    const revokedBefore = await getUserRevokedBefore(payload.id);
    if (revokedBefore !== null && typeof payload.iat === 'number' && payload.iat <= revokedBefore) {
      res.status(401).json({
        success: false,
        error: 'Session has been revoked. Please log in again.',
        code: 'TOKEN_REVOKED',
      });
      return;
    }

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
      error: 'Forbidden: Email verification required. Please verify your email address to access this resource.',
      code: 'EMAIL_NOT_VERIFIED',
    });
    return;
  }

  next();
};
