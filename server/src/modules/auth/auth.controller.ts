import { Request, Response } from 'express';
import { config } from '../../config/index.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
} from './auth.schema.js';
import { authService, AuthService } from './auth.service.js';
import { AuthTokens, AuthenticatedRequest } from './auth.types.js';
import { asyncHandler, ApiResponse, UnauthorizedError } from '../../utils/index.js';

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

  public forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedInput = forgotPasswordSchema.parse(req.body);
    await this.service.forgotPassword(validatedInput);

    ApiResponse.success(
      res,
      null,
      'If an account exists with that email, a password reset link has been sent.'
    );
  });

  public resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedInput = resetPasswordSchema.parse(req.body);
    await this.service.resetPassword(validatedInput);
    clearAuthCookies(res);

    ApiResponse.success(
      res,
      null,
      'Password reset successfully. Please log in with your new password.'
    );
  });

  public verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = typeof req.query.token === 'string' ? req.query.token : req.body?.token;
    const validatedInput = verifyEmailSchema.parse({ token });
    await this.service.verifyEmail(validatedInput);

    ApiResponse.success(
      res,
      null,
      'Email verified successfully. You may now access all platform features.'
    );
  });

  public resendVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedInput = resendVerificationSchema.parse(req.body);
    await this.service.resendVerification(validatedInput);

    ApiResponse.success(
      res,
      null,
      'If an unverified account exists with that email, a verification link has been sent.'
    );
  });

  public changePassword = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const validatedInput = changePasswordSchema.parse(req.body);
      await this.service.changePassword(req.user.id, validatedInput);
      clearAuthCookies(res);

      ApiResponse.success(
        res,
        null,
        'Password changed successfully. Please log in again with your new password.'
      );
    }
  );
}

export const authController = new AuthController();
