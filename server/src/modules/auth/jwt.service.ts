import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/index.js';
import { AuthTokens, JwtPayload } from './auth.types.js';

export class JwtService {
  /**
   * Generates both Access Token (15m) and Refresh Token (7d)
   */
  public static generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verifies access token
   */
  public static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  }

  /**
   * Verifies refresh token
   */
  public static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
  }

  /**
   * Produces a secure SHA-256 hash of a refresh token to safely store in PostgreSQL
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
