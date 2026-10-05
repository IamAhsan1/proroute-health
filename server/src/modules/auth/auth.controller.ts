import { Request, Response } from 'express';
import { config } from '../../config/index.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import { authService, AuthService } from './auth.service.js';
import { AuthTokens } from './auth.types.js';
import { asyncHandler, ApiResponse } from '../../utils/index.js';

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

  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedInput = registerSchema.parse(req.body);
    const result = await this.service.register(validatedInput);

    setAuthCookies(res, result.tokens);

    ApiResponse.created(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'User registered successfully'
    );
  });

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedInput = loginSchema.parse(req.body);
    const result = await this.service.login(validatedInput);

    setAuthCookies(res, result.tokens);

    ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'Login successful'
    );
  });

  public refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = refreshSchema.parse(req.body || {});
    const token = req.cookies?.refresh_token || body.refreshToken;

    const tokens = await this.service.refresh(token);
    setAuthCookies(res, tokens);

    ApiResponse.success(
      res,
      {
        accessToken: tokens.accessToken,
      },
      'Token refreshed successfully'
    );
  });

  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    await this.service.logout(token);
    clearAuthCookies(res);

    ApiResponse.success(res, null, 'Logged out successfully');
  });
}

export const authController = new AuthController();
