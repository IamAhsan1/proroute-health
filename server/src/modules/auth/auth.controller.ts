import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import { authService, AuthService } from './auth.service.js';
import { AuthTokens } from './auth.types.js';

const isProd = config.NODE_ENV === 'production';

export const setAuthCookies = (res: Response, tokens: AuthTokens): void => {
  // Access Token Cookie (15 mins)
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh Token Cookie (7 days, scoped to /api/auth)
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/auth',
  });
};

export class AuthController {
  constructor(private service: AuthService = authService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = registerSchema.parse(req.body);
      const result = await this.service.register(validatedInput);

      setAuthCookies(res, result.tokens);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await this.service.login(validatedInput);

      setAuthCookies(res, result.tokens);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = refreshSchema.parse(req.body || {});
      const token = req.cookies?.refresh_token || body.refreshToken;

      const tokens = await this.service.refresh(token);
      setAuthCookies(res, tokens);

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.refresh_token || req.body?.refreshToken;
      await this.service.logout(token);
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
