import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface UserResponseDto {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  patient?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  professional?: {
    id: string;
    profession: string;
    specialtyId: string | null;
    verificationStatus: string;
    consultationFee: number | null;
    bio: string | null;
  } | null;
}
